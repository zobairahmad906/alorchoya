import { Header, ProductCatalog, CategoryFilterCards, ContactActions } from "./components";
import { HeroSlider } from "./HeroSlider";
import type { Product, Review, HeroSlide } from "./types";
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

async function getHeroSlides(): Promise<HeroSlide[]> {
  try {
    const response = await fetch(`${API}/hero-slides/`, { next: { revalidate: 15 } });
    return response.ok ? response.json() : [];
  } catch {
    return [];
  }
}

async function getFeaturedReviews(): Promise<Review[]> {
  try {
    const response = await fetch(`${API}/reviews/featured/`, { next: { revalidate: 30 } });
    return response.ok ? response.json() : [];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [products, featuredReviews, heroSlides] = await Promise.all([
    getProducts(),
    getFeaturedReviews(),
    getHeroSlides(),
  ]);
  const allProds = products;
  const discountedProducts = allProds.filter((p) => Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price));
  const maxDiscount = discountedProducts.length ? Math.max(...discountedProducts.map((p) => Math.round(((Number(p.price) - Number(p.discount_price)) / Number(p.price)) * 100))) : 0;
  const featuredProducts = allProds.filter((p) => p.is_featured);
  const sliderProducts = (featuredProducts.length > 0 ? featuredProducts : allProds).slice(0, 5);

  const fallbackReviews: Review[] = [
    { id: -1, customer_name: "নুসরাত জাহান", rating: 5, comment: "শেলফটির কোয়ালিটি অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি।", created_at: "" },
    { id: -2, customer_name: "রাকিবুল হাসান", rating: 5, comment: "দাম অনুযায়ী পণ্যের মান খুবই ভালো, আবার অর্ডার করব।", created_at: "" },
    { id: -3, customer_name: "ফারহানা আক্তার", rating: 5, comment: "ঘরের চেহারাই বদলে গেছে, খুব সুন্দর ডিজাইন।", created_at: "" },
  ];

  const reviewsToDisplay = featuredReviews.length > 0 ? featuredReviews : fallbackReviews;

  const t = await getTranslations("home");
  const categoryMap = new Map<string, { name: string; slug: string; image?: string; count: number }>();
  for (const product of allProds) {
    const cat = product.category;
    if (!cat || !cat.slug) continue;
    const existing = categoryMap.get(cat.slug);
    const primaryImage = product.images?.find(img => img.is_primary)?.card_image ||
                         product.images?.find(img => img.is_primary)?.image ||
                         product.images?.[0]?.card_image ||
                         product.images?.[0]?.image;
    if (existing) {
      existing.count += 1;
      if (!existing.image && primaryImage) {
        existing.image = primaryImage;
      }
    } else {
      categoryMap.set(cat.slug, {
        name: cat.name,
        slug: cat.slug,
        image: primaryImage,
        count: 1
      });
    }
  }
  const categories = Array.from(categoryMap.values());
  return <>
    <Header />
    {discountedProducts.length > 0 && <div className="announce">{t("announce", { count: discountedProducts.length, discount: maxDiscount })}</div>}
    <main>
      <HeroSlider
        products={sliderProducts}
        heroSlides={heroSlides}
        eyebrow={t("eyebrow")}
        defaultTitle={t("title")}
        defaultLede={t("lede")}
        shopButtonText={t("shop")}
      />
      <section id="categories"><div className="wrap"><div className="section-head"><h2>{t("categoryTitle")}</h2></div><CategoryFilterCards categories={categories} /></div></section>
      {discountedProducts.length > 0 && <section><div className="wrap"><div className="offer-strip"><div><h3>{t("offerTitle")}</h3><p>{t("offerText", { count: discountedProducts.length, discount: maxDiscount })}</p></div><a className="btn btn-primary" href="/offers">{t("offerButton")}</a></div></div></section>}
      <section id="shop" className="products-section"><div className="wrap"><div className="section-head"><h2>{t("popular")}</h2><p>{t("popularText")}</p></div><ProductCatalog products={allProds} /></div></section>

      <section className="reviews">
        <div className="wrap">
          <div className="section-head">
            <h2>{t("reviews")}</h2>
          </div>
          <div className="review-grid">
            {reviewsToDisplay.map((rev) => (
              <article key={rev.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {rev.avatar_url ? (
                    <img
                      src={rev.avatar_url}
                      alt={rev.customer_name}
                      style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "1.1rem"
                      }}
                    >
                      {rev.customer_name ? rev.customer_name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{rev.customer_name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#10b981" }}>✓ ভেরিফাইড ক্রেতা</div>
                  </div>
                </div>
                <div className="stars" style={{ color: "#f59e0b", letterSpacing: "2px" }}>
                  {"★".repeat(rev.rating)}
                </div>
                <p style={{ flex: 1, margin: 0, fontSize: "0.9rem", color: "#374151", lineHeight: 1.5 }}>"{rev.comment}"</p>
                {rev.product_name && rev.product_slug && (
                  <a
                    href={`/products/${rev.product_slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontSize: "0.78rem",
                      color: "#4b5563",
                      backgroundColor: "#f3f4f6",
                      padding: "0.3rem 0.6rem",
                      borderRadius: "6px",
                      textDecoration: "none",
                      marginTop: "0.5rem",
                      border: "1px solid #e5e7eb",
                      fontWeight: 500,
                      width: "fit-content",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ color: "#2563eb" }}>🛍️</span>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "220px" }}>
                      {rev.product_name}
                    </span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
      <section id="contact"><div className="wrap"><div className="cta-band"><div><h3>{t("question")}</h3><p>হোয়াটসঅ্যাপে সরাসরি আমাদের সাথে কথা বলুন</p></div><a className="btn btn-primary" href="https://wa.me/8801302111188" target="_blank">{t("whatsapp")}</a></div></div></section>
    </main>
      <section><div className="wrap"><div className="section-head"><h2>{t("why")}</h2></div><div className="why-grid"><div className="why-item"><h3>প্রিমিয়াম মান</h3><p>প্রতিটি পণ্য যত্নসহকারে নির্বাচিত ও পরীক্ষিত।</p></div><div className="why-item"><h3>নিরাপদ অর্ডার</h3><p>ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট সুবিধা।</p></div><div className="why-item"><h3>নির্ভরযোগ্য ডেলিভারি</h3><p>সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি।</p></div></div></div></section>
    <footer><div className="wrap foot-grid"><div><div className="footer-brand">আলোর ছোঁয়া মার্ট</div><p>আপনার ঘর, আপনার রুচির প্রতিচ্ছবি—বাংলাদেশের প্রিমিয়াম হোম ডেকর ব্র্যান্ড।</p></div><div><h4>কাস্টমার সার্ভিস</h4><ul><li>শিপিং পলিসি</li><li>রিটার্ন পলিসি</li><li>রিফান্ড পলিসি</li></ul></div><div><h4>যোগাযোগ</h4><ul><li>01302 111188</li><li>WhatsApp: +8801302111188</li><li>Facebook · Instagram</li></ul></div></div><div className="wrap foot-bottom">© 2026 আলোর ছোঁয়া মার্ট <span>সকল স্বত্ব সংরক্ষিত</span></div></footer><ContactActions />
  </>;
}
