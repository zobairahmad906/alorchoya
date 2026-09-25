from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("shop", "0003_product_discount_price_product_is_featured")]

    operations = [
        migrations.CreateModel(
            name="DeliveryZone",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
                ("charge", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("is_active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Coupon",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=40, unique=True)),
                ("discount_type", models.CharField(choices=[("percent", "Percentage"), ("fixed", "Fixed amount")], default="percent", max_length=8)),
                ("value", models.DecimalField(decimal_places=2, max_digits=10)),
                ("min_order", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("max_uses", models.PositiveIntegerField(blank=True, null=True)),
                ("used_count", models.PositiveIntegerField(default=0)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name="Review",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("customer_name", models.CharField(max_length=120)),
                ("email", models.EmailField(blank=True, max_length=254)),
                ("rating", models.PositiveSmallIntegerField()),
                ("comment", models.TextField()),
                ("is_approved", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="shop.product")),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddField(model_name="order", name="coupon_code", field=models.CharField(blank=True, max_length=40)),
        migrations.AddField(model_name="order", name="delivery_charge", field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name="order", name="discount_amount", field=models.DecimalField(decimal_places=2, default=0, max_digits=10)),
        migrations.AddField(model_name="order", name="payment_method", field=models.CharField(choices=[("cod", "Cash on delivery"), ("online", "Online payment")], default="cod", max_length=12)),
        migrations.AddField(model_name="order", name="delivery_zone", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="orders", to="shop.deliveryzone")),
    ]
