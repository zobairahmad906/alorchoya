import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-development-key")
DEBUG = os.getenv("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.admin", "django.contrib.auth", "django.contrib.contenttypes",
    "django.contrib.sessions", "django.contrib.messages", "django.contrib.staticfiles",
    "corsheaders", "rest_framework", "storages", "shop.apps.ShopConfig",
]
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware", "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware", "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware", "django.contrib.auth.middleware.AuthenticationMiddleware",
    "shop.middleware.BearerSessionMiddleware",
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
    _minio_public = os.getenv("MINIO_PUBLIC_ENDPOINT", "minio-alorchoya.newsmartagent.com").strip()
    if _minio_public:
        _proto = "http:" if _minio_public in ("localhost:9000", "127.0.0.1:9000") else "https:"
        AWS_S3_URL_PROTOCOL = _proto
        AWS_S3_CUSTOM_DOMAIN = f"{_minio_public}/{AWS_STORAGE_BUCKET_NAME}"
        MEDIA_URL = f"{_proto}//{_minio_public}/{AWS_STORAGE_BUCKET_NAME}/"
    else:
        MEDIA_URL = f"http://localhost:9000/{AWS_STORAGE_BUCKET_NAME}/"
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
    LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
SESSION_COOKIE_SAMESITE = "Lax"
if os.getenv("COOKIE_DOMAIN"):
    SESSION_COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN")
PUBLIC_APP_URL = os.getenv("PUBLIC_APP_URL", "http://localhost:3000")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1",
    "https://alorchoya.newsmartagent.com",
    "http://alorchoya.newsmartagent.com",
    "https://api-alorchoya.newsmartagent.com",
    "http://api-alorchoya.newsmartagent.com",
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "shop.middleware.BearerSessionAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle", "rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "120/minute", "orders": "10/minute", "reviews": "10/hour"},
}

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_REFERRER_POLICY = "same-origin"

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"django.request": {"handlers": ["console"], "level": "WARNING", "propagate": False}, "shop": {"handlers": ["console"], "level": "INFO", "propagate": False}},
}
