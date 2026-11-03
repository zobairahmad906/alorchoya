from django.db import models
from decimal import Decimal
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    def __str__(self): return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT)
    name = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    base_sku = models.CharField(max_length=100, blank=True, default="", db_index=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    weight_kg = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    dimension_length_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dimension_width_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    dimension_height_cm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock_alert_threshold = models.PositiveIntegerField(default=5)
    attributes = models.JSONField(default=dict, blank=True)
    warranty_information = models.TextField(blank=True, default="")
    voice_audio_file = models.FileField(upload_to="product_voices/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return self.name


class ProductVariant(models.Model):
    product = models.ForeignKey(Product, related_name="variants", on_delete=models.CASCADE)
    attributes = models.JSONField(default=dict, blank=True)
    sku = models.CharField(max_length=100, blank=True, default="", db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.product.name} - {self.sku or self.id}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, related_name="images", null=True, blank=True, on_delete=models.SET_NULL)
    image = models.ImageField(upload_to="products/%Y/%m/")
    hero_desktop = models.ImageField(upload_to="products/hero/%Y/%m/", blank=True)
    hero_mobile = models.ImageField(upload_to="products/hero/%Y/%m/", blank=True)
    card_image = models.ImageField(upload_to="products/card/%Y/%m/", blank=True)
    alt_text = models.CharField(max_length=180, blank=True)
    is_primary = models.BooleanField(default=False)
    def __str__(self): return self.alt_text or self.product.name

class Order(models.Model):
    customer = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="customer_orders")
    STATUS_CHOICES = [("pending", "Pending"), ("confirmed", "Confirmed"), ("courier_booked", "Booked to Courier"), ("processing", "Processing"), ("paid", "Paid"), ("shipped", "Shipped"), ("delivered", "Delivered"), ("cancelled", "Cancelled")]
    PAYMENT_CHOICES = [("cod", "Cash on delivery"), ("online", "Online payment")]
    customer_name = models.CharField(max_length=120)
    email = models.EmailField()
    phone = models.CharField(max_length=30)
    address = models.TextField()
    delivery_zone = models.ForeignKey("DeliveryZone", null=True, blank=True, on_delete=models.PROTECT, related_name="orders")
    delivery_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    coupon_code = models.CharField(max_length=40, blank=True)
    payment_method = models.CharField(max_length=12, choices=PAYMENT_CHOICES, default="cod")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    courier_provider = models.CharField(max_length=30, blank=True, default="")
    courier_city_id = models.CharField(max_length=40, blank=True, default="")
    courier_city_name = models.CharField(max_length=120, blank=True, default="")
    courier_zone_id = models.CharField(max_length=40, blank=True, default="")
    courier_zone_name = models.CharField(max_length=120, blank=True, default="")
    courier_area_id = models.CharField(max_length=40, blank=True, default="")
    courier_area_name = models.CharField(max_length=120, blank=True, default="")
    courier_weight_kg = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    consignment_id = models.CharField(max_length=100, blank=True, default="")
    tracking_code = models.CharField(max_length=100, blank=True, default="")
    courier_status = models.CharField(max_length=100, blank=True, default="")
    courier_status_updated_at = models.DateTimeField(null=True, blank=True)
    courier_booking_data = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    @property
    def total(self):
        subtotal = sum((item.quantity * item.unit_price for item in self.items.all()), Decimal("0.00"))
        delivery_charge = Decimal(str(self.delivery_charge or 0))
        discount_amount = Decimal(str(self.discount_amount or 0))
        return subtotal + delivery_charge - discount_amount

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

class Cart(models.Model):
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    user = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.CASCADE, related_name="carts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("cart", "product"), name="unique_cart_product")]

class DeliveryZone(models.Model):
    name = models.CharField(max_length=100, unique=True)
    charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.name

class Coupon(models.Model):
    DISCOUNT_CHOICES = [("percent", "Percentage"), ("fixed", "Fixed amount")]
    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=8, choices=DISCOUNT_CHOICES, default="percent")
    value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self): return self.code

class Review(models.Model):
    product = models.ForeignKey(Product, related_name="reviews", on_delete=models.CASCADE)
    customer_name = models.CharField(max_length=120, default="সন্তুষ্ট গ্রাহক")
    email = models.EmailField(blank=True)
    avatar_url = models.CharField(max_length=500, blank=True)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    is_approved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ("-created_at",)
    def __str__(self): return f"{self.product.name} - {self.rating}/5"

class AuditEvent(models.Model):
    actor = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=40)
    model_name = models.CharField(max_length=80)
    object_id = models.CharField(max_length=64)
    message = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ("-created_at",)
    def __str__(self): return f"{self.action} {self.model_name}#{self.object_id}"


class CustomerProfile(models.Model):
    user = models.OneToOneField("auth.User", on_delete=models.CASCADE, related_name="customer_profile")
    google_sub = models.CharField(max_length=255, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    avatar_url = models.URLField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return self.user.email or self.user.username

class CustomerAddress(models.Model):
    profile = models.ForeignKey(CustomerProfile, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=60, default="বাড়ি")
    recipient_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=30)
    address = models.TextField()
    district = models.CharField(max_length=100, blank=True)
    upazila = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ("-is_default", "-created_at")
    def __str__(self): return f"{self.label} - {self.recipient_name}"


class ProductImageAsset(models.Model):
    PROCESSING_CHOICES = (
        ("pending", "Pending"),
        ("processing", "Processing"),
        ("ready", "Ready"),
        ("failed", "Failed"),
    )
    user = models.ForeignKey("auth.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="product_image_assets")
    image = models.ImageField(upload_to="products/library/%Y/%m/")
    filename = models.CharField(max_length=255, blank=True, default="")
    alt_text = models.CharField(max_length=255, blank=True, default="")
    image_caption = models.TextField(blank=True, default="")
    processing_status = models.CharField(max_length=20, choices=PROCESSING_CHOICES, default="ready")
    processing_error = models.TextField(blank=True, default="")
    embedding_version = models.CharField(max_length=64, blank=True, default="gemini-embedding-001")
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]

    def __str__(self):
        return self.filename or f"Asset #{self.id}"


class ProductImageAssetLink(models.Model):
    asset = models.ForeignKey(ProductImageAsset, on_delete=models.CASCADE, related_name="links")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="image_asset_links")
    position = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("asset", "product")]
        ordering = ["position", "-created_at"]

    def __str__(self):
        return f"{self.asset_id} -> {self.product.name}"

class HeroSlide(models.Model):
    title = models.CharField(max_length=200, blank=True, default="", help_text="হেডিং / শিরোনাম")
    subtitle = models.TextField(blank=True, default="", help_text="উপশিরোনাম / বিবরণ")
    eyebrow = models.CharField(max_length=100, blank=True, default="★ বিশেষ অফার", help_text="ট্যাগ বা ব্যাজ")
    image = models.ImageField(upload_to="hero/%Y/%m/", help_text="স্লাইডের ছবি")
    mobile_image = models.ImageField(upload_to="hero/mobile/%Y/%m/", blank=True, null=True, help_text="মোবাইলের জন্য ছবি (ঐচ্ছিক)")
    button_text = models.CharField(max_length=80, blank=True, default="কেনাকাটা শুরু করুন", help_text="বাটন টেক্সট")
    button_link = models.CharField(max_length=255, blank=True, default="#shop", help_text="বাটন লিংক")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="hero_slides", help_text="নির্দিষ্ট পণ্যের সাথে লিংক (ঐচ্ছিক)")
    position = models.PositiveIntegerField(default=0, help_text="ক্রম / পজিশন")
    is_active = models.BooleanField(default=True, db_index=True, help_text="সক্রিয় কি না")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position", "-created_at"]

    def __str__(self):
        return self.title or f"Hero Slide #{self.id}"


class CourierConfig(models.Model):
    provider = models.CharField(max_length=30, choices=[("steadfast", "SteadFast"), ("pathao", "Pathao")], unique=True)
    is_active = models.BooleanField(default=False)
    is_sandbox = models.BooleanField(default=True)
    api_key = models.CharField(max_length=255, blank=True, default="")
    api_secret = models.CharField(max_length=255, blank=True, default="")
    client_id = models.CharField(max_length=255, blank=True, default="")
    client_secret = models.CharField(max_length=255, blank=True, default="")
    username = models.CharField(max_length=255, blank=True, default="")
    password = models.CharField(max_length=255, blank=True, default="")
    store_id = models.CharField(max_length=100, blank=True, default="")
    webhook_secret = models.CharField(max_length=255, blank=True, default="")
    webhook_integration_secret = models.CharField(max_length=255, blank=True, default="")
    access_token = models.TextField(blank=True, default="")
    token_expires_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.provider.upper()} ({'Active' if self.is_active else 'Disabled'})"

