import os
from django.db import transaction
from rest_framework import serializers
from .models import Category, Product, ProductImage, Order, OrderItem, Cart, CartItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")

class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary")
    def get_image(self, obj):
        url = obj.image.url
        # Local FileSystemStorage returns a relative /media/... URL.  The
        # storefront is on another origin (port 3000), so return an absolute
        # URL that points to Django. MinIO URLs need their public host swap.
        if url.startswith("/"):
            request = self.context.get("request")
            return request.build_absolute_uri(url) if request else url
        internal = os.getenv("MINIO_ENDPOINT", "minio:9000")
        public = os.getenv("MINIO_PUBLIC_ENDPOINT", "localhost:9000")
        scheme = "https" if public not in ("localhost:9000", "127.0.0.1:9000") else "http"
        return url.replace(f"http://{internal}", f"{scheme}://{public}")

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    class Meta:
        model = Product
        fields = ("id", "name", "slug", "description", "price", "discount_price", "stock", "is_featured", "category", "images")

class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True, write_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    class Meta:
        model = Order
        fields = ("id", "customer_name", "email", "phone", "address", "status", "items", "total", "created_at")
        read_only_fields = ("status", "created_at")
    def create(self, validated_data):
        item_data = validated_data.pop("items")
        with transaction.atomic():
            order = Order.objects.create(**validated_data)
            for row in item_data:
                try:
                    product = Product.objects.select_for_update().get(pk=row["product_id"], is_active=True)
                except Product.DoesNotExist:
                    raise serializers.ValidationError({"items": "One or more products are unavailable."})
                if product.stock < row["quantity"]:
                    raise serializers.ValidationError({"items": f"Insufficient stock for {product.name}."})
                OrderItem.objects.create(order=order, product=product, quantity=row["quantity"], unit_price=product.price)
                product.stock -= row["quantity"]
                product.save(update_fields=["stock"])
        return order

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
