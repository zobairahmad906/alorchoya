import uuid
from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [("shop", "0001_initial")]
    operations = [
        migrations.CreateModel(name="Cart", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("token", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True))]),
        migrations.CreateModel(name="CartItem", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("quantity", models.PositiveIntegerField(default=1)), ("cart", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="shop.cart")), ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to="shop.product"))]),
        migrations.AddConstraint(model_name="cartitem", constraint=models.UniqueConstraint(fields=("cart", "product"), name="unique_cart_product")),
    ]
