from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(name="Category", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=100, unique=True)), ("slug", models.SlugField(unique=True))]),
        migrations.CreateModel(name="Order", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("customer_name", models.CharField(max_length=120)), ("email", models.EmailField(max_length=254)), ("phone", models.CharField(max_length=30)), ("address", models.TextField()), ("status", models.CharField(choices=[("pending", "Pending"), ("paid", "Paid"), ("shipped", "Shipped"), ("cancelled", "Cancelled")], default="pending", max_length=16)), ("created_at", models.DateTimeField(auto_now_add=True))]),
        migrations.CreateModel(name="Product", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=180)), ("slug", models.SlugField(unique=True)), ("description", models.TextField(blank=True)), ("price", models.DecimalField(decimal_places=2, max_digits=10)), ("stock", models.PositiveIntegerField(default=0)), ("is_active", models.BooleanField(default=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("category", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="shop.category"))]),
        migrations.CreateModel(name="ProductImage", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("image", models.ImageField(upload_to="products/%Y/%m/")), ("alt_text", models.CharField(blank=True, max_length=180)), ("is_primary", models.BooleanField(default=False)), ("product", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="shop.product"))]),
        migrations.CreateModel(name="OrderItem", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("quantity", models.PositiveIntegerField()), ("unit_price", models.DecimalField(decimal_places=2, max_digits=10)), ("order", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="items", to="shop.order")), ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="shop.product"))]),
    ]
