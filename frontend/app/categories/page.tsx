import Link from "next/link";
import { Header, formatNumber } from "../components";
import type { Product } from "../types";
import { getLocale, getTranslations } from "next-intl/server";

const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } });
    return response.ok ? response.json() : [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const [products, locale, t] = await Promise.all([
    getProducts(),
    getLocale(),
    getTranslations("categories")
  ]);

  const categoryMap = new Map<string, { name: string; slug: string; image?: string; count: number }>();

  for (const product of products) {
    const category = product.category;
    if (!category?.slug) continue;
    const primaryImage = product.images?.find(image => image.is_primary)?.card_image ||
      product.images?.find(image => image.is_primary)?.image ||
      product.images?.[0]?.card_image ||
      product.images?.[0]?.image;
    const existing = categoryMap.get(category.slug);
    if (existing) {
      existing.count += 1;
      if (!existing.image && primaryImage) existing.image = primaryImage;
    } else {
      categoryMap.set(category.slug, { name: category.name, slug: category.slug, image: primaryImage, count: 1 });
    }
  }

  const categories = Array.from(categoryMap.values());

  return (
    <>
      <Header />
      <main className="listing-page categories-listing-page">
        <div className="listing-shell">
          <div className="listing-heading">
            <span className="checkout-kicker">{t("kicker")}</span>
            <h1>{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          {categories.length ? (
            <div className="cat-grid cat-circle-grid">
              {categories.map(category => (
                <Link
                  className="cat-card cat-circle-card"
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                >
                  <div className="cat-avatar-wrap">
                    <div className="cat-avatar-ring">
                      <div className="cat-avatar-inner">
                        {category.image ? (
                          <img src={category.image} alt={category.name} loading="lazy" />
                        ) : (
                          <div className="cat-glyph-letter">{category.name.slice(0, 1)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="cat-title">{category.name}</span>
                  <span className="cat-count">
                    {t("productCount", { count: locale === "en" ? category.count : formatNumber(category.count, "bn") })}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p>{t("emptyDesc") || "No categories found."}</p>
          )}
        </div>
      </main>
    </>
  );
}
