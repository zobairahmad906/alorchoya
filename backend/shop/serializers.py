import os
from django.utils import timezone
from django.db import transaction
from rest_framework import serializers
from .models import Category, Product, ProductVariant, ProductImage, Order, OrderItem, Cart, CartItem, DeliveryZone, Coupon, Review, CustomerProfile, CustomerAddress, ProductImageAsset, ProductImageAssetLink

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ("id", "attributes", "sku", "price", "stock")

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    hero_desktop = serializers.SerializerMethodField()
    hero_mobile = serializers.SerializerMethodField()
    card_image = serializers.SerializerMethodField()
    variant_id = serializers.PrimaryKeyRelatedField(source="variant", read_only=True)
    class Meta:
        model = ProductImage
        fields = ("id", "image", "hero_desktop", "hero_mobile", "card_image", "alt_text", "is_primary", "variant_id")

    def _get_file_url(self, file):
        if not file:
            return None
        url = file.url
        if url.startswith("/"):
            request = self.context.get("request")
            return request.build_absolute_uri(url) if request else url
        internal = os.getenv("MINIO_ENDPOINT", "minio:9000")
        public = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
        scheme = "https" if public not in ("localhost:9000", "127.0.0.1:9000") else "http"
        return url.replace(f"http://{internal}", f"{scheme}://{public}")

    def get_image(self, obj):
        return self._get_file_url(obj.image)

    def get_hero_desktop(self, obj):
        return self._get_file_url(obj.hero_desktop)

    def get_hero_mobile(self, obj):
        return self._get_file_url(obj.hero_mobile)

    def get_card_image(self, obj):
        return self._get_file_url(obj.card_image)

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(required=False, allow_blank=True, default="সন্তুষ্ট কাস্টমার")
    avatar_url = serializers.SerializerMethodField()
    product_name = serializers.ReadOnlyField(source="product.name")
    product_slug = serializers.ReadOnlyField(source="product.slug")

    def get_avatar_url(self, obj):
        if obj.avatar_url:
            return obj.avatar_url
        if obj.email:
            from .models import CustomerProfile
            profile = CustomerProfile.objects.filter(user__email=obj.email).first()
            if profile and profile.avatar_url:
                return profile.avatar_url
        return ""

    class Meta:
        model = Review
        fields = ("id", "customer_name", "avatar_url", "rating", "comment", "created_at", "product_name", "product_slug")
        read_only_fields = ("id", "created_at")
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    voice_audio_file = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()

    def get_voice_audio_file(self, obj):
        if not obj.voice_audio_file:
            return None
        url = obj.voice_audio_file.url
        request = self.context.get("request")
        return request.build_absolute_uri(url) if request else url

    def get_reviews(self, obj):
        approved = obj.reviews.filter(is_approved=True)
        return ReviewSerializer(approved, many=True).data

    def get_average_rating(self, obj):
        approved = obj.reviews.filter(is_approved=True)
        if not approved.exists():
            return 5.0
        avg = sum(r.rating for r in approved) / approved.count()
        return round(avg, 1)

    def get_total_reviews(self, obj):
        return obj.reviews.filter(is_approved=True).count()

    class Meta:
        model = Product
        fields = (
            "id", "name", "slug", "base_sku", "description",
            "price", "discount_price", "cost_price", "stock",
            "weight_kg", "dimension_length_cm", "dimension_width_cm", "dimension_height_cm",
            "stock_alert_threshold", "attributes", "warranty_information",
            "voice_audio_file", "is_featured", "is_active",
            "category", "images", "variants", "reviews", "average_rating", "total_reviews",
            "created_at", "updated_at"
        )

class DeliveryZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryZone
        fields = ("id", "name", "charge")

class OrderTrackingSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = Order
        fields = ("id", "status", "payment_method", "total", "created_at")

class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    delivery_zone_id = serializers.PrimaryKeyRelatedField(queryset=DeliveryZone.objects.filter(is_active=True), source="delivery_zone", write_only=True, required=False, allow_null=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=40)
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_CHOICES, default="cod")
    class Meta:
        model = Order
        fields = ("id", "customer_name", "email", "phone", "address", "status", "items", "total", "created_at", "delivery_zone_id", "delivery_charge", "discount_amount", "coupon_code", "payment_method")
        read_only_fields = ("status", "created_at", "delivery_charge", "discount_amount")
    def create(self, validated_data):
        item_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "").strip().upper()
        delivery_zone = validated_data.get("delivery_zone")
        with transaction.atomic():
            order = Order.objects.create(customer=self.context["request"].user if self.context.get("request") and self.context["request"].user.is_authenticated else None, **validated_data)
            subtotal = 0
            for row in item_data:
                try:
                    product = Product.objects.select_for_update().get(pk=row["product_id"], is_active=True)
                except Product.DoesNotExist:
                    raise serializers.ValidationError({"items": "One or more products are unavailable."})
                if product.stock < row["quantity"]:
                    raise serializers.ValidationError({"items": f"Insufficient stock for {product.name}."})
                unit_price = product.discount_price or product.price
                OrderItem.objects.create(order=order, product=product, quantity=row["quantity"], unit_price=unit_price)
                subtotal += unit_price * row["quantity"]
                product.stock -= row["quantity"]
                product.save(update_fields=["stock"])
            discount = 0
            if coupon_code:
                try:
                    coupon = Coupon.objects.select_for_update().get(code=coupon_code, is_active=True)
                except Coupon.DoesNotExist:
                    raise serializers.ValidationError({"coupon_code": "Couponটি সঠিক নয় বা inactive."})
                if coupon.expires_at and coupon.expires_at <= timezone.now():
                    raise serializers.ValidationError({"coupon_code": "Couponটির মেয়াদ শেষ হয়েছে."})
                if coupon.max_uses is not None and coupon.used_count >= coupon.max_uses:
                    raise serializers.ValidationError({"coupon_code": "Couponটির ব্যবহারসীমা শেষ হয়েছে."})
                if subtotal < coupon.min_order:
                    raise serializers.ValidationError({"coupon_code": f"এই coupon-এর জন্য minimum order ৳{coupon.min_order}."})
                discount = subtotal * coupon.value / 100 if coupon.discount_type == "percent" else coupon.value
                discount = min(discount, subtotal)
                coupon.used_count += 1
                coupon.save(update_fields=["used_count"])
            order.delivery_charge = delivery_zone.charge if delivery_zone else 0
            order.discount_amount = discount
            order.coupon_code = coupon_code
            order.save(update_fields=["delivery_charge", "discount_amount", "coupon_code"])

            # Auto-save address & phone to user profile if user is authenticated
            user = self.context.get("request").user if self.context.get("request") and self.context["request"].user.is_authenticated else None
            if user:
                profile, _ = CustomerProfile.objects.get_or_create(user=user)
                if not profile.phone and validated_data.get("phone"):
                    profile.phone = validated_data["phone"]
                    profile.save(update_fields=["phone"])
                
                # Check if this address (or part of it) is already saved to avoid duplicates
                addr_text = validated_data.get("address", "").strip()
                if addr_text:
                    existing = False
                    for existing_addr in profile.addresses.all():
                        if existing_addr.address.strip() in addr_text or addr_text in existing_addr.address.strip():
                            existing = True
                            break
                    if not existing:
                        profile.addresses.update(is_default=False)
                        CustomerAddress.objects.create(
                            profile=profile,
                            label="বাসা",
                            recipient_name=validated_data.get("customer_name", user.get_full_name() or user.email),
                            phone=validated_data.get("phone", profile.phone),
                            address=addr_text,
                            is_default=True
                        )
        return order

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError("কার্ট খালি। অন্তত একটি পণ্য নির্বাচন করুন।")
        product_ids = [row["product_id"] for row in value]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError("একই পণ্য একাধিকবার পাঠানো যাবে না।")
        return value

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "quantity")

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    class Meta:
        model = Cart
        fields = ("token", "items", "created_at", "updated_at")


class CustomerProfileSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="user.get_full_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    class Meta:
        model = CustomerProfile
        fields = ("name", "email", "phone", "avatar_url", "updated_at")
        read_only_fields = ("name", "email", "updated_at")

class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAddress
        fields = ("id", "label", "recipient_name", "phone", "address", "district", "upazila", "is_default", "created_at")
        read_only_fields = ("id", "created_at")

class CustomerOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    product_slug = serializers.ReadOnlyField(source="product.slug")
    product_image = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ("id", "product_name", "product_slug", "product_image", "quantity", "unit_price")

    def get_product_image(self, obj):
        img_obj = obj.product.images.filter(is_primary=True).first() or obj.product.images.first()
        if not img_obj:
            return None
        file_obj = img_obj.hero_desktop or img_obj.image
        if not file_obj:
            return None
        url = file_obj.url
        if url.startswith("/"):
            request = self.context.get("request")
            return request.build_absolute_uri(url) if request else url
        internal = os.getenv("MINIO_ENDPOINT", "minio:9000")
        public = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
        scheme = "https" if public not in ("localhost:9000", "127.0.0.1:9000") else "http"
        return url.replace(f"http://{internal}", f"{scheme}://{public}")

class CustomerOrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    items = CustomerOrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ("id", "status", "status_display", "payment_method", "customer_name", "phone", "email", "address", "delivery_charge", "discount_amount", "created_at", "total", "items")


class ProductImageAssetLinkSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source="product.name")
    product_slug = serializers.ReadOnlyField(source="product.slug")
    variant_label = serializers.SerializerMethodField()

    def get_variant_label(self, obj):
        return None

    class Meta:
        model = ProductImageAssetLink
        fields = ("id", "asset_id", "product_id", "product_name", "product_slug", "variant_label", "position", "created_at")
        read_only_fields = ("id", "created_at")


class ProductImageAssetSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    links = serializers.SerializerMethodField()
    file_size = serializers.SerializerMethodField()
    dimensions = serializers.SerializerMethodField()

    def _get_file_url(self, file_field):
        if not file_field:
            return None
        try:
            url = file_field.url
        except Exception:
            return None
        if url.startswith("/"):
            request = self.context.get("request")
            return request.build_absolute_uri(url) if request else url
        internal = os.getenv("MINIO_ENDPOINT", "minio:9000")
        public = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
        scheme = "https" if public not in ("localhost:9000", "127.0.0.1:9000") else "http"
        return url.replace(f"http://{internal}", f"{scheme}://{public}")

    def get_image(self, obj):
        return self._get_file_url(obj.image)

    def get_links(self, obj):
        result = []
        for link in obj.links.select_related("product"):
            result.append({
                "id": link.id,
                "asset_id": link.asset_id,
                "product_id": link.product_id,
                "variant_id": None,
                "product_name": link.product.name,
                "product_slug": link.product.slug,
                "variant_sku": None,
                "variant_label": None,
                "position": link.position,
                "created_at": link.created_at,
            })
        return result

    def get_file_size(self, obj):
        try:
            return obj.image.size if obj.image else None
        except Exception:
            return None

    def get_dimensions(self, obj):
        try:
            if obj.image:
                return {"width": obj.image.width, "height": obj.image.height}
        except Exception:
            pass
        return None

    class Meta:
        model = ProductImageAsset
        fields = [
            "id", "image", "filename", "alt_text", "image_caption", "links",
            "processing_status", "processing_error", "embedding_version",
            "position", "file_size", "dimensions", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "image", "processing_status", "processing_error",
            "embedding_version", "file_size", "dimensions", "created_at", "updated_at",
        ]

