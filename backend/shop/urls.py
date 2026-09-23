from django.urls import path
from . import views

urlpatterns = [
    path("health/", views.health),
    path("categories/", views.CategoryList.as_view()),
    path("products/", views.ProductList.as_view()),
    path("products/<slug:slug>/", views.ProductDetail.as_view()),
    path("orders/", views.OrderCreate.as_view()),
    path("carts/<uuid:token>/", views.CartDetail.as_view()),
    path("carts/<uuid:token>/items/", views.CartItemCreate.as_view()),
]
