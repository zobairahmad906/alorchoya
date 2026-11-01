from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem, DeliveryZone, Coupon, Review, AuditEvent, CustomerProfile, CustomerAddress, ProductImageAsset, ProductImageAssetLink

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 5
    fields = ("image", "alt_text", "is_primary")

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "discount_price", "stock", "is_featured", "is_active")
    list_filter = ("category", "is_featured", "is_active")
    list_editable = ("is_featured", "is_active")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductImageInline]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    prepopulated_fields = {"slug": ("name",)}

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "quantity", "unit_price")

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "customer_name", "phone", "status", "payment_method", "delivery_charge", "discount_amount", "created_at")
    list_filter = ("status",)
    inlines = [OrderItemInline]
    def save_model(self, request, obj, form, change):
        previous = Order.objects.get(pk=obj.pk).status if change else None
        super().save_model(request, obj, form, change)
        if previous != obj.status:
            AuditEvent.objects.create(actor=request.user, action="status_changed", model_name="Order", object_id=str(obj.pk), message=f"{previous or 'new'} -> {obj.status}")

@admin.register(DeliveryZone)
class DeliveryZoneAdmin(admin.ModelAdmin):
    list_display = ("name", "charge", "is_active")
    list_editable = ("charge", "is_active")

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "min_order", "used_count", "expires_at", "is_active")
    list_filter = ("discount_type", "is_active")

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "customer_name", "rating", "is_approved", "created_at")
    list_filter = ("is_approved", "rating")
    list_editable = ("is_approved",)

@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("created_at", "action", "model_name", "object_id", "actor", "message")
    list_filter = ("action", "model_name")
    readonly_fields = ("created_at", "actor", "action", "model_name", "object_id", "message")
    def has_add_permission(self, request): return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return False


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "updated_at")
    search_fields = ("user__email", "user__first_name", "user__last_name", "phone")

@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display = ("recipient_name", "phone", "district", "is_default", "profile")
    list_filter = ("is_default", "district")
    search_fields = ("recipient_name", "phone", "address", "profile__user__email")


@admin.register(ProductImageAsset)
class ProductImageAssetAdmin(admin.ModelAdmin):
    list_display = ("id", "filename", "alt_text", "processing_status", "position", "created_at")
    list_filter = ("processing_status",)
    search_fields = ("filename", "alt_text", "image_caption")


@admin.register(ProductImageAssetLink)
class ProductImageAssetLinkAdmin(admin.ModelAdmin):
    list_display = ("id", "asset", "product", "position", "created_at")
    list_filter = ("product",)

