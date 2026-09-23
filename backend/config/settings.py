import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-development-key")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,backend").split(",")

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "corsheaders", "rest_framework", "storages", "shop",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware", "django.middleware.clickjacking.XFrameOptionsMiddleware",
]
ROOT_URLCONF = "config.urls"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [], "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request", "django.contrib.auth.context_processors.auth", "django.contrib.messages.context_processors.messages"]}}]
WSGI_APPLICATION = "config.wsgi.application"
USE_LOCAL = os.getenv("USE_LOCAL", "0") == "1"

if USE_LOCAL:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
else:
    DATABASES = {"default": {"ENGINE": "django.db.backends.postgresql", "NAME": os.getenv("POSTGRES_DB", "store"), "USER": os.getenv("POSTGRES_USER", "store"), "PASSWORD": os.getenv("POSTGRES_PASSWORD", "store-password"), "HOST": os.getenv("POSTGRES_HOST", "db"), "PORT": os.getenv("POSTGRES_PORT", "5432")}}
    AWS_ACCESS_KEY_ID = os.getenv("MINIO_ROOT_USER", "minioadmin")
    AWS_SECRET_ACCESS_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin123")
    AWS_STORAGE_BUCKET_NAME = os.getenv("MINIO_BUCKET", "product-images")
    AWS_S3_ENDPOINT_URL = f"http://{os.getenv('MINIO_ENDPOINT', 'minio:9000')}"
    AWS_S3_REGION_NAME = "us-east-1"
    AWS_S3_ADDRESSING_STYLE = "path"
    AWS_QUERYSTRING_AUTH = False
    AWS_S3_FILE_OVERWRITE = False
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
    MEDIA_URL = f"http://{os.getenv('MINIO_PUBLIC_ENDPOINT', 'localhost:9000')}/{AWS_STORAGE_BUCKET_NAME}/"
    LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CORS_ALLOWED_ORIGINS = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "https://alorchoya.newsmartagent.com,https://api-alorchoya.newsmartagent.com").split(",")
REST_FRAMEWORK = {"DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"]}
