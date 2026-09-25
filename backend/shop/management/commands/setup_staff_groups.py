from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand


ROLE_PERMISSIONS = {
    "Store Managers": {"product", "productimage", "category", "deliveryzone", "coupon", "review", "order", "orderitem"},
    "Order Managers": {"order", "orderitem", "deliveryzone", "review"},
    "Catalog Managers": {"product", "productimage", "category", "review"},
}


class Command(BaseCommand):
    help = "Create the standard staff groups and assign least-privilege model permissions."

    def handle(self, *args, **options):
        for name, models in ROLE_PERMISSIONS.items():
            group, _ = Group.objects.get_or_create(name=name)
            permission_codes = [f"{action}_{model}" for model in models for action in ("add", "change", "delete", "view")]
            permissions = Permission.objects.filter(content_type__app_label="shop", codename__in=permission_codes)
            group.permissions.set(permissions)
            self.stdout.write(f"{name}: {permissions.count()} permissions")
        self.stdout.write(self.style.SUCCESS("Staff groups are ready. Assign users from Django admin."))
