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
    path("hero-slides/", views.PublicHeroSlideListView.as_view()),
    path("admin/hero-slides/", views.AdminHeroSlideListCreateView.as_view()),
    path("admin/hero-slides/<int:pk>/", views.AdminHeroSlideDetailView.as_view()),
    path("admin/dashboard/stats/", views.AdminDashboardStatsView.as_view()),
    path("admin/orders/", views.AdminOrderListDetailView.as_view()),
    path("admin/orders/<int:pk>/", views.AdminOrderListDetailView.as_view()),
    path("admin/customers/", views.AdminCustomerListView.as_view()),
    path("admin/coupons/", views.AdminCouponView.as_view()),
    path("admin/coupons/<int:pk>/", views.AdminCouponView.as_view()),
    path("admin/courier/config/", views.AdminCourierConfigView.as_view()),
    path("admin/courier/book/", views.AdminCourierBookView.as_view()),
    path("admin/courier/track/<int:order_id>/", views.AdminCourierTrackView.as_view()),
    path("admin/products/", views.AdminProductListCreateView.as_view()),
    path("admin/products/<int:pk>/", views.AdminProductDetailView.as_view()),
    path("admin/products/images/<int:pk>/", views.AdminProductImageManageView.as_view()),

    # Image Gallery & Asset Library Endpoints
    path("admin/product-image-library/", views.ProductImageAssetListCreateView.as_view()),
    path("admin/product-image-library/reorder/", views.ProductImageAssetReorderView.as_view()),
    path("admin/product-image-library/embed/", views.ProductImageAssetBulkEmbedView.as_view()),
    path("admin/product-image-library/<int:pk>/", views.ProductImageAssetDetailView.as_view()),
    path("admin/product-image-library/<int:asset_id>/link/", views.ProductImageAssetLinkView.as_view()),
    path("admin/product-image-library/<int:asset_id>/links/<int:link_id>/", views.ProductImageAssetUnlinkView.as_view()),

    # Direct newsmartagent compatibility aliases
    path("datasheet/product-image-library/", views.ProductImageAssetListCreateView.as_view()),
    path("datasheet/product-image-library/reorder/", views.ProductImageAssetReorderView.as_view()),
    path("datasheet/product-image-library/embed/", views.ProductImageAssetBulkEmbedView.as_view()),
    path("datasheet/product-image-library/<int:pk>/", views.ProductImageAssetDetailView.as_view()),
    path("datasheet/product-image-library/<int:asset_id>/link/", views.ProductImageAssetLinkView.as_view()),
    path("datasheet/product-image-library/<int:asset_id>/links/<int:link_id>/", views.ProductImageAssetUnlinkView.as_view()),
    path("datasheet/products/", views.AdminProductListCreateView.as_view()),
]

