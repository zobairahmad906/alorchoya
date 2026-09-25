import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Create a database backup without printing database credentials."

    def add_arguments(self, parser):
        parser.add_argument("--output", default="/backups", help="Backup directory")

    def handle(self, *args, **options):
        target = Path(options["output"]).resolve()
        target.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        if settings.USE_LOCAL:
            source = Path(settings.DATABASES["default"]["NAME"])
            if not source.exists():
                raise CommandError(f"SQLite database not found: {source}")
            destination = target / f"store-{stamp}.sqlite3"
            shutil.copy2(source, destination)
        else:
            destination = target / f"store-{stamp}.sql"
            db = settings.DATABASES["default"]
            env = os.environ.copy()
            env["PGPASSWORD"] = db["PASSWORD"]
            command = ["pg_dump", "--no-owner", "--no-privileges", "-h", db["HOST"], "-p", str(db["PORT"]), "-U", db["USER"], "-d", db["NAME"], "-f", str(destination)]
            try:
                subprocess.run(command, env=env, check=True, capture_output=True, text=True)
            except FileNotFoundError as exc:
                raise CommandError("pg_dump is not installed in the runtime image.") from exc
            except subprocess.CalledProcessError as exc:
                destination.unlink(missing_ok=True)
                raise CommandError("Database backup failed.") from exc
        self.stdout.write(self.style.SUCCESS(f"Backup created: {destination}"))
