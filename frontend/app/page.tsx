import { Header, ProductCard } from "./components";
import { HeroSlider } from "./HeroSlider";
import type { Product } from "./types";
import { getLocale, getTranslations } from "next-intl/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } });
  return response.ok ? response.json() : [];
}
const categories = ["বুকশেলফ", "ওয়াল শেলফ", "কর্নার শেলফ", "কাঠের ফার্নিচার", "হোম ডেকর", "কসমেটিক্স ডিসপ্লে", "আর্টিফিশিয়াল ফ্লাওয়ার", "আরও দেখুন"];
const fallbackProducts: Product[] = [
  { id: 1, name: "৩-তলায় ওয়াল বুকশেলফ", slug: "wall-bookshelf", description: "", price: "1050", stock: 10, category: { name: "বুকশেলফ", slug: "bookshelf" }, images: [] },
  { id: 2, name: "কর্নার ফ্লোটিং শেলফ", slug: "corner-shelf", description: "", price: "680", stock: 10, category: { name: "কর্নার শেলফ", slug: "corner" }, images: [] },
  { id: 3, name: "সলিড উড টিভি ক্যাবিনেট", slug: "wood-tv-cabinet", description: "", price: "7900", stock: 10, category: { name: "ফার্নিচার", slug: "furniture" }, images: [] }
];

export default async function Home() {
  const products = await getProducts();
  const allProds = products.length ? products : fallbackProducts;
  const featuredProducts = allProds.filter((p) => p.is_featured);
  const sliderProducts = (featuredProducts.length > 0 ? featuredProducts : allProds).slice(0, 5);

  const t = await getTranslations("home");
  const locale = await getLocale();
  const visibleCategories = locale === "en" ? ["Bookshelf", "Wall Shelf", "Corner Shelf", "Wooden Furniture", "Home Decor", "Cosmetics Display", "Artificial Flowers", "View more"] : categories;
  return <>
    <Header />
    <div className="announce">সীমিত সময়ের অফার — নির্বাচিত পণ্যে <strong>৩০% পর্যন্ত ছাড়</strong></div>
    <main>
      <HeroSlider
        products={sliderProducts}
        eyebrow={t("eyebrow")}
        defaultTitle={t("title")}
        defaultLede={t("lede")}
        shopButtonText={t("shop")}
      />
      <section id="categories"><div className="wrap"><div className="section-head"><h2>{t("categoryTitle")}</h2></div><div className="cat-grid">{visibleCategories.map((category, index) => <a className="cat-card" href="#shop" key={category}><div className="glyph">{index === visibleCategories.length - 1 ? "+" : ["শ", "ও", "ক", "ফ", "ঘ", "ক", "ফ"][index]}</div><div className="t">{category}</div></a>)}</div></div></section>
      <section><div className="wrap"><div className="offer-strip"><div><h3>{t("offerTitle")}</h3><p>{t("offerText")}</p></div><a className="btn btn-primary" href="#shop">{t("offerButton")}</a></div></div></section>
      <section id="shop" className="products-section"><div className="wrap"><div className="section-head"><h2>{t("popular")}</h2><p>{t("popularText")}</p></div><div className="prod-grid">{(products.length ? products : fallbackProducts).map(product => <ProductCard key={product.id} product={product} />)}</div></div></section>
      <section><div className="wrap"><div className="section-head"><h2>{t("why")}</h2></div><div className="why-grid"><div className="why-item"><h3>প্রিমিয়াম মান</h3><p>প্রতিটি পণ্য যত্নসহকারে নির্বাচিত ও পরীক্ষিত।</p></div><div className="why-item"><h3>নিরাপদ অর্ডার</h3><p>ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট সুবিধা।</p></div><div className="why-item"><h3>নির্ভরযোগ্য ডেলিভারি</h3><p>সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি।</p></div></div></div></section>
      <section className="reviews"><div className="wrap"><div className="section-head"><h2>{t("reviews")}</h2></div><div className="review-grid"><article><div className="stars">★★★★★</div><p>শেলফটির কোয়ালিটি অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি।</p><b>নুসরাত জাহান</b></article><article><div className="stars">★★★★★</div><p>দাম অনুযায়ী পণ্যের মান খুবই ভালো, আবার অর্ডার করব।</p><b>রাকিবুল হাসান</b></article><article><div className="stars">★★★★★</div><p>ঘরের চেহারাই বদলে গেছে, খুব সুন্দর ডিজাইন।</p><b>ফারহানা আক্তার</b></article></div></div></section>
      <section id="contact"><div className="wrap"><div className="cta-band"><div><h3>{t("question")}</h3><p>হোয়াটসঅ্যাপে সরাসরি আমাদের সাথে কথা বলুন</p></div><a className="btn btn-primary" href="https://wa.me/8801302111188" target="_blank">{t("whatsapp")}</a></div></div></section>
    </main>
    <footer><div className="wrap foot-grid"><div><div className="footer-brand">আলোর ছোঁয়া মার্ট</div><p>আপনার ঘর, আপনার রুচির প্রতিচ্ছবি—বাংলাদেশের প্রিমিয়াম হোম ডেকর ব্র্যান্ড।</p></div><div><h4>কাস্টমার সার্ভিস</h4><ul><li>শিপিং পলিসি</li><li>রিটার্ন পলিসি</li><li>রিফান্ড পলিসি</li></ul></div><div><h4>যোগাযোগ</h4><ul><li>01302 111188</li><li>WhatsApp: +8801302111188</li><li>Facebook · Instagram</li></ul></div></div><div className="wrap foot-bottom">© 2026 আলোর ছোঁয়া মার্ট <span>সকল স্বত্ব সংরক্ষিত</span></div></footer><a className="wa-float" href="https://wa.me/8801302111188" target="_blank" aria-label="WhatsApp">⌕</a>
  </>;
}
