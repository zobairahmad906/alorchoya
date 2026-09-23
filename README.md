# Atelier Store starter

A Docker-based e-commerce starter: Next.js storefront, Django REST API, PostgreSQL, and MinIO for product media.

## Run it

1. Copy the environment template: `Copy-Item .env.example .env`
2. Start everything: `docker compose up --build`
3. Open the shop at http://localhost:3000, API at http://localhost:8000/api/products/, and MinIO Console at http://localhost:9001.

## First data and images

In another terminal, create an admin account: `docker compose exec backend python manage.py createsuperuser`. Then sign in at http://localhost:8000/admin/, add categories and products, and upload product images inline on each product. Images are stored in the `product-images` MinIO bucket; Docker creates it automatically and exposes public read URLs at `localhost:9000`.

For a basic seed, use Django shell:

`docker compose exec backend python manage.py shell -c "from shop.models import Category,Product; c,_=Category.objects.get_or_create(name='Home',slug='home'); Product.objects.get_or_create(name='Linen Throw',slug='linen-throw',category=c,defaults={'price':'69.00','stock':12,'description':'A soft, everyday layer.'})"`

## API

- `GET /api/categories/`
- `GET /api/products/` (optional `?category=slug`)
- `GET /api/products/<slug>/`
- `POST /api/orders/` with customer fields and `items: [{"product_id": 1, "quantity": 1}]`
- `GET /api/carts/<uuid>/` and `POST /api/carts/<uuid>/items/` for an optional server cart; the storefront deliberately uses local storage for instant guest-cart behavior.

Cart state stays in the browser's local storage. Orders are persisted in PostgreSQL and appear in Django admin.

## Cloudflare Tunnel

This project includes an Nginx reverse proxy and `cloudflared` service. In Cloudflare Zero Trust, point these published application hostnames to `http://nginx:80`:

- `alorchoya.newsmartagent.com` → storefront
- `api-alorchoya.newsmartagent.com` → Django API
- `minio-alorchoya.newsmartagent.com` → public product-image bucket

Copy the remotely-managed tunnel token into `CLOUDFLARE_TUNNEL_TOKEN` in `.env` (the value must not be blank), then run `docker compose up --build -d`. Keep that token private: it authorizes a connector to your tunnel. The Cloudflare hostname routes determine the destination; Nginx routes each hostname to the appropriate internal Docker service.
