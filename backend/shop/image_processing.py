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
CARD_SIZE = (800, 1000)  # 4:5 portrait
CREAM = (253, 251, 247)  # matches the site's card background (#fdfbf7)


def _make_variant(source_name: str, size: tuple[int, int], margin_ratio: float = 0.02) -> tuple[BytesIO, str]:
    with default_storage.open(source_name, "rb") as source:
        image = ImageOps.exif_transpose(Image.open(source)).convert("RGBA")

    width, height = size
    canvas = Image.new("RGBA", size, CREAM + (255,))

    margin = round(min(width, height) * margin_ratio)
    foreground = image.copy()
    # Scale up or down so the product fills the frame, preserving aspect ratio.
    scale = min((width - margin * 2) / foreground.width, (height - margin * 2) / foreground.height)
    foreground = foreground.resize(
        (max(1, round(foreground.width * scale)), max(1, round(foreground.height * scale))),
        Image.Resampling.LANCZOS,
    )
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

    output, extension = _make_variant(instance.image.name, CARD_SIZE)
    instance.card_image.save(f"{stem}-card.{extension}", ContentFile(output.read()), save=False)
    changed.append("card_image")

    ProductImage.objects.filter(pk=instance.pk).update(
        hero_desktop=instance.hero_desktop.name,
        hero_mobile=instance.hero_mobile.name,
        card_image=instance.card_image.name,
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
