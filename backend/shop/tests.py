from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Category, DeliveryZone, Product, Review


class StoreApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        category = Category.objects.create(name="Furniture", slug="furniture")
        self.product = Product.objects.create(category=category, name="Shelf", slug="shelf", price=Decimal("1000"), discount_price=Decimal("800"), stock=5, is_active=True)
        self.zone = DeliveryZone.objects.create(name="Dhaka", charge=Decimal("80"))

    def test_health_reports_database(self):
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["database"], "ok")

    def test_order_uses_discount_and_delivery_charge(self):
        response = self.client.post("/api/orders/", {"customer_name": "Test", "email": "test@example.com", "phone": "01700000000", "address": "Dhaka", "delivery_zone_id": self.zone.id, "payment_method": "cod", "items": [{"product_id": self.product.id, "quantity": 2}]}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()["total"], "1680.00")
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_unapproved_reviews_are_not_public(self):
        Review.objects.create(product=self.product, customer_name="Pending", rating=1, comment="hidden")
        Review.objects.create(product=self.product, customer_name="Approved", rating=5, comment="visible", is_approved=True)
        response = self.client.get("/api/products/shelf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["customer_name"] for item in response.json()["reviews"]], ["Approved"])
