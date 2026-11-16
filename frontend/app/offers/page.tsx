import { Header, ProductCatalog } from "../components";
import type { Product } from "../types";
import { getTranslations } from "next-intl/server";

const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } });
    return response.ok ? response.json() : [];
  } catch {
    return [];
  }
}

export default async function OffersPage() {
  const [products, t] = await Promise.all([
    getProducts(),
    getTranslations("offers")
  ]);

  const discountedProducts = products.filter(product => Boolean(product.discount_price));

  return (
    <>
      <Header />
      <main className="listing-page">
        <div className="listing-shell">
          <div className="listing-heading offer-heading">
            <span className="checkout-kicker">{t("kicker")}</span>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          {discountedProducts.length ? (
            <ProductCatalog products={discountedProducts} />
          ) : (
            <section className="empty-cart-card">
              <div>🏷️</div>
              <h2>{t("emptyTitle")}</h2>
              <p>{t("emptyDesc")}</p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
