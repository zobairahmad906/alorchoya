from rest_framework import generics
from rest_framework.response import Response
from .models import Category, Product, Cart, CartItem
from .serializers import CategorySerializer, ProductSerializer, OrderSerializer, CartSerializer, CartItemSerializer

class CategoryList(generics.ListAPIView):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer

class ProductList(generics.ListAPIView):
    serializer_class = ProductSerializer
    def get_queryset(self):
        qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")
        category = self.request.query_params.get("category")
        return qs.filter(category__slug=category) if category else qs

class ProductDetail(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_active=True).select_related("category").prefetch_related("images")
    serializer_class = ProductSerializer
    lookup_field = "slug"

class OrderCreate(generics.CreateAPIView):
    serializer_class = OrderSerializer

class CartDetail(generics.RetrieveAPIView):
    queryset = Cart.objects.prefetch_related("items__product__category", "items__product__images")
    serializer_class = CartSerializer
    lookup_field = "token"

class CartItemCreate(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(token=self.kwargs["token"])
        product = Product.objects.get(pk=serializer.validated_data["product_id"], is_active=True)
        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": serializer.validated_data["quantity"]})
        if not created:
            item.quantity = serializer.validated_data["quantity"]
            item.save(update_fields=["quantity"])
        serializer.instance = item

def health(request):
    return Response({"status": "ok"})
