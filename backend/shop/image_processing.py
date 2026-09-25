from __future__ import annotations

from io import BytesIO
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models.signals import post_save
from django.dispatch import receiver
from PIL import Image, ImageFilter, ImageOps

from .models import ProductImage

HERO_SIZES = {"desktop": (1600, 900), "mobile": (900, 1100)}


def _make_variant(source_name: str, size: tuple[int, int]) -> tuple[BytesIO, str]:
    with default_storage.open(source_name, "rb") as source:
        image = ImageOps.exif_transpose(Image.open(source)).convert("RGBA")

    width, height = size
    background = ImageOps.fit(image.convert("RGB"), size, method=Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(24))
    canvas = background.convert("RGBA")

    margin = max(24, round(min(width, height) * 0.04))
    foreground = image.copy()
    foreground.thumbnail((width - margin * 2, height - margin * 2), Image.Resampling.LANCZOS)
    left = (width - foreground.width) // 2
    top = (height - foreground.height) // 2
    canvas.alpha_composite(foreground, (left, top))

    output = BytesIO()
    canvas.convert("RGB").save(output, format="WEBP", quality=88, method=6)
    output.seek(0)
    return output, "webp"


def generate_hero_variants(instance: ProductImage) -> bool:
    if not instance.image or not instance.image.name:
        return False

    stem = Path(instance.image.name).stem
    changed = []
    for variant, size in HERO_SIZES.items():
        output, extension = _make_variant(instance.image.name, size)
        field = getattr(instance, f"hero_{variant}")
        field.save(f"{stem}-{variant}.{extension}", ContentFile(output.read()), save=False)
        changed.append(f"hero_{variant}")

    ProductImage.objects.filter(pk=instance.pk).update(
        hero_desktop=instance.hero_desktop.name,
        hero_mobile=instance.hero_mobile.name,
    )
    return bool(changed)


@receiver(post_save, sender=ProductImage)
def create_hero_variants(sender, instance, **kwargs):
    try:
        generate_hero_variants(instance)
    except Exception:
        # Never make a successful product-image upload fail because a derived
        # hero asset could not be generated. The backfill command can retry it.
        return
