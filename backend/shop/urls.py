from django.urls import path
from . import views
from . import google_auth

urlpatterns = [
    path("auth/google/start/", google_auth.google_start),
    path("auth/google/callback/", google_auth.google_callback),
    path("auth/me/", google_auth.auth_me),
    path("auth/csrf/", google_auth.csrf_token),
    path("auth/logout/", views.CustomerLogout.as_view()),
    path("customer/profile/", views.CustomerProfileView.as_view()),
    path("customer/addresses/", views.CustomerAddressListCreate.as_view()),
    path("customer/addresses/<int:pk>/", views.CustomerAddressDetail.as_view()),
    path("health/", views.health),
    path("categories/", views.CategoryList.as_view()),
    path("products/", views.ProductList.as_view()),
    path("products/<slug:slug>/", views.ProductDetail.as_view()),
    path("orders/", views.OrderCreate.as_view()),
    path("orders/track/", views.OrderTrack.as_view()),
    path("delivery-zones/", views.DeliveryZoneList.as_view()),
    path("products/<slug:slug>/reviews/", views.ReviewCreate.as_view()),
    path("reviews/featured/", views.FeaturedReviewList.as_view()),
    path("products/<int:pk>/upload-images/", views.ProductMultiImageUploadView.as_view()),
    path("carts/<uuid:token>/", views.CartDetail.as_view()),
    path("carts/<uuid:token>/items/", views.CartItemCreate.as_view()),
    path("carts/<uuid:token>/items/<int:product_id>/", views.CartItemDetail.as_view()),
    
    # Admin API endpoints
    path("admin/login/", views.AdminLoginView.as_view()),
    path("admin/dashboard/stats/", views.AdminDashboardStatsView.as_view()),
    path("admin/orders/", views.AdminOrderListDetailView.as_view()),
    path("admin/orders/<int:pk>/", views.AdminOrderListDetailView.as_view()),
    path("admin/products/", views.AdminProductListCreateView.as_view()),
    path("admin/products/<int:pk>/", views.AdminProductDetailView.as_view()),
]

