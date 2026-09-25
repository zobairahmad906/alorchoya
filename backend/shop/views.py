import logging
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.db import connection
from django.http import JsonResponse
from .models import Category, Product, ProductImage, Cart, CartItem, DeliveryZone, Order, OrderItem, CustomerProfile, CustomerAddress, Review
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer, OrderSerializer, CartSerializer, CartItemSerializer, DeliveryZoneSerializer, OrderTrackingSerializer, ReviewSerializer, CustomerProfileSerializer, CustomerAddressSerializer, CustomerOrderSerializer

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)

class CategoryList(generics.ListAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer

class ProductList(generics.ListAPIView):
    serializer_class = ProductSerializer
    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")
        featured = self.request.query_params.get("featured")
        if featured and featured.lower() in ("true", "1"):
            qs = qs.filter(is_featured=True)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category__slug=category)
        search = self.request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )
        return qs.order_by("-id")

class ProductDetail(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")
    serializer_class = ProductSerializer
    lookup_field = "slug"

class OrderCreate(generics.CreateAPIView):
    serializer_class = OrderSerializer
    throttle_scope = "orders"


class DeliveryZoneList(generics.ListAPIView):
    queryset = DeliveryZone.objects.filter(is_active=True).order_by("charge")
    serializer_class = DeliveryZoneSerializer
class OrderTrack(generics.RetrieveAPIView):
    serializer_class = OrderTrackingSerializer
    def get_object(self):
        order_id = self.request.query_params.get("id")
        phone = self.request.query_params.get("phone", "").strip()
        if not order_id or not phone:
            raise NotFound("Order id এবং phone দিন।")
        try:
            return Order.objects.get(id=order_id, phone=phone)
        except Order.DoesNotExist:
            raise NotFound("এই তথ্য দিয়ে কোনো order পাওয়া যায়নি।")

class ReviewCreate(generics.CreateAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.AllowAny,)
    throttle_scope = "reviews"
    def perform_create(self, serializer):
        product = Product.objects.filter(slug=self.kwargs["slug"], is_active=True).first()
        if not product:
            raise NotFound("Product not found.")
        user = self.request.user
        avatar = ""
        if user and user.is_authenticated:
            display_name = user.get_full_name() or user.email or user.username
            user_email = user.email
            if hasattr(user, "customer_profile") and user.customer_profile.avatar_url:
                avatar = user.customer_profile.avatar_url
        else:
            display_name = serializer.validated_data.get("customer_name") or "সন্তুষ্ট কাস্টমার"
            user_email = serializer.validated_data.get("email", "")
            avatar = serializer.validated_data.get("avatar_url", "")
        serializer.save(product=product, customer_name=display_name, email=user_email, avatar_url=avatar, is_approved=True)

class FeaturedReviewList(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = (permissions.AllowAny,)
    def get_queryset(self):
        return Review.objects.filter(is_approved=True, rating=5).select_related("product").order_by("-created_at")[:6]

class CartDetail(generics.RetrieveAPIView):
    serializer_class = CartSerializer

    def get_object(self):
        token = self.kwargs.get("token")
        user = self.request.user if self.request.user.is_authenticated else None
        if user:
            # First check if user already has an active cart
            user_cart = Cart.objects.filter(user=user).order_by("-updated_at").first()
            if user_cart:
                return user_cart
            # If token exists, attach user to it
            cart = Cart.objects.filter(token=token).first()
            if cart:
                cart.user = user
                cart.save(update_fields=["user"])
                return cart
            return Cart.objects.create(token=token, user=user)
        
        cart, _ = Cart.objects.get_or_create(token=token)
        return cart

@method_decorator(csrf_exempt, name="dispatch")
class CartItemCreate(generics.CreateAPIView):
    authentication_classes = []
    serializer_class = CartItemSerializer
    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        token = self.kwargs["token"]
        if user:
            cart = Cart.objects.filter(user=user).order_by("-updated_at").first()
            if not cart:
                cart, _ = Cart.objects.get_or_create(token=token, defaults={"user": user})
                if not cart.user:
                    cart.user = user
                    cart.save(update_fields=["user"])
        else:
            cart, _ = Cart.objects.get_or_create(token=token)

        product = Product.objects.get(pk=serializer.validated_data["product_id"], is_active=True)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": serializer.validated_data["quantity"]})
        if not created:
            item.quantity = serializer.validated_data["quantity"]
            item.save(update_fields=["quantity"])
        serializer.instance = item

@method_decorator(csrf_exempt, name="dispatch")
class CartItemDetail(APIView):
    authentication_classes = []
    def delete(self, request, token, product_id):
        user = request.user if request.user.is_authenticated else None
        if user:
            CartItem.objects.filter(cart__user=user, product_id=product_id).delete()
        else:
            CartItem.objects.filter(cart__token=token, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProductMultiImageUploadView(generics.GenericAPIView):
    permission_classes = (permissions.IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser)
    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Product not found.")
        
        files = request.FILES.getlist("images")
        if not files:
            return Response({"error": "No images provided under 'images' field."}, status=400)
        for file_obj in files:
            if not file_obj.content_type.startswith("image/") or file_obj.size > 5 * 1024 * 1024:
                return Response({"error": "Only image files up to 5MB are allowed."}, status=400)
            
        created_images = []
        has_primary = product.images.filter(is_primary=True).exists()
        for idx, file_obj in enumerate(files):
            img = ProductImage.objects.create(
                product=product,
                image=file_obj,
                alt_text=f"{product.name} image {idx + 1}",
                is_primary=(not has_primary and idx == 0)
            )
            created_images.append(img)
            
        serializer = ProductImageSerializer(created_images, many=True, context={"request": request})
        return Response({"message": f"{len(created_images)}টি ছবি সফলভাবে আপলোড করা হয়েছে।", "images": serializer.data}, status=201)

def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return JsonResponse({"status": "ok", "database": "ok"})
    except Exception:
        logger.exception("Health database probe failed")
        return JsonResponse({"status": "degraded", "database": "unavailable"}, status=503)


class CustomerProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get_profile(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)
        return profile
    def get(self, request):
        profile = self.get_profile(request)
        return Response({"profile": CustomerProfileSerializer(profile).data, "addresses": CustomerAddressSerializer(profile.addresses.all(), many=True).data, "orders": CustomerOrderSerializer(request.user.customer_orders.all()[:20], many=True).data})
    def patch(self, request):
        profile = self.get_profile(request)
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True); serializer.save()
        name = request.data.get("name")
        if name:
            parts = str(name).strip().split(" ", 1); request.user.first_name = parts[0][:150]; request.user.last_name = parts[1][:150] if len(parts) > 1 else ""; request.user.save(update_fields=("first_name", "last_name"))
        return self.get(request)

class CustomerAddressListCreate(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get_profile(self, request): return CustomerProfile.objects.get_or_create(user=request.user)[0]
    def get(self, request): return Response(CustomerAddressSerializer(self.get_profile(request).addresses.all(), many=True).data)
    def post(self, request):
        profile = self.get_profile(request); data = request.data.copy()
        if not data.get("recipient_name"): data["recipient_name"] = request.user.get_full_name() or request.user.email
        serializer = CustomerAddressSerializer(data=data); serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_default"): profile.addresses.update(is_default=False)
        address = serializer.save(profile=profile)
        return Response(CustomerAddressSerializer(address).data, status=status.HTTP_201_CREATED)

class CustomerAddressDetail(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def get_object(self, request, pk): return CustomerAddress.objects.get(pk=pk, profile__user=request.user)
    def patch(self, request, pk):
        address = self.get_object(request, pk); serializer = CustomerAddressSerializer(address, data=request.data, partial=True); serializer.is_valid(raise_exception=True)
        if serializer.validated_data.get("is_default"): address.profile.addresses.exclude(pk=pk).update(is_default=False)
        return Response(CustomerAddressSerializer(serializer.save()).data)
    def delete(self, request, pk): self.get_object(request, pk).delete(); return Response(status=status.HTTP_204_NO_CONTENT)

class CustomerLogout(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        from django.contrib.auth import logout
        logout(request); return Response({"ok": True})


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@method_decorator(csrf_exempt, name="dispatch")
class AdminLoginView(APIView):
    permission_classes = (permissions.AllowAny,)
    authentication_classes = []

    def post(self, request):
        from django.contrib.auth import authenticate, login
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response({"error": "ব্যবহারকারীর নাম এবং পাসওয়ার্ড লিখুন।"}, status=400)

        user = authenticate(request, username=username, password=password)
        if user is None:
            # Try by email as well
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user_obj = User.objects.filter(email=username).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)

        if user is not None:
            if not (user.is_staff or user.is_superuser):
                return Response({"error": "আপনার অ্যাডমিন অ্যাক্সেস পাওয়ার পারমিশন নেই।"}, status=403)
            login(request, user)
            return Response({"message": "সফলভাবে লগইন হয়েছে।", "username": user.username, "is_superuser": user.is_superuser})
        
        return Response({"error": "ইউজারনেম বা পাসওয়ার্ড ভুল হয়েছে।"}, status=400)



# ==================== ADMIN DASHBOARD APIS ====================
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta

class AdminDashboardStatsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)

        orders_qs = Order.objects.all()
        total_orders = orders_qs.count()
        pending_orders = orders_qs.filter(status="pending").count()
        delivered_orders = orders_qs.filter(status="delivered").count()
        cancelled_orders = orders_qs.filter(status="cancelled").count()

        # Calculate revenue excluding cancelled
        valid_orders = orders_qs.exclude(status="cancelled")
        valid_orders_count = valid_orders.count()
        total_revenue = sum(o.total for o in valid_orders)
        monthly_revenue = sum(o.total for o in valid_orders.filter(created_at__gte=thirty_days_ago))
        avg_order_value = float(total_revenue / valid_orders_count) if valid_orders_count > 0 else 0.0

        products_qs = Product.objects.all()
        total_products = products_qs.count()
        low_stock_products = products_qs.filter(stock__lte=5, stock__gt=0, is_active=True).count()
        out_of_stock_products = products_qs.filter(stock=0, is_active=True).count()

        # Unique Customers count
        unique_customers = orders_qs.values("phone").distinct().count()

        # Sales over last 7 days chart data
        daily_sales = []
        for i in range(6, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_orders = valid_orders.filter(created_at__gte=day_start, created_at__lt=day_end)
            rev = sum(o.total for o in day_orders)
            daily_sales.append({
                "date": day_start.strftime("%b %d"),
                "revenue": float(rev),
                "orders": day_orders.count()
            })

        # Top selling products aggregation from OrderItems
        top_products_qs = OrderItem.objects.filter(order__in=valid_orders).values("product__name").annotate(
            total_sold=Sum("quantity")
        ).order_by("-total_sold")[:5]

        top_products = [
            {"name": item["product__name"], "sold": item["total_sold"]}
            for item in top_products_qs
        ]

        recent_orders = CustomerOrderSerializer(orders_qs.order_by("-created_at")[:10], many=True, context={"request": request}).data

        return Response({
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(monthly_revenue),
            "avg_order_value": round(avg_order_value, 2),
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "delivered_orders": delivered_orders,
            "cancelled_orders": cancelled_orders,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "unique_customers": unique_customers,
            "daily_sales": daily_sales,
            "top_products": top_products,
            "recent_orders": recent_orders
        })


class AdminOrderListDetailView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request, pk=None):
        if pk:
            try:
                order = Order.objects.get(pk=pk)
                return Response(CustomerOrderSerializer(order, context={"request": request}).data)
            except Order.DoesNotExist:
                raise NotFound("Order not found")
        
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search", "").strip()
        
        qs = Order.objects.all().order_by("-created_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(
                Q(id__icontains=search) |
                Q(customer_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(address__icontains=search)
            )

        serializer = CustomerOrderSerializer(qs[:100], many=True, context={"request": request})
        return Response(serializer.data)

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Order not found")
        
        new_status = request.data.get("status")
        if new_status and new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save(update_fields=["status"])
            return Response(CustomerOrderSerializer(order, context={"request": request}).data)
        return Response({"error": "Invalid status value"}, status=400)


class AdminProductListCreateView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        qs = Product.objects.all().select_related("category").prefetch_related("images").order_by("-id")
        serializer = ProductSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        category_id = data.get("category_id")
        if not category_id:
            return Response({"error": "Category ID is required"}, status=400)
        try:
            category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            return Response({"error": "Category not found"}, status=400)

        slug = data.get("slug") or data.get("name", "").lower().replace(" ", "-")
        product = Product.objects.create(
            category=category,
            name=data.get("name"),
            slug=slug,
            description=data.get("description", ""),
            price=data.get("price"),
            discount_price=data.get("discount_price") or None,
            stock=data.get("stock", 0),
            is_featured=data.get("is_featured", False),
            is_active=data.get("is_active", True)
        )
        image_url = (data.get("image_url") or "").strip()
        if image_url:
            if len(image_url) > 100:
                return Response({"error": "Image URL খুব বড়। Device থেকে image upload করুন।"}, status=400)
            ProductImage.objects.create(
                product=product,
                image=image_url,
                alt_text=data.get("image_alt", data.get("name", "")),
                is_primary=data.get("image_primary", True),
            )

        return Response(ProductSerializer(product, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(APIView):
    permission_classes = (IsAdminUser,)

    def get_object(self, pk):
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Product not found")

    def patch(self, request, pk):
        product = self.get_object(pk)
        data = request.data
        if "name" in data: product.name = data["name"]
        if "slug" in data and data["slug"]: product.slug = data["slug"]
        if "description" in data: product.description = data["description"]
        if "price" in data: product.price = data["price"]
        if "discount_price" in data: product.discount_price = data["discount_price"] or None
        if "stock" in data: product.stock = data["stock"]
        if "is_featured" in data: product.is_featured = data["is_featured"]
        if "is_active" in data: product.is_active = data["is_active"]
        if "category_id" in data:
            try:
                product.category = Category.objects.get(pk=data["category_id"])
            except Category.DoesNotExist:
                pass
        
        image_url = (data.get("image_url") or "").strip()
        if image_url:
            if len(image_url) > 100:
                return Response({"error": "Image URL খুব বড়। Device থেকে image upload করুন।"}, status=400)
            first_img = product.images.first()
            if first_img:
                first_img.image = image_url
                if "image_alt" in data: first_img.alt_text = data["image_alt"]
                if data.get("image_primary"):
                    product.images.exclude(pk=first_img.pk).update(is_primary=False)
                    first_img.is_primary = True
                first_img.save()
            else:
                ProductImage.objects.create(
                    product=product,
                    image=image_url,
                    alt_text=data.get("image_alt", product.name),
                    is_primary=data.get("image_primary", True),
                )

        product.save()
        return Response(ProductSerializer(product, context={"request": request}).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

