import os
import re
from django.utils import timezone
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import APIException
from .models import Category, Product, ProductVariant, ProductImage, Order, OrderItem, Cart, CartItem, DeliveryZone, Coupon, Review, CustomerProfile, CustomerAddress, ProductImageAsset, ProductImageAssetLink, HeroSlide, CourierConfig
from .courier import PathaoCourierClient


def build_media_url(file_field, request=None):
    if not file_field:
        return None
    try:
        url = file_field.url
    except Exception:
        return None
    if not url:
        return None
    if url.startswith("/"):
        return request.build_absolute_uri(url) if request else url

    public = os.getenv("MINIO_PUBLIC_ENDPOINT", "minio-alorchoya.newsmartagent.com").strip()
    if not public or public in ("localhost:9000", "127.0.0.1:9000"):
        if request and request.is_secure():
            public = "minio-alorchoya.newsmartagent.com"
        elif os.getenv("DEBUG", "0") != "1":
            public = "minio-alorchoya.newsmartagent.com"
        else:
            public = "localhost:9000"

    scheme = "http" if public in ("localhost:9000", "127.0.0.1:9000") else "https"
    public_clean = re.sub(r"^https?://", "", public).rstrip("/")

    cleaned = re.sub(r"^https?://minio(?::9000)?(?=/|$)", f"{scheme}://{public_clean}", url)
    internal = os.getenv("MINIO_ENDPOINT", "minio:9000").strip()
    internal_clean = re.sub(r"^https?://", "", internal).rstrip("/")
    if internal_clean:
        cleaned = re.sub(r"^https?://" + re.escape(internal_clean) + r"(?=/|$)", f"{scheme}://{public_clean}", cleaned)

    # Clean any accidental duplicate hostnames
    cleaned = re.sub(
        r"minio-alorchoya\.newsmartagent\.com(-alorchoya\.newsmartagent\.com)+",
        "minio-alorchoya.newsmartagent.com",
        cleaned,
    )

    if scheme == "https" and cleaned.startswith(f"http://{public_clean}"):
        cleaned = cleaned.replace(f"http://{public_clean}", f"https://{public_clean}")

    return cleaned


class CourierServiceUnavailable(APIException):
    status_code = 503
    default_detail = "Courier service could not verify the delivery location or charge. Please try again."
    default_code = "courier_unavailable"

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
        return build_media_url(file, self.context.get("request"))

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
        return build_media_url(obj.voice_audio_file, self.context.get("request"))

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
    email = serializers.EmailField(required=False, allow_blank=True)
    delivery_zone_id = serializers.PrimaryKeyRelatedField(queryset=DeliveryZone.objects.filter(is_active=True), source="delivery_zone", write_only=True, required=False, allow_null=True)
    coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=40)
    payment_method = serializers.ChoiceField(choices=(("cod", "Cash on delivery"),), default="cod")
    courier_provider = serializers.ChoiceField(choices=(("pathao", "Pathao"),))
    courier_city_id = serializers.CharField(max_length=40)
    courier_city_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    courier_zone_id = serializers.CharField(max_length=40)
    courier_zone_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    courier_area_id = serializers.CharField(max_length=40)
    courier_area_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    class Meta:
        model = Order
        fields = ("id", "customer_name", "email", "phone", "address", "status", "items", "total", "created_at", "delivery_zone_id", "delivery_charge", "discount_amount", "coupon_code", "payment_method", "courier_provider", "courier_city_id", "courier_city_name", "courier_zone_id", "courier_zone_name", "courier_area_id", "courier_area_name")
        read_only_fields = ("status", "created_at", "delivery_charge", "discount_amount")
    def create(self, validated_data):
        item_data = validated_data.pop("items")
        coupon_code = validated_data.pop("coupon_code", "").strip().upper()
        if not validated_data.get("email"):
            clean_phone = re.sub(r"\D", "", validated_data.get("phone", "")) or "customer"
            validated_data["email"] = f"{clean_phone}@customer.alorchoya.com"
        delivery_zone = validated_data.get("delivery_zone")
        location_ids = {
            "courier_city_id": validated_data.get("courier_city_id", ""),
            "courier_zone_id": validated_data.get("courier_zone_id", ""),
            "courier_area_id": validated_data.get("courier_area_id", ""),
        }
        with transaction.atomic():
            user = self.context["request"].user if self.context.get("request") and self.context["request"].user.is_authenticated else None
            if not user and validated_data.get("email"):
                from django.contrib.auth import get_user_model
                User = get_user_model()
                user = User.objects.filter(email__iexact=validated_data["email"]).first()
            order = Order.objects.create(customer=user, **validated_data)
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
            config = CourierConfig.objects.filter(provider="pathao", is_active=True).first()
            if not config or config.is_sandbox or not (config.client_id and config.client_secret and config.username and config.password and config.store_id):
                raise serializers.ValidationError({"courier_provider": "Pathao live delivery is not currently available."})
            if not all(value.isdigit() for value in location_ids.values()):
                raise serializers.ValidationError({"address": "Choose a valid city, zone, and area."})
            client = PathaoCourierClient(config)
            def find_location(rows, location_id, id_keys, name_keys):
                for row in rows:
                    row_id = next((row.get(key) for key in id_keys if row.get(key) is not None), "")
                    if str(row_id) == str(location_id):
                        return str(next((row.get(key) for key in name_keys if row.get(key)), ""))
                return None
            city_name = zone_name = area_name = None
            try:
                city_name = find_location(client.get_cities(), location_ids["courier_city_id"], ("city_id", "id"), ("city_name", "name"))
                zone_name = find_location(client.get_zones(location_ids["courier_city_id"]), location_ids["courier_zone_id"], ("zone_id", "id"), ("zone_name", "name"))
                area_name = find_location(client.get_areas(location_ids["courier_zone_id"]), location_ids["courier_area_id"], ("area_id", "id"), ("area_name", "name"))
            except Exception:
                raise CourierServiceUnavailable()
            if not city_name or not zone_name or not area_name:
                raise serializers.ValidationError({"address": "The selected courier location is no longer available. Please select it again."})
            item_weight = sum(float(row["quantity"]) * float(Product.objects.get(pk=row["product_id"]).weight_kg or 0.5) for row in item_data)
            try:
                live_delivery_charge, _ = client.calculate_delivery_charge(
                    location_ids["courier_city_id"], location_ids["courier_zone_id"], max(item_weight, 0.5)
                )
            except Exception:
                raise CourierServiceUnavailable()

            validated_data["courier_city_name"] = city_name
            validated_data["courier_zone_name"] = zone_name
            validated_data["courier_area_name"] = area_name
            order.courier_city_name = city_name
            order.courier_zone_name = zone_name
            order.courier_area_name = area_name
            order.courier_weight_kg = round(max(item_weight, 0.5), 3)
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
            order.delivery_charge = live_delivery_charge
            order.discount_amount = discount
            order.coupon_code = coupon_code
            order.save(update_fields=["delivery_charge", "discount_amount", "coupon_code", "courier_city_name", "courier_zone_name", "courier_area_name", "courier_weight_kg"])

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
        file_obj = img_obj.card_image or img_obj.hero_desktop or img_obj.image
        if not file_obj:
            return None
        return build_media_url(file_obj, self.context.get("request"))

class CustomerOrderSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    items = CustomerOrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    customer_avatar = serializers.SerializerMethodField()
    customer_profile_name = serializers.SerializerMethodField()
    customer_username = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "status_display",
            "payment_method",
            "customer_name",
            "customer_profile_name",
            "customer_username",
            "customer_avatar",
            "phone",
            "email",
            "address",
            "delivery_charge",
            "discount_amount",
            "courier_provider",
            "courier_city_id",
            "courier_city_name",
            "courier_zone_id",
            "courier_zone_name",
            "courier_area_id",
            "courier_area_name",
            "courier_weight_kg",
            "consignment_id",
            "tracking_code",
            "courier_status",
            "courier_status_updated_at",
            "courier_booking_data",
            "created_at",
            "total",
            "items",
        )

    def get_customer_avatar(self, obj):
        if obj.customer:
            profile = getattr(obj.customer, "customer_profile", None)
            if profile and profile.avatar_url:
                return profile.avatar_url
        if obj.email:
            profile = CustomerProfile.objects.filter(user__email=obj.email).exclude(avatar_url="").first()
            if profile and profile.avatar_url:
                return profile.avatar_url
        if obj.phone:
            profile = CustomerProfile.objects.filter(phone=obj.phone).exclude(avatar_url="").first()
            if profile and profile.avatar_url:
                return profile.avatar_url
        return None

    def get_customer_profile_name(self, obj):
        if obj.customer:
            full_name = f"{obj.customer.first_name or ''} {obj.customer.last_name or ''}".strip()
            return full_name or obj.customer.username or obj.customer_name
        return obj.customer_name

    def get_customer_username(self, obj):
        if obj.customer:
            return obj.customer.username
        return None


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
        return build_media_url(file_field, self.context.get("request"))

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

class AdminCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_type", "value", "min_order",
            "max_uses", "used_count", "expires_at", "is_active"
        ]
        read_only_fields = ["id", "used_count"]

class HeroSlideSerializer(serializers.ModelSerializer):
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.CharField(source="product.price", read_only=True)
    product_discount_price = serializers.CharField(source="product.discount_price", read_only=True)

    class Meta:
        model = HeroSlide
        fields = [
            "id", "title", "subtitle", "eyebrow", "image", "mobile_image",
            "button_text", "button_link", "product", "product_slug",
            "product_name", "product_price", "product_discount_price",
            "position", "is_active", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        extra_kwargs = {
            "image": {"required": False},
            "mobile_image": {"required": False, "allow_null": True},
        }

    def _get_file_url(self, file_field):
        return build_media_url(file_field, self.context.get("request"))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image"] = self._get_file_url(instance.image)
        data["mobile_image"] = self._get_file_url(instance.mobile_image)
        return data


class CourierConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourierConfig
        fields = [
            "id", "provider", "is_active", "is_sandbox",
            "api_key", "api_secret", "client_id", "client_secret",
            "username", "password", "store_id", "webhook_secret", "updated_at"
        ]


