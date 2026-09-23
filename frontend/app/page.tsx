import { Header, ProductCard } from "./components";
import type { Product } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } });
  return response.ok ? response.json() : [];
}
const categories = ["বুকশেলফ", "ওয়াল শেলফ", "কর্নার শেলফ", "কাঠের ফার্নিচার", "হোম ডেকর", "কসমেটিক্স ডিসপ্লে", "আর্টিফিশিয়াল ফ্লাওয়ার", "আরও দেখুন"];

export default async function Home() {
  const products = await getProducts();
  return <>
    <Header />
    <div className="announce">সীমিত সময়ের অফার — নির্বাচিত পণ্যে <strong>৩০% পর্যন্ত ছাড়</strong></div>
    <main>
      <section className="hero"><div className="wrap hero-grid"><div className="hero-copy"><p className="eyebrow">হোম ডেকর ও ফার্নিচার</p><h1>আপনার ঘর, আপনার রুচির প্রতিচ্ছবি</h1><p className="lede">প্রতিটি কোণায় আভিজাত্য এবং আরামের ছোঁয়া নিয়ে আসুন—আপনার ঘর সাজানোর জন্য বেছে নেওয়া সুন্দর সব পণ্য।</p><div className="cta-row"><a className="btn btn-primary" href="#shop">শপ করুন →</a><a className="btn btn-ghost" href="#categories">ক্যাটাগরি দেখুন</a></div></div><div className="hero-art"><div className="hero-shelf"><i/><i/><i/><i/><i/><i/></div></div></div></section>
      <section id="categories"><div className="wrap"><div className="section-head"><h2>ক্যাটাগরি অনুযায়ী দেখুন</h2></div><div className="cat-grid">{categories.map((category, index) => <a className="cat-card" href="#shop" key={category}><div className="glyph">{index === categories.length - 1 ? "+" : ["শ", "ও", "ক", "ফ", "ঘ", "ক", "ফ"][index]}</div><div className="t">{category}</div></a>)}</div></div></section>
      <section><div className="wrap"><div className="offer-strip"><div><h3>স্পেশাল অফার</h3><p>নির্বাচিত পণ্যে সীমিত সময়ের জন্য ৩০% পর্যন্ত ছাড়</p></div><a className="btn btn-primary" href="#shop">অফার দেখুন →</a></div></div></section>
      <section id="shop" className="products-section"><div className="wrap"><div className="section-head"><h2>জনপ্রিয় পণ্য</h2><p>আমাদের সবচেয়ে পছন্দের কিছু পণ্য দেখুন</p></div>{products.length ? <div className="prod-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty">অ্যাডমিন প্যানেল থেকে পণ্য যোগ করলে এখানে দেখা যাবে।</div>}</div></section>
      <section><div className="wrap"><div className="section-head"><h2>কেন আলোর ছোঁয়া মার্ট?</h2></div><div className="why-grid"><div className="why-item"><h3>প্রিমিয়াম মান</h3><p>প্রতিটি পণ্য যত্নসহকারে নির্বাচিত ও পরীক্ষিত।</p></div><div className="why-item"><h3>নিরাপদ অর্ডার</h3><p>ক্যাশ অন ডেলিভারি ও নিরাপদ পেমেন্ট সুবিধা।</p></div><div className="why-item"><h3>নির্ভরযোগ্য ডেলিভারি</h3><p>সারা বাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি।</p></div></div></div></section>
      <section className="reviews"><div className="wrap"><div className="section-head"><h2>গ্রাহকদের মতামত</h2></div><div className="review-grid"><article><div className="stars">★★★★★</div><p>শেলফটির কোয়ালিটি অসাধারণ, ডেলিভারিও দ্রুত পেয়েছি।</p><b>নুসরাত জাহান</b></article><article><div className="stars">★★★★★</div><p>দাম অনুযায়ী পণ্যের মান খুবই ভালো, আবার অর্ডার করব।</p><b>রাকিবুল হাসান</b></article><article><div className="stars">★★★★★</div><p>ঘরের চেহারাই বদলে গেছে, খুব সুন্দর ডিজাইন।</p><b>ফারহানা আক্তার</b></article></div></div></section>
      <section><div className="wrap"><div className="cta-band"><div><h3>কোনো প্রশ্ন আছে?</h3><p>হোয়াটসঅ্যাপে সরাসরি আমাদের সাথে কথা বলুন</p></div><a className="btn btn-primary" href="https://wa.me/8801302111188" target="_blank">হোয়াটসঅ্যাপে কথা বলুন</a></div></div></section>
    </main>
    <footer><div className="wrap foot-grid"><div><div className="footer-brand">আলোর ছোঁয়া মার্ট</div><p>আপনার ঘর, আপনার রুচির প্রতিচ্ছবি—বাংলাদেশের প্রিমিয়াম হোম ডেকর ব্র্যান্ড।</p></div><div><h4>কাস্টমার সার্ভিস</h4><ul><li>শিপিং পলিসি</li><li>রিটার্ন পলিসি</li><li>রিফান্ড পলিসি</li></ul></div><div><h4>যোগাযোগ</h4><ul><li>01302 111188</li><li>WhatsApp: +8801302111188</li><li>Facebook · Instagram</li></ul></div></div><div className="wrap foot-bottom">© 2026 আলোর ছোঁয়া মার্ট <span>সকল স্বত্ব সংরক্ষিত</span></div></footer><a className="wa-float" href="https://wa.me/8801302111188" target="_blank" aria-label="WhatsApp">⌕</a>
  </>;
}
