from django.db import models
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    def __str__(self): return self.name

class Product(models.Model):
    category = models.ForeignKey(Category, related_name="products", on_delete=models.PROTECT)
    name = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.name

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="products/%Y/%m/")
    hero_desktop = models.ImageField(upload_to="products/hero/%Y/%m/", blank=True)
    hero_mobile = models.ImageField(upload_to="products/hero/%Y/%m/", blank=True)
    alt_text = models.CharField(max_length=180, blank=True)
    is_primary = models.BooleanField(default=False)
    def __str__(self): return self.alt_text or self.product.name

class Order(models.Model):
    customer = models.ForeignKey("auth.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="customer_orders")
    STATUS_CHOICES = [("pending", "Pending"), ("confirmed", "Confirmed"), ("processing", "Processing"), ("paid", "Paid"), ("shipped", "Shipped"), ("delivered", "Delivered"), ("cancelled", "Cancelled")]
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
    created_at = models.DateTimeField(auto_now_add=True)
    @property
    def total(self): return sum(item.quantity * item.unit_price for item in self.items.all()) + self.delivery_charge - self.discount_amount

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
