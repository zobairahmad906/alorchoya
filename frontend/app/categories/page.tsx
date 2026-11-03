import Link from "next/link";
import { Header } from "../components";
import type { Product } from "../types";

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
  const products = await getProducts();
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
  const toBn = (number: number) => number.toString().replace(/\d/g, digit => "০১২৩৪৫৬৭৮৯"[Number(digit)]);

  return <>
    <Header />
    <main className="listing-page categories-listing-page">
      <div className="listing-shell">
        <div className="listing-heading">
          <span className="checkout-kicker">আলোর ছোঁয়া মার্ট</span>
          <h1>ক্যাটাগরি</h1>
          <p>আপনার পছন্দের পণ্য খুঁজে নিন ক্যাটাগরি অনুযায়ী।</p>
        </div>
        {categories.length ? <div className="cat-grid cat-circle-grid">
          {categories.map(category => <Link
            className="cat-card cat-circle-card"
            key={category.slug}
            href={`/shop?category=${category.slug}`}
          >
            <div className="cat-avatar-wrap">
              <div className="cat-avatar-ring">
                <div className="cat-avatar-inner">
                  {category.image ? <img src={category.image} alt={category.name} loading="lazy" /> :
                    <div className="cat-glyph-letter">{category.name.slice(0, 1)}</div>}
                </div>
              </div>
            </div>
            <span className="cat-title">{category.name}</span>
            <span className="cat-count">{toBn(category.count)}টি পণ্য</span>
          </Link>)}
        </div> : <p>এখনও কোনো ক্যাটাগরি পাওয়া যায়নি।</p>}
      </div>
    </main>
  </>;
}
