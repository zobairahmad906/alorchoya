from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("shop", "0006_order_customer_alter_order_status_customerprofile_and_more")]

    operations = [
        migrations.AddField(
            model_name="productimage",
            name="hero_desktop",
            field=models.ImageField(blank=True, upload_to="products/hero/%Y/%m/"),
        ),
        migrations.AddField(
            model_name="productimage",
            name="hero_mobile",
            field=models.ImageField(blank=True, upload_to="products/hero/%Y/%m/"),
        ),
    ]
