"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCart } from "./cart";
import type { Product } from "./types";
import { useTranslations } from "next-intl";

function formatPrice(value: string | number) {
  return `৳${Number(value).toLocaleString("bn-BD")}`;
}

function CartIcon() {
  return <svg className="cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 8.5h12l1 11H5l1-11Z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/><path d="M8.5 12h.01M15.5 12h.01"/></svg>;
}

function ShopIcon() {
  return (
    <svg className="shop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1-5h16l1 5" />
      <path d="M3 9a2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2 2 2 0 0 0 2 2 2 2 0 0 0 2-2" />
      <path d="M4 11v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function ToolsIcon() {
  return (
    <svg className="tools-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
function WhatsAppIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5a9.4 9.4 0 0 0-8.1 14.2L2.5 21.5l5-1.3A9.4 9.4 0 1 0 12 2.5Zm0 16.9a7.4 7.4 0 0 1-3.8-1l-.3-.2-3 .8.8-2.9-.2-.3a7.4 7.4 0 1 1 6.5 3.6Zm4-5.5c-.2-.1-1.2-.6-1.4-.7-.2-.1-.3-.1-.5.1l-.7.9c-.1.1-.2.2-.4.1a6 6 0 0 1-1.7-1.1 6.7 6.7 0 0 1-1.2-1.5c-.1-.2 0-.3.1-.4l.3-.4.2-.4c.1-.1 0-.3 0-.4l-.6-1.4c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.7-.8 1.8s.8 2.1.9 2.2c.1.1 1.5 2.4 3.7 3.3.5.2.9.4 1.2.5.5.2 1 .2 1.4.1.4-.1 1.2-.5 1.4-1 .2-.5.2-.9.1-1-.1-.1-.3-.2-.5-.3Z"/></svg>; }
function MessengerIcon() { return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5C6.5 2.5 2 6.6 2 11.7c0 2.9 1.5 5.5 3.8 7.2v3l3.5-1.9c.9.3 1.8.4 2.7.4 5.5 0 10-3.9 10-8.7S17.5 2.5 12 2.5Zm1 11.7-2.6-2.8-5 2.8 5.5-5.9 2.6 2.8 5-2.8-5.5 5.9Z"/></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2h9A3.5 3.5 0 0 1 20 5.5v6a3.5 3.5 0 0 1-3.5 3.5H11l-4.5 4v-4.2A3.5 3.5 0 0 1 4 11.5v-6Z"/><path d="M8 8.5h8M8 11h5"/></svg>; }
const MESSENGER_URL = process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/";
const messageTeasers = ["পণ্য সম্পর্কে জানতে মেসেজ করুন", "Ask about a product...", "আপনার প্রশ্ন লিখুন", "Send us a message"];
export function ContactActions() {
  const [open, setOpen] = useState(false);
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [typedTeaser, setTypedTeaser] = useState("");
  const [showTeaser, setShowTeaser] = useState(true);
  useEffect(() => { const timer = window.setInterval(() => setTeaserIndex(index => (index + 1) % messageTeasers.length), 10000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    setShowTeaser(false);
    setTypedTeaser("");
    let cursor = 0;
    const message = messageTeasers[teaserIndex];
    const reveal = window.setTimeout(() => setShowTeaser(true), 250);
    const timer = window.setInterval(() => { cursor += 1; setTypedTeaser(message.slice(0, cursor)); if (cursor >= message.length) window.clearInterval(timer); }, 65);
    const hide = window.setTimeout(() => setShowTeaser(false), 6500);
    return () => { window.clearTimeout(reveal); window.clearInterval(timer); window.clearTimeout(hide); };
  }, [teaserIndex]);
  const [position, setPosition] = useState({ right: 18, bottom: 88 });
  const drag = useRef<{ id: number; x: number; y: number; right: number; bottom: number; moved: boolean } | null>(null);
  useEffect(() => { try { const saved = JSON.parse(localStorage.getItem("message-launcher-position") || "null"); if (saved && Number.isFinite(saved.right) && Number.isFinite(saved.bottom)) setPosition({ right: saved.right, bottom: saved.bottom }); } catch { /* use default position */ } }, []);
  const move = (event: React.PointerEvent<HTMLButtonElement>) => { if (!drag.current || event.pointerId !== drag.current.id) return; const dx = event.clientX - drag.current.x; const dy = event.clientY - drag.current.y; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) drag.current.moved = true; setPosition({ right: Math.max(8, Math.min(window.innerWidth - 58, drag.current.right - dx)), bottom: Math.max(80, Math.min(window.innerHeight - 58, drag.current.bottom - dy)) }); };
  const stop = (event: React.PointerEvent<HTMLButtonElement>) => { if (!drag.current || event.pointerId !== drag.current.id) return; localStorage.setItem("message-launcher-position", JSON.stringify(position)); drag.current = null; };
  return <div className="message-launcher" style={{ right: position.right, bottom: position.bottom }}>
    {!open && showTeaser && <span className="message-teaser" key={teaserIndex}>{typedTeaser}<i className="message-caret" aria-hidden="true">|</i></span>}
    {open && <div className="message-options"><a className="message-option whatsapp-option" href="https://wa.me/8801302111188" target="_blank" rel="noreferrer" aria-label="WhatsApp"><WhatsAppIcon /><span>WhatsApp</span></a><a className="message-option messenger-option" href={MESSENGER_URL} target="_blank" rel="noreferrer" aria-label="Messenger"><MessengerIcon /><span>Messenger</span></a></div>}
    <button className="message-launcher-button" onPointerDown={event => { drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, right: position.right, bottom: position.bottom, moved: false }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={move} onPointerUp={stop} onClick={() => { if (!drag.current?.moved) setOpen(value => !value); }} aria-label="মেসেজ অপশন"><MessageIcon /><b className="message-unread">1</b></button>
  </div>;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export function Header() {
  const { count } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [account, setAccount] = useState<{ authenticated: boolean; name?: string; profile?: { avatar_url?: string } } | null>(null);
  const t = useTranslations("nav");

  useEffect(() => {
    fetch(API + "/auth/me/", { credentials: "include" }).then(response => response.json()).then(setAccount).catch(() => setAccount({ authenticated: false }));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoadingSearch(true);
    const timer = setTimeout(() => {
      fetch(`${API}/products/?search=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data: Product[]) => {
          if (Array.isArray(data)) setSearchResults(data.slice(0, 5));
        })
        .catch(() => setSearchResults([]))
        .finally(() => setLoadingSearch(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const switchLanguage = () => {
    document.cookie = "NEXT_LOCALE=" + (document.documentElement.lang === "bn" ? "en" : "bn") + "; path=/; max-age=31536000";
    window.location.reload();
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    window.dispatchEvent(new CustomEvent("product-search", { detail: query }));
    setSearchResults([]);
    setSearchOpen(false);
    window.location.href = "/#shop";
  };

  return (
    <>
      <header>
        <div className="wrap nav">
          <Link href="/" className="brand">
            <img className="brand-logo" src="/alorchoya-logo.jpeg" alt="আলোর ছোঁয়া মার্ট" />
            <span className="brand-name">
              আলোর ছোঁয়া মার্ট<small>Alor Chhoya Mart</small>
            </span>
          </Link>
          <nav className="links">
            <Link href="/">{t("home")}</Link>
            <Link href="/shop">{t("shop")}</Link>
            <Link href="/categories">{t("categories")}</Link>
            <Link href="/offers">{t("offers")}</Link>
            <Link href="/track-order">{t("tracking")}</Link>
          </nav>
          <div className="nav-right" style={{ position: "relative" }}>
            {searchOpen ? (
              <div style={{ position: "relative" }}>
                <form className="nav-search" onSubmit={submitSearch}>
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="পণ্য খুঁজুন (যেমন: মধু, ঘি, তেল)..."
                    aria-label="পণ্য খুঁজুন"
                  />
                  <button type="button" onClick={() => { setSearchOpen(false); setQuery(""); setSearchResults([]); }} aria-label="বন্ধ করুন">×</button>
                </form>

                {/* Instant Search Suggestions Dropdown */}
                {query.trim() !== "" && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "320px",
                      backgroundColor: "#ffffff",
                      borderRadius: "14px",
                      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
                      border: "1px solid #e2e8f0",
                      zIndex: 1000,
                      overflow: "hidden"
                    }}
                  >
                    {loadingSearch ? (
                      <div style={{ padding: "14px", fontSize: "0.85rem", color: "#64748b", textAlign: "center" }}>
                        খোঁজা হচ্ছে...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div style={{ padding: "8px 14px", backgroundColor: "#f8fafc", fontSize: "0.75rem", fontWeight: 700, color: "#64748b", borderBottom: "1px solid #e2e8f0" }}>
                          তাৎক্ষণিক অনুসন্ধানের ফলাফল ({searchResults.length})
                        </div>
                        {searchResults.map((prod) => {
                          const img = prod.images.find(x => x.is_primary)?.card_image || prod.images.find(x => x.is_primary)?.hero_desktop || prod.images[0]?.image;
                          const price = prod.discount_price || prod.price;
                          return (
                            <Link
                              key={prod.id}
                              href={`/products/${prod.slug}`}
                              onClick={() => { setSearchOpen(false); setQuery(""); setSearchResults([]); }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "10px 14px",
                                borderBottom: "1px solid #f1f5f9",
                                textDecoration: "none",
                                transition: "backgroundColor 0.15s ease"
                              }}
                            >
                              <div style={{ width: "40px", height: "40px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f1f5f9", flexShrink: 0 }}>
                                {img ? <img src={img} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ padding: "8px" }}>📦</span>}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {prod.name}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                                  ৳{Number(price).toLocaleString("bn-BD")}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                        <button
                          type="button"
                          onClick={submitSearch}
                          style={{
                            width: "100%",
                            padding: "10px",
                            backgroundColor: "#f8fafc",
                            border: "none",
                            color: "#0284c7",
                            fontWeight: 700,
                            fontSize: "0.83rem",
                            cursor: "pointer",
                            textAlign: "center"
                          }}
                        >
                          সব ফলাফল দেখুন ({query}) ➔
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: "16px", fontSize: "0.88rem", color: "#64748b", textAlign: "center" }}>
                        মাফ করবেন, কোনো পণ্য পাওয়া যায়নি!
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <button className="icon-btn search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search">⌕</button>
            )}
            {account?.authenticated ? (
              <>
                <Link className="profile-nav" href="/dashboard" title="Admin Dashboard" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#0f172a", color: "#38bdf8", fontSize: "0.8rem", fontWeight: 800, textDecoration: "none", border: "1px solid #0284c7" }}>
                  ⚙️
                </Link>
                <Link className="profile-nav" href="/account" title={account.name || "Profile"}>
                  {account.profile?.avatar_url ? <img src={account.profile.avatar_url} alt="" /> : <span>{(account.name || "A").slice(0, 1)}</span>}
                </Link>
              </>
            ) : (
              <Link className="account-link" href="/account">Sign up</Link>
            )}
            <button className="lang-switch" onClick={switchLanguage}>{t("language")}</button>
            <Link className="cart-nav" href="/cart" aria-label={t("cart")}>
              <CartIcon /> <span>{count}</span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { add } = useCart();
  const t = useTranslations("shop");
  const primaryImage = product.images.find(x => x.is_primary) || product.images[0];
  // Use the generated consistent canvas when it exists.
  const image = primaryImage?.card_image || primaryImage?.hero_desktop || primaryImage?.image;
  const currentPrice = product.discount_price || product.price;
  const imageCount = product.images ? product.images.length : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".prod-actions")) {
      return;
    }
    router.push(`/products/${product.slug}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.stock) return;
    add(product, true);
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.stock) return;
    add(product, false);
    router.push("/checkout");
  };

  return (
    <article className="prod-card" onClick={handleCardClick} style={{ cursor: "pointer" }}>
      <Link href={`/products/${product.slug}`} className="prod-img">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-monogram">আ</div>
        )}
        {product.is_featured && <span className="badge">{t("featured")}</span>}
        {imageCount > 1 && <span className="gallery-badge">📷 {imageCount}টি ছবি</span>}
      </Link>
      <div className="prod-body">
        <Link href={`/products/${product.slug}`}>
          <h3 className="t">{product.name}</h3>
        </Link>
        <div className="prod-rating-badge">
          <span className="star-gold">★</span>
          <strong className="rating-num">{product.average_rating || (product.reviews?.length ? (product.reviews.reduce((a, b) => a + b.rating, 0) / product.reviews.length).toFixed(1) : 5.0)}</strong>
          <span className="review-count">({product.total_reviews !== undefined ? product.total_reviews : (product.reviews?.length || 0)})</span>
        </div>
        <div className="prod-price">
          <span className="now">{formatPrice(currentPrice)}</span>
          {product.discount_price && <span className="old">{formatPrice(product.price)}</span>}
        </div>
        <div className="prod-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="btn btn-ghost btn-add-cart"
            onClick={handleAddToCart}
            disabled={!product.stock}
            title={product.stock ? (t("addToCart") || "কার্টে যোগ") : t("outOfStock")}
          >
            {product.stock ? t("addToCart") : t("outOfStock")}
          </button>
          <button type="button" className="btn btn-primary btn-order-now" onClick={handleOrderNow} disabled={!product.stock} title={product.stock ? (t("orderNow") || "অর্ডার করুন") : t("outOfStock")}>
            {product.stock ? t("orderNow") : t("outOfStock")}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCatalog({ products, initialCategory = "all" }: { products: Product[]; initialCategory?: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("popular");
  const [discountOnly, setDiscountOnly] = useState(false);
  const [stockOnly, setStockOnly] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [position, setPosition] = useState({ right: 18, bottom: 92 });
  const drag = useRef<{ id: number; x: number; y: number; right: number; bottom: number } | null>(null);
  const pageSize = 8;
  const t = useTranslations("shop");
  const categories = Array.from(new Map(products.map(product => [product.category.slug, product.category])).values());
  useEffect(() => {
    try { const saved = JSON.parse(localStorage.getItem("catalog-tools-position") || "null"); if (saved && Number.isFinite(saved.right) && Number.isFinite(saved.bottom)) setPosition({ right: saved.right, bottom: saved.bottom }); } catch { /* use default position */ }
    const onCategory = (event: Event) => { setCategory((event as CustomEvent<string>).detail || "all"); setPage(1); };
    const onSearch = (event: Event) => { setQuery((event as CustomEvent<string>).detail || ""); setPage(1); };
    window.addEventListener("product-category", onCategory); window.addEventListener("product-search", onSearch);
    return () => { window.removeEventListener("product-category", onCategory); window.removeEventListener("product-search", onSearch); };
  }, []);
  const update = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  useEffect(() => { const timer = window.setTimeout(() => { setCategory("all"); setMinPrice(""); setMaxPrice(""); setSort("popular"); setDiscountOnly(false); setStockOnly(false); setPage(1); setToolsOpen(false); }, 24 * 60 * 60 * 1000); return () => window.clearTimeout(timer); }, [category, minPrice, maxPrice, sort, discountOnly, stockOnly]);
  const filtered = products.filter(product => {
    const text = `${product.name} ${product.description}`.toLocaleLowerCase();
    const price = Number(product.discount_price || product.price);
    return (!query.trim() || text.includes(query.trim().toLocaleLowerCase())) && (category === "all" || product.category.slug === category) && (!minPrice || price >= Number(minPrice)) && (!maxPrice || price <= Number(maxPrice)) && (!discountOnly || Boolean(product.discount_price)) && (!stockOnly || product.stock > 0);
  });
  const sorted = [...filtered].sort((a, b) => sort === "low" ? Number(a.discount_price || a.price) - Number(b.discount_price || b.price) : sort === "high" ? Number(b.discount_price || b.price) - Number(a.discount_price || a.price) : sort === "discount" ? (b.discount_price ? Number(b.price) - Number(b.discount_price) : 0) - (a.discount_price ? Number(a.price) - Number(a.discount_price) : 0) : Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)));
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const visible = sorted.slice((page - 1) * pageSize, page * pageSize);
  const activeFilters = [category !== "all" ? category : "", minPrice, maxPrice, sort !== "popular" ? sort : "", discountOnly ? "discount" : "", stockOnly ? "stock" : ""].filter(Boolean).length;
  const moveTools = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    const next = { right: Math.max(8, Math.min(window.innerWidth - 58, drag.current.right - (event.clientX - drag.current.x))), bottom: Math.max(80, Math.min(window.innerHeight - 58, drag.current.bottom - (event.clientY - drag.current.y))) };
    setPosition(next);
  };
  const stopTools = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    localStorage.setItem("catalog-tools-position", JSON.stringify(position));
    drag.current = null;
  };
  return <>
    <div className="catalog-search-visible"><span>⌕</span><input value={query} onChange={event => update(setQuery, event.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchProducts")} /></div>
    <button className="filter-fab" style={{ right: position.right, bottom: position.bottom }} onPointerDown={event => { drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, right: position.right, bottom: position.bottom }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={moveTools} onPointerUp={stopTools} onClick={() => setToolsOpen(open => !open)} aria-label="ফিল্টার টুলস"><ToolsIcon /><span>{activeFilters || "Tools"}</span></button>
    {toolsOpen && <div className="catalog-tools-panel" style={{ right: position.right, bottom: position.bottom + 60 }} role="dialog" aria-label="ফিল্টার ও সাজানো">
      <div className="catalog-tools-head"><div><strong>ফিল্টার ও সাজানো</strong><small>{activeFilters ? `${activeFilters}টি filter সক্রিয়` : "ফিল্টার ১ দিন পর reset হবে"}</small></div><button type="button" onClick={() => setToolsOpen(false)} aria-label="বন্ধ করুন">×</button></div>
      <select value={category} onChange={event => update(setCategory, event.target.value)} aria-label={t("filterCategory")}><option value="all">সব ক্যাটাগরি</option>{categories.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select>
      <select value={sort} onChange={event => update(setSort, event.target.value)} aria-label="সাজান"><option value="popular">জনপ্রিয়</option><option value="low">কম দাম আগে</option><option value="high">বেশি দাম আগে</option><option value="discount">বেশি ছাড় আগে</option></select>
      <div className="price-filter-row"><input type="number" min="0" value={minPrice} onChange={event => update(setMinPrice, event.target.value)} placeholder="সর্বনিম্ন দাম" /><input type="number" min="0" value={maxPrice} onChange={event => update(setMaxPrice, event.target.value)} placeholder="সর্বোচ্চ দাম" /></div>
      <label className="filter-check"><input type="checkbox" checked={discountOnly} onChange={event => { setDiscountOnly(event.target.checked); setPage(1); }} /> শুধু discount পণ্য</label>
      <label className="filter-check"><input type="checkbox" checked={stockOnly} onChange={event => { setStockOnly(event.target.checked); setPage(1); }} /> শুধু stock available</label>
      <div className="catalog-tools-actions"><button type="button" className="btn btn-ghost" onClick={() => { setCategory("all"); setMinPrice(""); setMaxPrice(""); setSort("popular"); setDiscountOnly(false); setStockOnly(false); setPage(1); }}>Reset</button><button type="button" className="btn btn-primary" onClick={() => setToolsOpen(false)}>Apply</button></div>
    </div>}
    {visible.length ? <div className="prod-grid">{visible.map(product => <ProductCard key={product.id} product={product} />)}</div> : <p className="empty-results">{t("noResults")}</p>}
    {sorted.length > pageSize && <div className="pagination"><button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(current => current - 1)}>{t("previous")}</button><span>{page} / {pageCount}</span><button className="btn btn-ghost" disabled={page === pageCount} onClick={() => setPage(current => current + 1)}>{t("next")}</button></div>}
  </>;
}

export type CategoryFilterItem = {
  name: string;
  slug: string;
  image?: string | null;
  count?: number;
};

export function CategoryFilterCards({ categories }: { categories: CategoryFilterItem[] }) {
  const [activeCat, setActiveCat] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const onCategory = (event: Event) => {
      setActiveCat((event as CustomEvent<string>).detail || "all");
    };
    window.addEventListener("product-category", onCategory);
    return () => window.removeEventListener("product-category", onCategory);
  }, []);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -260 : 260;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const selectCat = (slug: string) => {
    setActiveCat(slug);
    window.dispatchEvent(new CustomEvent("product-category", { detail: slug }));
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  };

  const toBn = (n: number) => n.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[+d]);
  const totalCount = categories.reduce((sum, item) => sum + (item.count || 1), 0);

  return (
    <div className="cat-rail-wrapper">
      {canScrollLeft && (
        <button
          className="cat-scroll-btn cat-scroll-prev"
          type="button"
          onClick={() => scroll("left")}
          aria-label="আগের ক্যাটাগরি"
        >
          ‹
        </button>
      )}

      <div className="cat-grid cat-circle-grid" ref={scrollRef} onScroll={checkScroll}>
        <button
          className={`cat-card cat-circle-card ${activeCat === "all" ? "is-active" : ""}`}
          type="button"
          onClick={() => selectCat("all")}
        >
          <div className="cat-avatar-wrap">
            <div className="cat-avatar-ring">
              <div className="cat-avatar-inner all-avatar-inner">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cat-all-svg">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
            </div>
            {activeCat === "all" && <span className="cat-active-dot" />}
          </div>
          <span className="cat-title">সব ক্যাটাগরি</span>
          <span className="cat-count">{toBn(totalCount)}টি পণ্য</span>
        </button>

        {categories.map((category) => {
          const isActive = activeCat === category.slug;
          return (
            <button
              className={`cat-card cat-circle-card ${isActive ? "is-active" : ""}`}
              type="button"
              key={category.slug}
              onClick={() => selectCat(category.slug)}
            >
              <div className="cat-avatar-wrap">
                <div className="cat-avatar-ring">
                  <div className="cat-avatar-inner">
                    {category.image ? (
                      <img src={category.image} alt={category.name} loading="lazy" />
                    ) : (
                      <div className="cat-glyph-letter">
                        {category.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                </div>
                {isActive && <span className="cat-active-dot" />}
              </div>
              <span className="cat-title">{category.name}</span>
              <span className="cat-count">
                {category.count ? `${toBn(category.count)}টি পণ্য` : "পণ্য দেখুন"}
              </span>
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          className="cat-scroll-btn cat-scroll-next"
          type="button"
          onClick={() => scroll("right")}
          aria-label="পরের ক্যাটাগরি"
        >
          ›
        </button>
      )}
    </div>
  );
}

function CartDrawer({ open, close }: { open: boolean; close: () => void }) {
  const { items, total, change, remove } = useCart();
  const t = useTranslations("shop");
  return <div className={`drawer-wrap ${open ? "is-open" : ""}`} aria-hidden={!open}><button className="drawer-backdrop" aria-label={t("close")} onClick={close} /><aside className="drawer"><div className="drawer-head"><div><p>{t("cartTitle")}</p><h2>{items.length ? t("cartItems") : t("cartEmpty")}</h2></div><button onClick={close} aria-label={t("close")}>×</button></div><div className="drawer-items">{items.map(item => <div className="drawer-item" key={item.id}><div className="drawer-thumb">{item.images[0]?.image ? <img src={item.images[0].card_image || item.images[0].hero_desktop || item.images[0].image} alt="" /> : "আ"}</div><div><h3>{item.name}</h3><p>{formatPrice(item.discount_price || item.price)}</p><div className="drawer-quantity"><button onClick={() => change(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => change(item.id, item.quantity + 1)}>+</button><button className="remove" onClick={() => remove(item.id)}>{t("remove")}</button></div></div></div>)}</div>{items.length > 0 ? <div className="drawer-foot"><div><span>{t("subtotal")}</span><strong>{formatPrice(total)}</strong></div><Link className="wide" onClick={close} href="/checkout">{t("checkout")} →</Link></div> : <Link className="wide" onClick={close} href="/shop">{t("shopNow")}</Link>}</aside></div>;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  if (pathname && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    return null;
  }
  const { count } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);
  const [account, setAccount] = useState<{ authenticated: boolean; name?: string; profile?: { avatar_url?: string } } | null>(null);
  useEffect(() => { fetch(API + "/auth/me/", { credentials: "include" }).then(response => response.json()).then(setAccount).catch(() => setAccount({ authenticated: false })); }, []);
  const profileLabel = account?.name || "অ্যাকাউন্ট";
  const closeMore = () => setMoreOpen(false);
  return <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
    <Link href="/shop"><ShopIcon /><span>শপ</span></Link>
    <Link href="/cart"><CartIcon /><b>{count}</b><span>কার্ট</span></Link>
    <Link className="mobile-home" href="/">⌂<span>হোম</span></Link>
    <Link className="mobile-account" href="/account" title={profileLabel}>{account?.authenticated && account.profile?.avatar_url ? <img src={account.profile.avatar_url} alt={profileLabel} /> : account?.authenticated ? <strong>{(account.name || "A").slice(0, 1)}</strong> : "◉"}<span>অ্যাকাউন্ট</span></Link>
    <button className={`mobile-more-trigger${moreOpen ? " is-open" : ""}`} type="button" onClick={() => setMoreOpen(open => !open)} aria-expanded={moreOpen} aria-haspopup="menu"><span className="mobile-more-icon">⋯</span><span>আরও</span></button>
    {moreOpen && <div className="mobile-more-menu" role="menu">
      <Link href="/offers" onClick={closeMore} role="menuitem">🏷️ <span>অফার</span></Link>
      <Link href="/categories" onClick={closeMore} role="menuitem">▦ <span>ক্যাটাগরি</span></Link>
      <Link href="/track-order" onClick={closeMore} role="menuitem">⌁ <span>অর্ডার ট্র্যাক</span></Link>
      <a href="#contact" onClick={closeMore} role="menuitem">✉ <span>যোগাযোগ</span></a>
    </div>}
  </nav>;
}