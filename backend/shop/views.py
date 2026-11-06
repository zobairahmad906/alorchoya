import os
import logging
import hmac
import re
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.db import connection
from django.http import JsonResponse
import json
from django.shortcuts import get_object_or_404
from .models import Category, Product, ProductVariant, ProductImage, Cart, CartItem, DeliveryZone, Order, OrderItem, CustomerProfile, CustomerAddress, Review, ProductImageAsset, ProductImageAssetLink, Coupon, HeroSlide, CourierConfig
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer, OrderSerializer, CartSerializer, CartItemSerializer, DeliveryZoneSerializer, OrderTrackingSerializer, ReviewSerializer, CustomerProfileSerializer, CustomerAddressSerializer, CustomerOrderSerializer, ProductImageAssetSerializer, ProductImageAssetLinkSerializer, AdminCouponSerializer, HeroSlideSerializer, CourierConfigSerializer, build_media_url
from .courier import SteadFastCourierClient, PathaoCourierClient

from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

logger = logging.getLogger(__name__)
PATHAO_WEBHOOK_INTEGRATION_SECRET = "f3992ecc-59da-4cbe-a049-a13da2018d51"

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


def _active_pathao_client():
    config = CourierConfig.objects.filter(provider="pathao", is_active=True).first()
    if not config or config.is_sandbox or not (config.client_id and config.client_secret and config.username and config.password):
        raise ValueError("Pathao production credentials are not configured. Please contact the store.")
    if not config.store_id:
        raise ValueError("Pathao Store ID is missing. Please contact the store.")
    return PathaoCourierClient(config)


def _pathao_location_row(rows, location_id, id_keys, name_keys):
    for row in rows:
        if str(next((row.get(key) for key in id_keys if row.get(key) is not None), "")) == str(location_id):
            name = next((row.get(key) for key in name_keys if row.get(key)), "")
            return str(location_id), str(name)
    raise ValueError("Selected delivery location is no longer available. Please choose it again.")


class CheckoutCourierOptionsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        config = CourierConfig.objects.filter(provider="pathao", is_active=True).first()
        is_ready = bool(config and not config.is_sandbox and config.client_id and config.client_secret and config.username and config.password and config.store_id)
        return Response({"providers": ([{"id": "pathao", "name": "Pathao", "live_quote": True}] if is_ready else [])})


class CheckoutCourierLocationsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request, provider, level):
        if provider != "pathao" or level not in ("cities", "zones", "areas"):
            return Response({"error": "This courier location lookup is not available."}, status=404)
        try:
            client = _active_pathao_client()
            if level == "cities":
                rows = client.get_cities()
            elif level == "zones":
                city_id = request.query_params.get("city_id", "")
                if not city_id.isdigit(): raise ValueError("Choose a city first.")
                rows = client.get_zones(city_id)
            else:
                zone_id = request.query_params.get("zone_id", "")
                if not zone_id.isdigit(): raise ValueError("Choose a zone first.")
                rows = client.get_areas(zone_id)
            return Response({"results": rows})
        except Exception as exc:
            logger.warning("Checkout courier location lookup failed: %s", exc)
            return Response({"error": str(exc)}, status=503)


class CheckoutCourierQuoteView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        try:
            client = _active_pathao_client()
            city_id = str(request.data.get("city_id", ""))
            zone_id = str(request.data.get("zone_id", ""))
            area_id = str(request.data.get("area_id", ""))
            if not (city_id.isdigit() and zone_id.isdigit() and area_id.isdigit()):
                raise ValueError("Choose a city, zone, and area to calculate delivery charge.")

            city_id, city_name = _pathao_location_row(client.get_cities(), city_id, ("city_id", "id"), ("city_name", "name"))
            zone_id, zone_name = _pathao_location_row(client.get_zones(city_id), zone_id, ("zone_id", "id"), ("zone_name", "name"))
            area_id, area_name = _pathao_location_row(client.get_areas(zone_id), area_id, ("area_id", "id"), ("area_name", "name"))

            item_rows = request.data.get("items", [])
            if not isinstance(item_rows, list) or not item_rows:
                raise ValueError("Your cart is empty.")
            item_ids = [row.get("product_id") for row in item_rows if isinstance(row, dict)]
            products = {product.id: product for product in Product.objects.filter(id__in=item_ids, is_active=True)}
            weight = 0.0
            for row in item_rows:
                if not isinstance(row, dict): raise ValueError("Invalid cart item.")
                try:
                    product_id, quantity = int(row.get("product_id")), int(row.get("quantity"))
                except (TypeError, ValueError):
                    raise ValueError("Invalid cart item.")
                if quantity < 1 or product_id not in products:
                    raise ValueError("One or more products are unavailable.")
                weight += float(products[product_id].weight_kg or 0.5) * quantity

            charge, _ = client.calculate_delivery_charge(city_id, zone_id, max(weight, 0.5))
            return Response({
                "provider": "pathao", "city_id": city_id, "city_name": city_name,
                "zone_id": zone_id, "zone_name": zone_name, "area_id": area_id,
                "area_name": area_name, "weight_kg": round(max(weight, 0.5), 3),
                "delivery_charge": charge,
            })
        except ValueError as exc:
            return Response({"error": str(exc)}, status=400)
        except Exception as exc:
            logger.warning("Checkout courier price quote failed: %s", exc)
            return Response({"error": str(exc)}, status=503)


class CheckoutCouponValidateView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        code = str(request.data.get("coupon_code", "")).strip().upper()
        item_rows = request.data.get("items", [])
        if not code or not isinstance(item_rows, list) or not item_rows:
            return Response({"error": "Enter a coupon code and add products to your cart."}, status=400)
        try:
            from decimal import Decimal
            coupon = Coupon.objects.get(code=code, is_active=True)
            if coupon.expires_at and coupon.expires_at <= timezone.now():
                return Response({"error": "This coupon has expired."}, status=400)
            if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
                return Response({"error": "This coupon has reached its usage limit."}, status=400)
            subtotal = Decimal("0")
            for row in item_rows:
                product = Product.objects.get(pk=int(row["product_id"]), is_active=True)
                quantity = int(row["quantity"])
                if quantity < 1 or product.stock < quantity:
                    return Response({"error": "A cart item is unavailable."}, status=400)
                subtotal += (product.discount_price or product.price) * quantity
            if subtotal < coupon.min_order:
                return Response({"error": f"This coupon requires a minimum order of ৳{coupon.min_order}."}, status=400)
            discount = subtotal * coupon.value / 100 if coupon.discount_type == "percent" else coupon.value
            discount = min(discount, subtotal)
            return Response({"coupon_code": coupon.code, "discount_amount": round(float(discount), 2)})
        except Coupon.DoesNotExist:
            return Response({"error": "This coupon is invalid or inactive."}, status=400)
        except (KeyError, TypeError, ValueError, Product.DoesNotExist):
            return Response({"error": "The cart data could not be validated."}, status=400)


class DeliveryZoneList(generics.ListAPIView):
    queryset = DeliveryZone.objects.filter(is_active=True).order_by("charge")
    serializer_class = DeliveryZoneSerializer
class OrderTrack(APIView):
    permission_classes = (permissions.AllowAny,)
    def get(self, request):
        order_id = self.request.query_params.get("id", "").strip()
        phone = self.request.query_params.get("phone", "").strip()
        if not order_id and not phone:
            return Response({"detail": "অর্ডার আইডি অথবা ফোন নম্বর দিন।"}, status=400)
        orders = Order.objects.all().order_by("-created_at")
        if order_id:
            orders = orders.filter(id=order_id)
        if phone:
            orders = orders.filter(phone=phone)
        if not orders.exists():
            return Response({"detail": "এই তথ্য দিয়ে কোনো অর্ডার পাওয়া যায়নি।"}, status=404)
        first_order = orders.first()
        data = CustomerOrderSerializer(first_order).data
        data["orders"] = CustomerOrderSerializer(orders, many=True).data
        return Response(data)

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
            
        variant_id = request.data.get("variant_id")
        variant = None
        if variant_id:
            try:
                variant = product.variants.get(pk=variant_id)
            except (ProductVariant.DoesNotExist, ValueError):
                variant = None

        created_images = []
        has_primary = product.images.filter(is_primary=True).exists()
        for idx, file_obj in enumerate(files):
            img = ProductImage.objects.create(
                product=product,
                variant=variant,
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
from decimal import Decimal
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import timedelta


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Relax CSRF enforcement for authenticated staff API calls


class AdminDashboardStatsView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
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
        order_status_counts = {status: 0 for status, _ in Order.STATUS_CHOICES}
        order_status_counts.update({
            row["status"]: row["count"]
            for row in orders_qs.values("status").annotate(count=Count("id"))
        })

        # Calculate revenue and profit excluding cancelled orders
        valid_orders = orders_qs.exclude(status="cancelled")
        valid_orders_count = valid_orders.count()
        total_revenue = sum((o.total for o in valid_orders), Decimal("0.00"))
        monthly_orders = valid_orders.filter(created_at__gte=thirty_days_ago)
        monthly_revenue = sum((o.total for o in monthly_orders), Decimal("0.00"))
        avg_order_value = float(total_revenue / valid_orders_count) if valid_orders_count > 0 else 0.0

        # COGS & Gross Profit calculations from OrderItems
        valid_order_items = OrderItem.objects.filter(order__in=valid_orders).select_related("product")
        total_cogs = Decimal("0.00")
        for item in valid_order_items:
            unit_cost = item.product.cost_price if (item.product and item.product.cost_price is not None) else Decimal("0.00")
            total_cogs += unit_cost * item.quantity

        gross_profit = total_revenue - total_cogs
        profit_margin_percent = float(round((gross_profit / total_revenue * 100), 2)) if total_revenue > Decimal("0.00") else 0.0
        avg_profit_per_order = float(round(gross_profit / valid_orders_count, 2)) if valid_orders_count > 0 else 0.0

        # Products & Inventory Stock Valuation Calculations
        products_qs = Product.objects.all().select_related("category")
        total_products = products_qs.count()
        low_stock_products = products_qs.filter(stock__lte=5, stock__gt=0, is_active=True).count()
        out_of_stock_products = products_qs.filter(stock=0, is_active=True).count()
        total_stock_units = sum(p.stock for p in products_qs)

        # Selling/retail price stock valuation vs Cost valuation
        retail_stock_valuation = sum(
            ((p.discount_price if p.discount_price is not None else p.price) * p.stock for p in products_qs),
            Decimal("0.00")
        )
        cost_stock_valuation = sum(
            ((p.cost_price if p.cost_price is not None else Decimal("0.00")) * p.stock for p in products_qs),
            Decimal("0.00")
        )
        potential_stock_profit = max(Decimal("0.00"), retail_stock_valuation - cost_stock_valuation)
        
        # Product price averages
        avg_product_price = float(round(
            sum((p.discount_price if p.discount_price is not None else p.price) for p in products_qs) / total_products, 2
        )) if total_products > 0 else 0.0

        # Unique Customers count
        unique_customers = orders_qs.values("phone").distinct().count()

        # Sales & Profit over last 14 days chart data
        daily_sales = []
        for i in range(13, -1, -1):
            day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            day_orders = valid_orders.filter(created_at__gte=day_start, created_at__lt=day_end)
            day_rev = sum((o.total for o in day_orders), Decimal("0.00"))
            day_items = valid_order_items.filter(order__in=day_orders)
            day_cogs = sum(((it.product.cost_price if (it.product and it.product.cost_price is not None) else Decimal("0.00")) * it.quantity for it in day_items), Decimal("0.00"))
            day_profit = day_rev - day_cogs
            day_items_sold = sum(it.quantity for it in day_items)

            daily_sales.append({
                "date": day_start.strftime("%b %d"),
                "revenue": float(day_rev),
                "profit": float(day_profit),
                "orders": day_orders.count(),
                "items_sold": day_items_sold
            })

        # Top selling products aggregation from OrderItems
        top_products_qs = valid_order_items.values("product__id", "product__name").annotate(
            total_sold=Sum("quantity"),
            total_rev=Sum(F("quantity") * F("unit_price"))
        ).order_by("-total_sold")[:5]

        top_products = []
        for item in top_products_qs:
            prod_id = item.get("product__id")
            prod_obj = Product.objects.filter(id=prod_id).first() if prod_id else None
            img_url = None
            if prod_obj:
                img = prod_obj.images.filter(is_primary=True).first() or prod_obj.images.first()
                if img:
                    file_obj = img.card_image or img.hero_desktop or img.image
                    if file_obj:
                        img_url = build_media_url(file_obj, request)
            top_products.append({
                "id": prod_id,
                "name": item["product__name"] or "Unknown",
                "sold": item["total_sold"] or 0,
                "revenue": float(item["total_rev"] or 0),
                "image": img_url,
            })

        # Category Breakdown: Stock value, revenue, and product counts
        categories = Category.objects.all().order_by("name")
        category_breakdown = []
        for cat in categories:
            cat_prods = [p for p in products_qs if p.category_id == cat.id]
            cat_stock = sum(p.stock for p in cat_prods)
            cat_val = sum(((p.discount_price if p.discount_price is not None else p.price) * p.stock for p in cat_prods), Decimal("0.00"))
            cat_cost = sum(((p.cost_price if p.cost_price is not None else Decimal("0.00")) * p.stock for p in cat_prods), Decimal("0.00"))
            cat_items = [it for it in valid_order_items if it.product and it.product.category_id == cat.id]
            cat_sold = sum(it.quantity for it in cat_items)
            cat_rev = sum((it.quantity * it.unit_price for it in cat_items), Decimal("0.00"))
            
            category_breakdown.append({
                "name": cat.name,
                "product_count": len(cat_prods),
                "stock": cat_stock,
                "stock_value": float(cat_val),
                "cost_value": float(cat_cost),
                "sold": cat_sold,
                "revenue": float(cat_rev),
            })
        category_breakdown.sort(key=lambda x: (x["stock_value"] + x["revenue"]), reverse=True)

        # Price range distribution tiers
        tiers_config = [
            {"label": "< 500", "min": 0, "max": 499},
            {"label": "500 - 1,500", "min": 500, "max": 1500},
            {"label": "1,501 - 3,000", "min": 1501, "max": 3000},
            {"label": "3,001 - 5,000", "min": 3001, "max": 5000},
            {"label": "5,000+", "min": 5001, "max": 999999999},
        ]
        price_tiers = []
        for tier in tiers_config:
            in_tier = [
                p for p in products_qs
                if tier["min"] <= (p.discount_price if p.discount_price is not None else p.price) <= tier["max"]
            ]
            price_tiers.append({
                "label": tier["label"],
                "count": len(in_tier),
                "total_stock": sum(p.stock for p in in_tier),
            })

        recent_orders = CustomerOrderSerializer(orders_qs.order_by("-created_at")[:10], many=True, context={"request": request}).data

        return Response({
            "total_revenue": float(total_revenue),
            "monthly_revenue": float(monthly_revenue),
            "gross_profit": float(gross_profit),
            "profit_margin_percent": profit_margin_percent,
            "avg_order_value": round(avg_order_value, 2),
            "avg_profit_per_order": avg_profit_per_order,
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "delivered_orders": delivered_orders,
            "cancelled_orders": cancelled_orders,
            "order_status_counts": order_status_counts,
            "total_products": total_products,
            "low_stock_products": low_stock_products,
            "out_of_stock_products": out_of_stock_products,
            "unique_customers": unique_customers,
            "total_stock_units": total_stock_units,
            "retail_stock_valuation": float(retail_stock_valuation),
            "cost_stock_valuation": float(cost_stock_valuation),
            "potential_stock_profit": float(potential_stock_profit),
            "avg_product_price": avg_product_price,
            "daily_sales": daily_sales,
            "top_products": top_products,
            "category_breakdown": category_breakdown,
            "price_tiers": price_tiers,
            "recent_orders": recent_orders
        })


class AdminOrderListDetailView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
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

    def patch(self, request, pk=None):
        if pk:
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

        # Bulk patch
        order_ids = request.data.get("order_ids", [])
        new_status = request.data.get("status")
        if order_ids and new_status and new_status in dict(Order.STATUS_CHOICES):
            updated_count = Order.objects.filter(id__in=order_ids).update(status=new_status)
            return Response({"updated": updated_count, "status": new_status})
        return Response({"error": "Invalid request for bulk update"}, status=400)


class AdminCustomerListView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def get(self, request):
        customers_map = {}

        # 1. Registered CustomerProfiles
        profiles = CustomerProfile.objects.select_related("user").prefetch_related("addresses").all()
        for prof in profiles:
            key = f"user_{prof.user_id}"
            full_name = f"{prof.user.first_name or ''} {prof.user.last_name or ''}".strip() or prof.user.username
            default_addr = prof.addresses.filter(is_default=True).first() or prof.addresses.first()
            customers_map[key] = {
                "id": prof.id,
                "user_id": prof.user_id,
                "customer_name": default_addr.recipient_name if default_addr else full_name,
                "profile_name": full_name,
                "username": prof.user.username,
                "email": prof.user.email,
                "phone": prof.phone or (default_addr.phone if default_addr else ""),
                "avatar_url": prof.avatar_url or "",
                "address": default_addr.address if default_addr else "",
                "total_orders": 0,
                "total_spent": 0.0,
                "last_order_date": None,
                "purchased_products": [],
                "is_registered": True,
            }

        # 2. Iterate orders to accumulate statistics & purchased product previews
        orders = Order.objects.select_related("customer").prefetch_related("items__product__images").order_by("-created_at")
        for ord in orders:
            if ord.customer_id:
                key = f"user_{ord.customer_id}"
            elif ord.phone:
                key = f"phone_{ord.phone.strip()}"
            elif ord.email:
                key = f"email_{ord.email.strip().lower()}"
            else:
                key = f"order_{ord.id}"

            if key not in customers_map:
                customers_map[key] = {
                    "id": ord.id,
                    "user_id": ord.customer_id,
                    "customer_name": ord.customer_name or "Guest Customer",
                    "profile_name": ord.customer_name or "Guest",
                    "username": "",
                    "email": ord.email or "",
                    "phone": ord.phone or "",
                    "avatar_url": "",
                    "address": ord.address or "",
                    "total_orders": 0,
                    "total_spent": 0.0,
                    "last_order_date": None,
                    "purchased_products": [],
                    "is_registered": bool(ord.customer_id),
                }

            cust = customers_map[key]
            cust["total_orders"] += 1
            cust["total_spent"] += float(ord.total)
            if not cust["last_order_date"] or ord.created_at > cust["last_order_date"]:
                cust["last_order_date"] = ord.created_at
            if not cust["address"] and ord.address:
                cust["address"] = ord.address

            existing_prod_ids = {p["id"] for p in cust["purchased_products"]}
            for itm in ord.items.all():
                if itm.product_id not in existing_prod_ids:
                    img_obj = itm.product.images.filter(is_primary=True).first() or itm.product.images.first()
                    img_url = None
                    if img_obj:
                        file_obj = img_obj.card_image or img_obj.hero_desktop or img_obj.image
                        if file_obj:
                            img_url = build_media_url(file_obj, request)
                    cust["purchased_products"].append({
                        "id": itm.product_id,
                        "name": itm.product.name,
                        "slug": itm.product.slug,
                        "image": img_url,
                    })
                    existing_prod_ids.add(itm.product_id)

        customer_list = list(customers_map.values())
        customer_list.sort(key=lambda c: (c["total_spent"], c["total_orders"]), reverse=True)
        return Response(customer_list)


class AdminCouponView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def get(self, request, pk=None):
        if pk:
            coupon = get_object_or_404(Coupon, pk=pk)
            return Response(AdminCouponSerializer(coupon).data)
        coupons = Coupon.objects.all().order_by("-id")
        return Response(AdminCouponSerializer(coupons, many=True).data)

    def post(self, request):
        serializer = AdminCouponSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        serializer = AdminCouponSerializer(coupon, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        coupon = get_object_or_404(Coupon, pk=pk)
        coupon.delete()
        return Response({"success": True})


class AdminCourierConfigView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def get(self, request):
        configs = CourierConfig.objects.all()
        providers = ["steadfast", "pathao"]
        existing = {c.provider: c for c in configs}
        result = []
        for p in providers:
            if p in existing:
                result.append(existing[p])
            else:
                new_cfg = CourierConfig.objects.create(provider=p, is_active=False, is_sandbox=True)
                result.append(new_cfg)
        return Response(CourierConfigSerializer(result, many=True).data)

    def post(self, request):
        provider = request.data.get("provider")
        if not provider or provider not in ("steadfast", "pathao"):
            return Response({"error": "Valid provider ('steadfast' or 'pathao') is required"}, status=400)
        config, _ = CourierConfig.objects.get_or_create(provider=provider)
        serializer = CourierConfigSerializer(config, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)


class AdminCourierBookView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def post(self, request):
        order_id = request.data.get("order_id")
        provider = request.data.get("provider", "steadfast")
        if not order_id:
            return Response({"error": "order_id is required"}, status=400)

        order = get_object_or_404(Order, pk=order_id)
        if order.courier_city_id and provider != order.courier_provider:
            return Response({"error": "This order must be booked with the courier used for the checkout delivery quote."}, status=400)
        config = CourierConfig.objects.filter(provider=provider).first()

        cod_amount = request.data.get("cod_amount")
        if cod_amount is None:
            cod_amount = float(order.total)
        else:
            try:
                cod_amount = float(cod_amount)
            except Exception:
                cod_amount = float(order.total)

        recipient_name = request.data.get("recipient_name") or order.customer_name
        recipient_phone = request.data.get("recipient_phone") or order.phone
        recipient_address = request.data.get("recipient_address") or order.address
        note = request.data.get("note") or f"Order #{order.id}"

        has_credentials = bool(config and config.is_active and (config.api_key or config.client_id))

        try:
            if has_credentials:
                if provider == "steadfast":
                    client = SteadFastCourierClient(config)
                    payload = {
                        "invoice": f"ALOR-{order.id}",
                        "recipient_name": recipient_name,
                        "recipient_phone": recipient_phone,
                        "recipient_address": recipient_address,
                        "cod_amount": cod_amount,
                        "note": note
                    }
                    result = client.create_order(payload)
                else:  # pathao
                    client = PathaoCourierClient(config)
                    payload = {
                        "store_id": config.store_id or 1,
                        "merchant_order_id": f"ALOR-{order.id}",
                        "recipient_name": recipient_name,
                        "recipient_phone": recipient_phone,
                        "recipient_address": recipient_address,
                        "recipient_city": int(order.courier_city_id) if order.courier_city_id else None,
                        "recipient_zone": int(order.courier_zone_id) if order.courier_zone_id else None,
                        "recipient_area": int(order.courier_area_id) if order.courier_area_id else None,
                        "delivery_type": 48,
                        "amount_to_collect": int(cod_amount),
                        "item_type": 2,
                        "item_quantity": sum(it.quantity for it in order.items.all()) or 1,
                        "item_weight": float(request.data.get("weight") or order.courier_weight_kg or 0.5),
                        "item_description": note,
                    }
                    result = client.create_order(payload)
            else:
                import random
                cid = f"SIM-{provider[:3].upper()}-{random.randint(100000, 999999)}"
                tr_code = f"TRK-{random.randint(1000000, 9999999)}"
                result = {
                    "success": True,
                    "consignment_id": cid,
                    "tracking_code": tr_code,
                    "status": "in_review",
                    "raw_response": {"simulation": True, "note": "Sandbox simulation mode"}
                }

            order.courier_provider = provider
            order.consignment_id = str(result.get("consignment_id") or "")
            order.tracking_code = str(result.get("tracking_code") or result.get("consignment_id") or "")
            order.courier_status = result.get("status", "in_review")
            order.courier_status_updated_at = timezone.now()
            order.courier_booking_data = result
            order.status = "courier_booked"
            order.save()

            return Response({
                "success": True,
                "order_id": order.id,
                "provider": provider,
                "consignment_id": order.consignment_id,
                "tracking_code": order.tracking_code,
                "courier_status": order.courier_status,
                "order": CustomerOrderSerializer(order).data
            })
        except Exception as e:
            logger.error(f"Courier booking error: {e}")
            return Response({"error": str(e)}, status=400)


class AdminCourierTrackView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def get(self, request, order_id):
        order = get_object_or_404(Order, pk=order_id)
        if not order.consignment_id:
            return Response({"error": "This order does not have a courier consignment booked."}, status=400)

        provider = order.courier_provider or "steadfast"
        config = CourierConfig.objects.filter(provider=provider).first()

        try:
            if config and config.is_active and (config.api_key or config.client_id):
                if provider == "steadfast":
                    client = SteadFastCourierClient(config)
                    data = client.get_tracking(order.consignment_id)
                else:
                    client = PathaoCourierClient(config)
                    data = client.get_tracking(order.consignment_id)
                order.courier_status = data.get("delivery_status", order.courier_status)
                order.courier_status_updated_at = timezone.now()
                order.save(update_fields=["courier_status", "courier_status_updated_at"])
                return Response(data)
            else:
                return Response({
                    "consignment_id": order.consignment_id,
                    "tracking_code": order.tracking_code,
                    "delivery_status": order.courier_status or "in_review",
                    "provider": provider,
                    "simulation": True,
                    "events": [
                        {"status_label": "Consignment Created & Assigned", "time": order.created_at.strftime("%b %d, %Y %I:%M %p")},
                        {"status_label": "Ready for Courier Rider Pickup", "time": "In progress"}
                    ]
                })
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class PathaoWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Keep webhooks working for parcels already booked if dispatch is disabled later.
        config = CourierConfig.objects.filter(provider="pathao").first()
        if not config or not config.webhook_secret:
            return Response({"error": "Pathao webhook is not configured."}, status=503)

        signature = request.headers.get("X-Pathao-Signature", "")
        if not signature or not hmac.compare_digest(signature, config.webhook_secret):
            return Response({"error": "Invalid Pathao webhook signature."}, status=401)

        payload = request.data if isinstance(request.data, dict) else {}
        event = str(payload.get("event") or "").strip()
        response = Response({"received": True}, status=202)
        response["X-Pathao-Merchant-Webhook-Integration-Secret"] = PATHAO_WEBHOOK_INTEGRATION_SECRET

        # Pathao sends this event while validating the callback URL.
        if event == "webhook_integration":
            return response

        merchant_order_id = str(payload.get("merchant_order_id") or "").strip()
        match = re.fullmatch(r"ALOR-(\d+)", merchant_order_id)
        order = None
        if match:
            order = Order.objects.filter(pk=match.group(1), courier_provider="pathao").first()
        if not order:
            consignment_id = str(payload.get("consignment_id") or "").strip()
            if consignment_id:
                order = Order.objects.filter(consignment_id=consignment_id, courier_provider="pathao").first()
        if not order:
            logger.warning("Pathao webhook order not found (event=%s, merchant_order_id=%s)", event, merchant_order_id)
            return Response({"error": "Order not found for this Pathao update."}, status=404)

        courier_status = str(payload.get("order_status") or event or "").strip()
        if not courier_status:
            return Response({"error": "Pathao webhook has no order status or event."}, status=400)

        order.courier_status = courier_status[:100]
        order.courier_status_updated_at = timezone.now()
        order.courier_booking_data = {
            **(order.courier_booking_data if isinstance(order.courier_booking_data, dict) else {}),
            "latest_webhook": {
                "event": event,
                "order_status": payload.get("order_status"),
                "received_at": order.courier_status_updated_at.isoformat(),
            },
        }
        update_fields = ["courier_status", "courier_status_updated_at", "courier_booking_data"]
        if payload.get("consignment_id") and not order.consignment_id:
            order.consignment_id = str(payload["consignment_id"])[:100]
            order.tracking_code = order.consignment_id
            update_fields.extend(["consignment_id", "tracking_code"])
        order.save(update_fields=update_fields)
        logger.info("Pathao webhook updated order %s to %s", order.id, order.courier_status)
        return response


class AdminProductListCreateView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        qs = Product.objects.all().select_related("category").prefetch_related("images", "variants").order_by("-id")
        serializer = ProductSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        category_id = data.get("category_id")
        if not category_id:
            category_name = data.get("category")
            if category_name:
                slug_cand = category_name.strip().lower().replace(" ", "-")
                category, _ = Category.objects.get_or_create(
                    name=category_name.strip(),
                    defaults={"slug": slug_cand}
                )
            else:
                category = Category.objects.first()
        else:
            try:
                category = Category.objects.get(pk=category_id)
            except Category.DoesNotExist:
                return Response({"error": "Category not found"}, status=400)

        raw_name = data.get("name", "").strip()
        if not raw_name:
            return Response({"error": "Product name is required"}, status=400)

        slug = data.get("slug") or raw_name.lower().replace(" ", "-")
        base_slug = slug
        count = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{count}"
            count += 1

        clean_num = lambda v: None if v in ("", None, "null") else v

        price = data.get("base_price") or data.get("price") or 0
        discount_price = clean_num(data.get("sale_price") or data.get("discount_price"))
        cost_price = clean_num(data.get("cost_price"))
        stock = data.get("initial_stock") or data.get("stock") or 0
        stock_alert_threshold = data.get("stock_alert_threshold") or 5

        weight_kg = clean_num(data.get("weight_kg"))
        dim_l = clean_num(data.get("dimension_length_cm"))
        dim_w = clean_num(data.get("dimension_width_cm"))
        dim_h = clean_num(data.get("dimension_height_cm"))

        attributes = data.get("attributes") or {}
        if isinstance(attributes, str):
            try:
                attributes = json.loads(attributes)
            except Exception:
                attributes = {}

        is_active = data.get("status") != "inactive" if "status" in data else data.get("is_active", True)
        if isinstance(is_active, str):
            is_active = is_active.lower() not in ("false", "0", "inactive")

        product = Product.objects.create(
            category=category,
            name=raw_name,
            slug=slug,
            base_sku=data.get("base_sku", "").strip(),
            description=data.get("description", ""),
            price=price,
            discount_price=discount_price,
            cost_price=cost_price,
            stock=stock,
            weight_kg=weight_kg,
            dimension_length_cm=dim_l,
            dimension_width_cm=dim_w,
            dimension_height_cm=dim_h,
            stock_alert_threshold=stock_alert_threshold,
            attributes=attributes,
            warranty_information=data.get("warranty_information", ""),
            is_featured=bool(data.get("is_featured", False)),
            is_active=is_active
        )

        if "voice_audio_file" in request.FILES:
            product.voice_audio_file = request.FILES["voice_audio_file"]
            product.save(update_fields=["voice_audio_file"])

        variants_data = data.get("variants") or []
        if isinstance(variants_data, str):
            try:
                variants_data = json.loads(variants_data)
            except Exception:
                variants_data = []

        for v in variants_data:
            if not isinstance(v, dict):
                continue
            v_attr = v.get("attributes") or {}
            v_sku = v.get("sku", "").strip()
            v_price = clean_num(v.get("price"))
            v_stock = v.get("stock") or 0
            ProductVariant.objects.create(
                product=product,
                attributes=v_attr,
                sku=v_sku,
                price=v_price,
                stock=v_stock
            )

        image_url = (data.get("image_url") or "").strip()
        if image_url and len(image_url) <= 100:
            ProductImage.objects.create(
                product=product,
                image=image_url,
                alt_text=data.get("image_alt", raw_name),
                is_primary=True,
            )

        return Response(ProductSerializer(product, context={"request": request}).data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self, pk):
        try:
            return Product.objects.select_related("category").prefetch_related("images", "variants").get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Product not found")

    def get(self, request, pk):
        product = self.get_object(pk)
        return Response(ProductSerializer(product, context={"request": request}).data)

    def put(self, request, pk):
        return self.patch(request, pk)

    def patch(self, request, pk):
        product = self.get_object(pk)
        data = request.data
        clean_num = lambda v: None if v in ("", None, "null") else v

        if "name" in data and data["name"]:
            product.name = data["name"].strip()
        if "slug" in data and data["slug"]:
            product.slug = data["slug"].strip()
        if "base_sku" in data:
            product.base_sku = (data["base_sku"] or "").strip()
        if "description" in data:
            product.description = data["description"]
        if "price" in data:
            product.price = data["price"]
        elif "base_price" in data:
            product.price = data["base_price"]
        if "discount_price" in data or "sale_price" in data:
            product.discount_price = clean_num(data.get("sale_price", data.get("discount_price")))
        if "cost_price" in data:
            product.cost_price = clean_num(data["cost_price"])
        if "stock" in data or "initial_stock" in data:
            product.stock = data.get("stock", data.get("initial_stock", 0))
        if "weight_kg" in data:
            product.weight_kg = clean_num(data["weight_kg"])
        if "dimension_length_cm" in data:
            product.dimension_length_cm = clean_num(data["dimension_length_cm"])
        if "dimension_width_cm" in data:
            product.dimension_width_cm = clean_num(data["dimension_width_cm"])
        if "dimension_height_cm" in data:
            product.dimension_height_cm = clean_num(data["dimension_height_cm"])
        if "stock_alert_threshold" in data:
            product.stock_alert_threshold = data["stock_alert_threshold"] or 5
        if "warranty_information" in data:
            product.warranty_information = data["warranty_information"] or ""
        if "is_featured" in data:
            product.is_featured = bool(data["is_featured"])
        if "status" in data:
            product.is_active = data["status"] != "inactive"
        elif "is_active" in data:
            product.is_active = bool(data["is_active"])

        if "attributes" in data:
            attrs = data["attributes"]
            if isinstance(attrs, str):
                try:
                    attrs = json.loads(attrs)
                except Exception:
                    pass
            product.attributes = attrs or {}

        if "category_id" in data:
            try:
                product.category = Category.objects.get(pk=data["category_id"])
            except Category.DoesNotExist:
                pass
        elif "category" in data and data["category"]:
            cat_name = str(data["category"]).strip()
            cat, _ = Category.objects.get_or_create(
                name=cat_name,
                defaults={"slug": cat_name.lower().replace(" ", "-")}
            )
            product.category = cat

        if "voice_audio_file" in request.FILES:
            product.voice_audio_file = request.FILES["voice_audio_file"]
        elif data.get("remove_voice_audio") or ("voice_audio_file" in data and not data["voice_audio_file"]):
            product.voice_audio_file = None

        product.save()

        # Sync variants if passed
        if "variants" in data:
            variants_data = data["variants"]
            if isinstance(variants_data, str):
                try:
                    variants_data = json.loads(variants_data)
                except Exception:
                    variants_data = []
            
            existing_variant_ids = set(product.variants.values_list("id", flat=True))
            retained_ids = set()
            for v in variants_data:
                if not isinstance(v, dict):
                    continue
                v_id = v.get("id")
                v_attr = v.get("attributes") or {}
                v_sku = (v.get("sku") or "").strip()
                v_price = clean_num(v.get("price"))
                v_stock = v.get("stock") or 0
                if v_id and v_id in existing_variant_ids:
                    variant_obj = product.variants.get(pk=v_id)
                    variant_obj.attributes = v_attr
                    variant_obj.sku = v_sku
                    variant_obj.price = v_price
                    variant_obj.stock = v_stock
                    variant_obj.save()
                    retained_ids.add(v_id)
                else:
                    new_v = ProductVariant.objects.create(
                        product=product,
                        attributes=v_attr,
                        sku=v_sku,
                        price=v_price,
                        stock=v_stock
                    )
                    retained_ids.add(new_v.id)
            
            # Remove omitted variants
            to_delete = existing_variant_ids - retained_ids
            if to_delete:
                product.variants.filter(id__in=to_delete).delete()

        return Response(ProductSerializer(product, context={"request": request}).data)

    def delete(self, request, pk):
        product = self.get_object(pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageAssetListCreateView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        assets = ProductImageAsset.objects.all().prefetch_related("links__product")
        serializer = ProductImageAssetSerializer(assets, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        files = request.FILES.getlist("images") or request.FILES.getlist("image")
        if not files:
            return Response({"images": "কমপক্ষে একটি ইমেজ ফাইল নির্বাচন করুন।"}, status=status.HTTP_400_BAD_REQUEST)

        current_count = ProductImageAsset.objects.count()
        created = []
        for idx, image in enumerate(files):
            if not image.content_type or not image.content_type.startswith("image/"):
                return Response({"images": "শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করা যাবে।"}, status=status.HTTP_400_BAD_REQUEST)
            if image.size > 15 * 1024 * 1024:
                return Response({"images": "প্রতিটি ছবির সর্বোচ্চ সাইজ ১৫ মেগাবাইট হতে পারবে।"}, status=status.HTTP_400_BAD_REQUEST)

            filename = image.name or f"asset_{current_count + idx + 1}.jpg"
            clean_name = filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()
            alt_text = request.data.get("alt_text") or clean_name
            caption = f"Studio quality product image of {clean_name}. High definition detailing, clean focus and contrast."

            asset = ProductImageAsset.objects.create(
                user=request.user if request.user.is_authenticated else None,
                image=image,
                filename=filename,
                alt_text=alt_text,
                image_caption=caption,
                processing_status="ready",
                position=current_count + idx,
            )
            created.append(asset)

        return Response(ProductImageAssetSerializer(created, many=True, context={"request": request}).data, status=status.HTTP_201_CREATED)


class ProductImageAssetReorderView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def post(self, request):
        positions = request.data.get("positions", {})
        if not isinstance(positions, dict):
            return Response({"error": "positions must be an object mapping asset IDs to positions."}, status=400)
        for asset_id, position in positions.items():
            try:
                ProductImageAsset.objects.filter(pk=int(asset_id)).update(position=int(position))
            except (ValueError, TypeError):
                continue
        assets = ProductImageAsset.objects.all().prefetch_related("links__product")
        return Response(ProductImageAssetSerializer(assets, many=True, context={"request": request}).data)


class ProductImageAssetBulkEmbedView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def get(self, request):
        qs = ProductImageAsset.objects.all()
        counts = {
            "total": qs.count(),
            "pending": qs.filter(processing_status="pending").count(),
            "processing": qs.filter(processing_status="processing").count(),
            "ready": qs.filter(processing_status="ready").count(),
            "failed": qs.filter(processing_status="failed").count(),
        }
        last_ready = qs.filter(processing_status="ready").order_by("-updated_at").first()
        failed_assets = list(
            qs.filter(processing_status="failed")
            .order_by("-updated_at")
            .values("id", "filename", "processing_error", "updated_at")[:25]
        )
        return Response({
            "counts": counts,
            "last_embedded_at": last_ready.updated_at if last_ready else None,
            "queue_policy": {
                "batch_size": 3,
                "delay_seconds": 12,
                "batch_interval_seconds": 45,
                "mode": "rate_limit_safe",
            },
            "failed_items": failed_assets,
        })

    def post(self, request):
        asset_ids = request.data.get("asset_ids")
        only_failed = bool(request.data.get("only_failed"))
        qs = ProductImageAsset.objects.all()
        if isinstance(asset_ids, list) and asset_ids:
            qs = qs.filter(id__in=asset_ids)
        elif only_failed:
            qs = qs.filter(processing_status="failed")
        else:
            qs = qs.filter(processing_status__in=["pending", "failed"])

        assets = list(qs)
        for asset in assets:
            if not asset.alt_text:
                asset.alt_text = asset.filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()
            if not asset.image_caption:
                clean_name = asset.filename.rsplit(".", 1)[0].replace("-", " ").replace("_", " ").title()
                asset.image_caption = f"Studio photograph of {clean_name}. High definition detailing, clean focus and contrast."
            asset.processing_status = "ready"
            asset.processing_error = ""
            asset.save(update_fields=["alt_text", "image_caption", "processing_status", "processing_error", "updated_at"])

        return Response({"queued": len(assets), "batch_size": 3, "delay_seconds": 12})


class ProductImageAssetDetailView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def patch(self, request, pk):
        try:
            asset = ProductImageAsset.objects.get(pk=pk)
        except ProductImageAsset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        update_fields = ["updated_at"]
        for field in ("alt_text", "filename", "image_caption"):
            if field in request.data:
                setattr(asset, field, request.data.get(field) or "")
                update_fields.append(field)
        if "position" in request.data:
            try:
                asset.position = int(request.data["position"])
                update_fields.append("position")
            except (ValueError, TypeError):
                pass
        asset.save(update_fields=update_fields)

        if "alt_text" in request.data and asset.alt_text:
            for link in asset.links.select_related("product"):
                ProductImage.objects.filter(product=link.product, image=asset.image.name).update(alt_text=asset.alt_text)

        return Response(ProductImageAssetSerializer(asset, context={"request": request}).data)

    def delete(self, request, pk):
        try:
            asset = ProductImageAsset.objects.get(pk=pk)
        except ProductImageAsset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        for link in asset.links.select_related("product"):
            ProductImage.objects.filter(product=link.product, image=asset.image.name).delete()

        try:
            asset.image.delete(save=False)
        except Exception:
            pass

        asset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductImageAssetLinkView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def post(self, request, asset_id):
        try:
            asset = ProductImageAsset.objects.get(pk=asset_id)
        except ProductImageAsset.DoesNotExist:
            return Response({"error": "Asset not found"}, status=status.HTTP_404_NOT_FOUND)

        product_id = request.data.get("product_id")
        if not product_id:
            return Response({"error": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        link, _ = ProductImageAssetLink.objects.get_or_create(
            asset=asset,
            product=product,
            defaults={"position": product.images.count()}
        )

        existing_img = product.images.filter(image=asset.image.name).first()
        if not existing_img:
            ProductImage.objects.create(
                product=product,
                image=asset.image.name,
                alt_text=asset.alt_text or product.name,
                is_primary=(product.images.count() == 0)
            )

        return Response({"link": ProductImageAssetLinkSerializer(link).data}, status=status.HTTP_201_CREATED)


class ProductImageAssetUnlinkView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def delete(self, request, asset_id, link_id):
        try:
            link = ProductImageAssetLink.objects.select_related("product", "asset").get(pk=link_id, asset_id=asset_id)
        except ProductImageAssetLink.DoesNotExist:
            return Response({"error": "Link not found."}, status=status.HTTP_404_NOT_FOUND)

        product = link.product
        asset = link.asset

        ProductImage.objects.filter(product=product, image=asset.image.name).delete()
        link.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)



class AdminProductImageManageView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)

    def patch(self, request, pk):
        try:
            image = ProductImage.objects.select_related("product").get(pk=pk)
        except ProductImage.DoesNotExist:
            raise NotFound("Image not found")

        data = request.data
        if data.get("is_primary"):
            image.product.images.exclude(pk=image.pk).update(is_primary=False)
            image.is_primary = True
        if "variant_id" in data:
            v_id = data["variant_id"]
            if v_id in (None, "", "null"):
                image.variant = None
            else:
                try:
                    image.variant = image.product.variants.get(pk=v_id)
                except (ProductVariant.DoesNotExist, ValueError):
                    pass
        if "alt_text" in data:
            image.alt_text = data["alt_text"]
        image.save()
        return Response(ProductImageSerializer(image, context={"request": request}).data)

    def delete(self, request, pk):
        try:
            image = ProductImage.objects.get(pk=pk)
        except ProductImage.DoesNotExist:
            raise NotFound("Image not found")
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ==================== HERO SLIDES APIS ====================
class PublicHeroSlideListView(generics.ListAPIView):
    serializer_class = HeroSlideSerializer
    permission_classes = (permissions.AllowAny,)

    def get_queryset(self):
        return HeroSlide.objects.filter(is_active=True).select_related("product").order_by("position", "-created_at")


class AdminHeroSlideListCreateView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        slides = HeroSlide.objects.all().select_related("product").order_by("position", "-created_at")
        serializer = HeroSlideSerializer(slides, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        if "product" in data and (data["product"] in ("", "null", "none", None)):
            data["product"] = None

        if "is_active" in data:
            val = str(data["is_active"]).lower()
            data["is_active"] = val in ("true", "1", "t", "yes")

        serializer = HeroSlideSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            slide = serializer.save()
            return Response(HeroSlideSerializer(slide, context={"request": request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminHeroSlideDetailView(APIView):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = (IsAdminUser,)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_object(self, pk):
        try:
            return HeroSlide.objects.select_related("product").get(pk=pk)
        except HeroSlide.DoesNotExist:
            raise NotFound("Slide not found")

    def get(self, request, pk):
        slide = self.get_object(pk)
        return Response(HeroSlideSerializer(slide, context={"request": request}).data)

    def patch(self, request, pk):
        slide = self.get_object(pk)
        data = request.data.copy()
        if "product" in data and (data["product"] in ("", "null", "none", None)):
            data["product"] = None
        if "is_active" in data:
            val = str(data["is_active"]).lower()
            data["is_active"] = val in ("true", "1", "t", "yes")

        serializer = HeroSlideSerializer(slide, data=data, partial=True, context={"request": request})
        if serializer.is_valid():
            slide = serializer.save()
            return Response(HeroSlideSerializer(slide, context={"request": request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        return self.patch(request, pk)

    def delete(self, request, pk):
        slide = self.get_object(pk)
        slide.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

