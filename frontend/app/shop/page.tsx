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

export default async function ShopPage({ searchParams }: { searchParams: { category?: string } }) {
  const [products, t] = await Promise.all([
    getProducts(),
    getTranslations("shop")
  ]);

  return (
    <>
      <Header />
      <main className="listing-page">
        <div className="listing-shell">
          <div className="listing-heading">
            <span className="checkout-kicker">{t("kicker")}</span>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <ProductCatalog products={products} initialCategory={searchParams.category || "all"} />
        </div>
      </main>
    </>
  );
}
