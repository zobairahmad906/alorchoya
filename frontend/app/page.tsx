import { Header, ProductCatalog, CategoryFilterCards, ContactActions } from "./components";
import { HeroSlider } from "./HeroSlider";
import { ShopTheLook } from "./ShopTheLook";
import { Model1DashboardPortal } from "./models/Model1DashboardPortal";
import { Model2UltraWideMegastore } from "./models/Model2UltraWideMegastore";
import { Model3SplitCanvasStudio } from "./models/Model3SplitCanvasStudio";
import { Model4MicroDockCanvas } from "./models/Model4MicroDockCanvas";
import type { Product, Review, HeroSlide, Category, SiteSettings, HomepageLayout } from "./types";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

async function getCategories(): Promise<Category[]> {
  try {
    const response = await fetch(`${API}/categories/`, { next: { revalidate: 15 } });
    return response.ok ? response.json() : [];
  } catch {
    return [];
  }
}

async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const response = await fetch(`${API}/site-settings/`, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });
    if (response.ok) {
      return await response.json();
    }
    return { homepage_layout: "model1" };
  } catch {
    return { homepage_layout: "model1" };
  }
}

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await Promise.resolve(searchParams) : {};
  const queryParamModel = typeof resolvedParams?.model === "string"
    ? resolvedParams.model
    : typeof resolvedParams?.layout === "string"
    ? resolvedParams.layout
    : null;

  const [products, featuredReviews, heroSlides, backendCategories, siteSettings] = await Promise.all([
    getProducts(),
    getFeaturedReviews(),
    getHeroSlides(),
    getCategories(),
    getSiteSettings(),
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
  const tCommon = await getTranslations("common");
  const tFooter = await getTranslations("footer");

  // Merge backend categories with product categories
  const categoryMap = new Map<string, Category>();
  for (const cat of backendCategories) {
    categoryMap.set(cat.slug, {
      ...cat,
      count: 0,
    });
  }

  for (const product of allProds) {
    const cat = product.category;
    if (!cat || !cat.slug) continue;
    const existing = categoryMap.get(cat.slug);
    const primaryImage = product.images?.find(img => img.is_primary)?.card_image ||
                         product.images?.find(img => img.is_primary)?.image ||
                         product.images?.[0]?.card_image ||
                         product.images?.[0]?.image;
    if (existing) {
      existing.count = (existing.count || 0) + 1;
      if (!existing.image && !existing.image_url && primaryImage) {
        existing.image = primaryImage;
      }
    } else {
      categoryMap.set(cat.slug, {
        name: cat.name,
        slug: cat.slug,
        image: primaryImage,
        icon: "🛍️",
        count: 1,
      });
    }
  }
  const categories = Array.from(categoryMap.values()).sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

  const validLayouts: HomepageLayout[] = ["model1", "model2", "model3", "model4"];
  const activeLayout = (queryParamModel && validLayouts.includes(queryParamModel as HomepageLayout))
    ? (queryParamModel as HomepageLayout)
    : ((siteSettings?.homepage_layout && validLayouts.includes(siteSettings.homepage_layout)) ? siteSettings.homepage_layout : "model1");

  return <>
    <Header />
    {discountedProducts.length > 0 && <div className="announce">{t("announce", { count: discountedProducts.length, discount: maxDiscount })}</div>}
    <main style={{ width: "100%", overflowX: "hidden" }}>
      {/* 4 Full-Screen Edge-to-Edge Models Switcher */}
      {activeLayout === "model2" ? (
        <Model2UltraWideMegastore
          products={allProds}
          categories={categories}
          heroSlides={heroSlides}
          reviews={reviewsToDisplay}
          discountedProducts={discountedProducts}
        />
      ) : activeLayout === "model3" ? (
        <Model3SplitCanvasStudio
          products={allProds}
          categories={categories}
          heroSlides={heroSlides}
          reviews={reviewsToDisplay}
          discountedProducts={discountedProducts}
        />
      ) : activeLayout === "model4" ? (
        <Model4MicroDockCanvas
          products={allProds}
          categories={categories}
          heroSlides={heroSlides}
          reviews={reviewsToDisplay}
          discountedProducts={discountedProducts}
        />
      ) : (
        <Model1DashboardPortal
          products={allProds}
          categories={categories}
          heroSlides={heroSlides}
          reviews={reviewsToDisplay}
          discountedProducts={discountedProducts}
        />
      )}

      {/* Common Curated Look section */}
      <ShopTheLook products={allProds} />

      {/* Customer Reviews Section */}
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
                    <div style={{ fontSize: "0.75rem", color: "#10b981" }}>{tCommon("verifiedBuyer")}</div>
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
      <section id="contact"><div className="wrap"><div className="cta-band"><div><h3>{t("question")}</h3><p>{t("whatsappSub")}</p></div><a className="btn btn-primary" href="https://wa.me/8801302111188" target="_blank">{t("whatsapp")}</a></div></div></section>
    </main>
      <section><div className="wrap"><div className="section-head"><h2>{t("why")}</h2></div><div className="why-grid"><div className="why-item"><h3>{t("whyQualityTitle")}</h3><p>{t("whyQualityDesc")}</p></div><div className="why-item"><h3>{t("whySecureTitle")}</h3><p>{t("whySecureDesc")}</p></div><div className="why-item"><h3>{t("whyDeliveryTitle")}</h3><p>{t("whyDeliveryDesc")}</p></div></div></div></section>
    <footer>
      <div className="wrap foot-grid">
        <div>
          <div className="footer-brand">{tCommon("brandName")}</div>
          <p>{tFooter("brandDesc")}</p>
        </div>
        <div>
          <h4>{tFooter("customerService")}</h4>
          <ul>
            <li>{tFooter("shippingPolicy")}</li>
            <li>{tFooter("returnPolicy")}</li>
            <li>{tFooter("refundPolicy")}</li>
          </ul>
        </div>
        <div>
          <h4>{tFooter("contact")}</h4>
          <ul>
            <li>01302 111188</li>
            <li>WhatsApp: +8801302111188</li>
            <li>Facebook · Instagram</li>
          </ul>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <div>
          {tFooter("copyright")} <span>{tFooter("allRightsReserved")}</span>
        </div>
        <div style={{ display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
          <a href="/dashboard" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            ⚙️ ড্যাশবোর্ড (Dashboard)
          </a>
          <a href="/admin/" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            🔒 ব্যাকেন্ড (Django Admin)
          </a>
        </div>
      </div>
    </footer><ContactActions />
  </>;
}
