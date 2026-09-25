from django.core.management.base import BaseCommand

from shop.image_processing import generate_hero_variants
from shop.models import ProductImage


class Command(BaseCommand):
    help = "Generate responsive desktop and mobile hero images for all product images."

    def handle(self, *args, **options):
        total = success = failed = 0
        for image in ProductImage.objects.iterator():
            total += 1
            try:
                if generate_hero_variants(image):
                    success += 1
                    self.stdout.write(self.style.SUCCESS(f"Generated: {image.product.name} / {image.image.name}"))
            except Exception as error:
                failed += 1
                self.stderr.write(self.style.ERROR(f"Failed #{image.pk}: {error}"))
        self.stdout.write(f"Processed {total}; generated {success}; failed {failed}.")
