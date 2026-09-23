from django.contrib import admin
from .models import Category, Product, ProductImage, Order, OrderItem

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "price", "stock", "is_active")
    list_filter = ("category", "is_active")
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
    list_display = ("id", "customer_name", "email", "status", "created_at")
    list_filter = ("status",)
    inlines = [OrderItemInline]
