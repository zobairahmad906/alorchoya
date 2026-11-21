"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { HeroSlider } from "../HeroSlider";
import { cleanImageUrl, ProductCard } from "../components";
import { formatPrice } from "../formatters";
import { useCart } from "../cart";
import type { Product, HeroSlide, Review, Category } from "../types";

function LightEmeraldCard({ product, index }: { product: Product; index: number }) {
  const { add } = useCart();
  const primaryImage = product.images?.find((x) => x.is_primary) || product.images?.[0];
  const image = cleanImageUrl(primaryImage?.card_image || primaryImage?.hero_desktop || primaryImage?.image);
  const currentPrice = product.discount_price || product.price;
  const isAvailable = product.stock === undefined || product.stock === null || Number(product.stock) > 0;

  // Calculate discount percentage or fallback (30%, 10%, 15%, 25% like in screenshot)
  const discountPct =
    product.discount_price && Number(product.discount_price) < Number(product.price)
      ? Math.round(((Number(product.price) - Number(product.discount_price)) / Number(product.price)) * 100)
      : [30, 10, 15, 25][index % 4];

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAvailable) return;
    add(product, false);
    window.location.href = "/checkout";
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isAvailable) return;
    add(product, true);
  };

  return (
    <article
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        cursor: "pointer",
        minWidth: 0,
        boxSizing: "border-box",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onClick={() => {
        window.location.href = `/products/${product.slug}`;
      }}
    >
      {/* Green discount pill matching screenshot */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 5,
          backgroundColor: "#065f46",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: 900,
          padding: "2px 6px",
          borderRadius: "6px",
        }}
      >
        -{formatPrice(discountPct, "bn").replace("৳", "")}%
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          borderRadius: "10px",
          overflow: "hidden",
          backgroundColor: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
          boxSizing: "border-box",
        }}
      >
        {image ? (
          <img
            src={image}
            alt={product.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
          />
        ) : (
          <span style={{ fontSize: "32px" }}>📦</span>
        )}
      </div>

      <div style={{ marginTop: "8px" }}>
        <h4 style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#1e293b", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {product.name}
        </h4>
        <div style={{ fontSize: "14px", fontWeight: 900, color: "#065f46", marginBottom: "6px" }}>
          {formatPrice(currentPrice, "bn")}
        </div>

        <div style={{ display: "flex", gap: "5px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleOrderNow}
            disabled={!isAvailable}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "7px 2px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isAvailable ? "#065f46" : "#cbd5e1",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 800,
              cursor: isAvailable ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              textAlign: "center",
            }}
          >
            অর্ডার করুন
          </button>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "6px 2px",
              borderRadius: "8px",
              border: "1.5px solid #065f46",
              backgroundColor: "#ffffff",
              color: isAvailable ? "#065f46" : "#94a3b8",
              fontSize: "11px",
              fontWeight: 800,
              cursor: isAvailable ? "pointer" : "not-allowed",
              transition: "all 0.15s ease",
              whiteSpace: "nowrap",
              boxSizing: "border-box",
              textAlign: "center",
            }}
          >
            কার্টে যোগ করুন
          </button>
        </div>
      </div>
    </article>
  );
}

interface ModelProps {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  reviews: Review[];
  discountedProducts: Product[];
}

export function Model1DashboardPortal({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const { count: cartCount } = useCart();
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 20 });

  // 4 Discounted special products for the interactive promo slider (rotating one after another)
  const promoProducts = useMemo(() => {
    if (discountedProducts && discountedProducts.length > 0) {
      return discountedProducts.slice(0, 4);
    }
    return products.slice(0, 4);
  }, [discountedProducts, products]);

  const [activeSlide, setActiveSlide] = useState(0);

  // Auto rotate one after another every 3.8 seconds
  useEffect(() => {
    if (promoProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoProducts.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [promoProducts.length]);

  const currentSlideProd = promoProducts[activeSlide] || promoProducts[0];
  const slidePrimaryImg = currentSlideProd?.images?.find((x) => x.is_primary) || currentSlideProd?.images?.[0];
  const slideImgUrl = cleanImageUrl(slidePrimaryImg?.card_image || slidePrimaryImg?.hero_desktop || slidePrimaryImg?.image);
  const slideCurrentPrice = currentSlideProd?.discount_price || currentSlideProd?.price;
  const slideOldPrice = currentSlideProd?.discount_price && Number(currentSlideProd.discount_price) < Number(currentSlideProd.price) ? currentSlideProd.price : null;
  const slideDiscountPct = slideOldPrice
    ? Math.round(((Number(slideOldPrice) - Number(slideCurrentPrice)) / Number(slideOldPrice)) * 100)
    : 50;

  const bannerTouchStartX = useRef<number>(0);
  const onBannerTouchStart = (e: React.TouchEvent) => {
    bannerTouchStartX.current = e.touches[0].clientX;
  };
  const onBannerTouchEnd = (e: React.TouchEvent) => {
    const diff = bannerTouchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) {
      setActiveSlide((prev) => (prev + 1) % promoProducts.length);
    } else if (diff < -40) {
      setActiveSlide((prev) => (prev - 1 + promoProducts.length) % promoProducts.length);
    }
  };

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const moved = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    moved.current = false;
    startX.current = e.touches[0].pageX - (categoryScrollRef.current?.offsetLeft || 0);
    scrollLeftStart.current = categoryScrollRef.current?.scrollLeft || 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !categoryScrollRef.current) return;
    const x = e.touches[0].pageX - (categoryScrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2;
    if (Math.abs(walk) > 4) moved.current = true;
    categoryScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    setTimeout(() => {
      moved.current = false;
    }, 50);
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    moved.current = false;
    startX.current = e.pageX - (categoryScrollRef.current?.offsetLeft || 0);
    scrollLeftStart.current = categoryScrollRef.current?.scrollLeft || 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !categoryScrollRef.current) return;
    const x = e.pageX - (categoryScrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2;
    if (Math.abs(walk) > 4) {
      moved.current = true;
      e.preventDefault();
    }
    categoryScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => {
      moved.current = false;
    }, 50);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategorySlug !== "all") {
      list = list.filter((p) => p.category?.slug === activeCategorySlug);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCategorySlug, searchQuery]);

  const flashProducts = discountedProducts.slice(0, 5);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", width: "100%" }}>
      {/* Edge-to-Edge Top Announcement Banner */}
      <div className="model1-announcement-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ color: "#c9a45c", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            🖥️ ফুল-স্ক্রিন পোর্টাল
          </span>
          <span className="model1-announcement-hide-mobile" style={{ color: "#94a3b8" }}>|</span>
          <span className="model1-announcement-hide-mobile">ফার্নিচার, পোশাক, জুতো, ঘড়ি ও হোম ডেকরে বিশেষ মেগা অফার চলছে!</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <span style={{ color: "#fef08a", fontWeight: 700 }}>⚡ ফ্রি ক্যাশ অন ডেলিভারি</span>
          <a href="tel:01302111188" style={{ color: "#ffffff", textDecoration: "none", fontWeight: 700 }}>
            📞 01302 111188
          </a>
        </div>
      </div>

      {/* Main Full-Screen Body: Persistent Left Sidebar + Fluid Right Canvas */}
      <div className="model1-layout-container">
        {/* Persistent Left Category Sidebar (Like Admin Dashboard Sidebar) */}
        <aside id="categories" className="model1-desktop-sidebar">
          {/* Sidebar Header */}
          <div
            style={{
              padding: "16px 20px",
              backgroundColor: "#173f35",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "15px" }}>
              <span>📑</span>
              <span>ডিপার্টমেন্ট ও ক্যাটাগরি</span>
            </div>
            <span
              style={{
                backgroundColor: "#c9a45c",
                color: "#173f35",
                fontSize: "11px",
                fontWeight: 900,
                padding: "2px 8px",
                borderRadius: "10px",
              }}
            >
              {categories.length}টি
            </span>
          </div>

          {/* Quick Search inside Sidebar */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              type="text"
              placeholder="পণ্য বা ব্র্যান্ড খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Category Navigation Links */}
          <nav style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <button
              type="button"
              onClick={() => setActiveCategorySlug("all")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeCategorySlug === "all" ? "#10b981" : "transparent",
                color: activeCategorySlug === "all" ? "#ffffff" : "#334155",
                fontWeight: activeCategorySlug === "all" ? 800 : 600,
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span>🔥</span>
                <span>সকল পণ্য (সব কালেকশন)</span>
              </div>
              <span style={{ fontSize: "11px", opacity: 0.85 }}>({products.length})</span>
            </button>

            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              const count = products.filter((p) => p.category?.slug === cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategorySlug(cat.slug)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: isActive ? "#10b981" : "transparent",
                    color: isActive ? "#ffffff" : "#334155",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "16px" }}>{cat.icon || "🛍️"}</span>
                    <span>{cat.name}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {cat.badge && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          backgroundColor: isActive ? "#ffffff" : "#fef3c7",
                          color: isActive ? "#047857" : "#b45309",
                          padding: "1px 6px",
                          borderRadius: "6px",
                        }}
                      >
                        {cat.badge}
                      </span>
                    )}
                    <span style={{ fontSize: "11px", opacity: 0.75 }}>({count})</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Customer Support Footer inside Sidebar */}
          <div style={{ padding: "16px", borderTop: "1px solid #f1f5f9", backgroundColor: "#f8fafc" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "6px" }}>
              কাস্টমার সাপোর্ট
            </div>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#0f172a" }}>01302 111188</div>
            <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 600, marginTop: "2px" }}>২৪/৭ অর্ডার হেল্পলাইন</div>
          </div>
        </aside>

        {/* Right Main Fluid Canvas (100% Remaining Screen Width) */}
        <main className="model1-main-canvas" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Mobile Header (Exact to user uploaded reference) */}
          <div className="model1-mobile-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0" }}>
                <img src="/alorchoya-logo.jpeg" alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
                <span style={{ fontSize: "16px" }}>☀️</span>
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 900, color: "#064e3b", lineHeight: 1.1 }}>Alor Chhoya</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "#047857" }}>আলোর ছোঁয়া</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Mobile Model Switcher Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "#f1f5f9",
                  padding: "2px 4px",
                  borderRadius: "14px",
                  border: "1px solid #cbd5e1",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", padding: "0 2px" }}>
                  মডেল:
                </span>
                <Link
                  href="/?model=model1"
                  style={{
                    padding: "2px 7px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    textDecoration: "none",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                  }}
                >
                  ১
                </Link>
                <Link
                  href="/?model=model2"
                  style={{
                    padding: "2px 7px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    textDecoration: "none",
                    backgroundColor: "transparent",
                    color: "#475569",
                  }}
                >
                  ২
                </Link>
              </div>

              <a
                href="/cart"
                title="কার্ট দেখুন"
                onClick={() => {
                  window.location.href = "/cart";
                }}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#f1f5f9",
                  textDecoration: "none",
                  color: "#334155",
                  fontSize: "16px",
                }}
              >
                🛒
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#065f46",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 900,
                      minWidth: "18px",
                      height: "18px",
                      padding: "0 4px",
                      borderRadius: "9px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {cartCount}
                  </span>
                )}
              </a>
            </div>
          </div>

          {/* Mobile Full-Width Search Bar */}
          <div className="model1-mobile-search">
            <div style={{ position: "relative", width: "100%" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: "#94a3b8" }}>🔍</span>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 38px",
                  borderRadius: "24px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                }}
              />
            </div>
          </div>

          {/* Category Story Circles (Exact to user uploaded reference) */}
          <div
            className="model1-mobile-categories"
            ref={categoryScrollRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <button
              type="button"
              onClick={() => {
                if (!moved.current) setActiveCategorySlug("all");
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "5px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  border: activeCategorySlug === "all" ? "2.5px solid #059669" : "1.5px solid #e2e8f0",
                  padding: "2px",
                  backgroundColor: "#ffffff",
                  boxShadow: activeCategorySlug === "all" ? "0 0 10px rgba(5,150,105,0.25)" : "none",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    backgroundColor: activeCategorySlug === "all" ? "#ecfdf5" : "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    color: activeCategorySlug === "all" ? "#047857" : "#64748b",
                    fontWeight: 900,
                  }}
                >
                  ★
                </div>
              </div>
              <span style={{ fontSize: "11px", fontWeight: activeCategorySlug === "all" ? 800 : 600, color: activeCategorySlug === "all" ? "#047857" : "#334155", whiteSpace: "nowrap" }}>
                সব পণ্য
              </span>
            </button>
            {categories.map((cat) => {
              const isActive = activeCategorySlug === cat.slug;
              const catImg = cat.image || cat.image_url;
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => {
                    if (!moved.current) setActiveCategorySlug(cat.slug);
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      border: isActive ? "2.5px solid #059669" : "1.5px solid #e2e8f0",
                      padding: "2px",
                      backgroundColor: "#ffffff",
                      boxShadow: isActive ? "0 0 10px rgba(5,150,105,0.25)" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        overflow: "hidden",
                        backgroundColor: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {catImg ? (
                        <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "20px" }}>{cat.icon || "🛍️"}</span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: isActive ? 800 : 600, color: isActive ? "#047857" : "#334155", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mobile Emerald Promo Slider (Rotating 4 Discounted Products) */}
          <div className="model1-mobile-promo">
            <div
              onTouchStart={onBannerTouchStart}
              onTouchEnd={onBannerTouchEnd}
              style={{
                background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #065f46 100%)",
                borderRadius: "16px",
                padding: "16px 14px 12px",
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(6, 78, 59, 0.25)",
                border: "1px solid rgba(201, 164, 92, 0.4)",
                position: "relative",
                overflow: "hidden",
                minHeight: "165px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.12, backgroundImage: "radial-gradient(#c9a45c 1.5px, transparent 1.5px)", backgroundSize: "12px 12px" }}></div>
              
              <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                {/* Left Text & CTA */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#fef08a", letterSpacing: "0.3px" }}>
                      ✨ ঈদ স্পেশাল অফার
                    </span>
                    {slideDiscountPct > 0 && (
                      <span style={{ fontSize: "9px", fontWeight: 800, backgroundColor: "rgba(254, 240, 138, 0.2)", color: "#fef08a", border: "1px solid rgba(254, 240, 138, 0.4)", padding: "1px 5px", borderRadius: "5px" }}>
                        -{slideDiscountPct}% ছাড়
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 800, color: "#ffffff", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {currentSlideProd?.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#fef08a" }}>
                      {formatPrice(slideCurrentPrice, "bn")}
                    </span>
                    {slideOldPrice && (
                      <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", textDecoration: "line-through" }}>
                        {formatPrice(slideOldPrice, "bn")}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/products/${currentSlideProd?.slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      backgroundColor: "#ffffff",
                      color: "#064e3b",
                      padding: "6px 18px",
                      borderRadius: "20px",
                      fontWeight: 900,
                      fontSize: "11px",
                      textDecoration: "none",
                      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    এখনই কিনুন →
                  </Link>
                </div>

                {/* Right Image */}
                <div
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    border: "1px solid rgba(254, 240, 138, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  {slideImgUrl ? (
                    <img
                      key={currentSlideProd?.id}
                      src={slideImgUrl}
                      alt={currentSlideProd?.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        animation: "fadeIn 0.3s ease",
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: "36px" }}>🎁</span>
                  )}
                </div>
              </div>

              {/* Dots Indicator for the 4 Products */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", marginTop: "10px", position: "relative", zIndex: 2 }}>
                {promoProducts.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      width: activeSlide === idx ? "20px" : "6px",
                      height: "5px",
                      borderRadius: "3px",
                      backgroundColor: activeSlide === idx ? "#fef08a" : "rgba(255, 255, 255, 0.35)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Panoramic Widescreen Hero Banner (Desktop Only) */}
          <div className="desktop-only-hero" style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <HeroSlider
              products={products.slice(0, 5)}
              heroSlides={heroSlides}
              variant="portal"
              eyebrow="★ আলোর ছোঁয়া মেগা পোর্টাল"
              defaultTitle="নতুন কালেকশন ও স্পেশাল ছাড় সরাসরি ফ্যাক্টরি মূল্যে"
              defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
              shopButtonText="এখনই অর্ডার করুন"
            />
          </div>

          {/* Flash Deals Edge-to-Edge Strip (All Versions: Mobile & Desktop) */}
          {flashProducts.length > 0 && (
            <section
              id="offers"
              className="model1-section-card"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fecdd3",
                padding: "18px clamp(12px, 2vw, 24px)",
                boxShadow: "0 2px 12px rgba(225,29,72,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#be123c" }}>
                      আজকের মেগা ফ্ল্যাশ সেল (সীমিত সময়)
                    </h3>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>স্টক শেষ হওয়ার আগেই লুফে নিন</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>অফার শেষ হতে বাকি:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ backgroundColor: "#be123c", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.hours).padStart(2, "0")}h
                    </span>
                    <span style={{ fontWeight: 800, color: "#be123c" }}>:</span>
                    <span style={{ backgroundColor: "#be123c", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.minutes).padStart(2, "0")}m
                    </span>
                    <span style={{ fontWeight: 800, color: "#be123c" }}>:</span>
                    <span style={{ backgroundColor: "#be123c", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.seconds).padStart(2, "0")}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Flash Products Fluid Grid (2 columns on mobile, 5-6 columns on desktop) */}
              <div className="model-product-grid">
                {flashProducts.map((p, idx) => (
                  <LightEmeraldCard key={p.id} product={p} index={idx} />
                ))}
              </div>
            </section>
          )}

          {/* Main Product Catalog Section: 5-6 Columns High-Density Grid */}
          <section
            id="shop"
            className="model1-section-card"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div className="model1-catalog-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
                  {activeCategorySlug === "all" ? "সকল পণ্য ক্যাটালগ" : categories.find((c) => c.slug === activeCategorySlug)?.name || "ক্যাটাগরি পণ্য"}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  প্রদর্শিত হচ্ছে: <strong>{filteredProducts.length}টি পণ্য</strong>
                </span>
              </div>

              {/* Category Filter Pills on Top of Grid (Desktop Only) */}
              <div className="desktop-only-filter" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => setActiveCategorySlug("all")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: activeCategorySlug === "all" ? "#10b981" : "#cbd5e1",
                    backgroundColor: activeCategorySlug === "all" ? "#10b981" : "#f8fafc",
                    color: activeCategorySlug === "all" ? "#ffffff" : "#475569",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  সব ({products.length})
                </button>
                {categories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setActiveCategorySlug(cat.slug)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "20px",
                      border: "1px solid",
                      borderColor: activeCategorySlug === cat.slug ? "#10b981" : "#cbd5e1",
                      backgroundColor: activeCategorySlug === cat.slug ? "#10b981" : "#f8fafc",
                      color: activeCategorySlug === cat.slug ? "#ffffff" : "#475569",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {cat.icon || "🏷️"} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Density Responsive Fluid Grid (5-6 Columns on Widescreen, 2 cols on mobile) */}
            {filteredProducts.length > 0 ? (
              <div className="model-product-grid">
                {filteredProducts.map((prod, idx) => (
                  <LightEmeraldCard key={prod.id} product={prod} index={idx} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>📦</span>
                <strong style={{ fontSize: "16px", color: "#0f172a" }}>কোনো পণ্য পাওয়া যায়নি</strong>
                <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>অন্য ক্যাটাগরি নির্বাচন করুন অথবা ফিল্টার রিসেট করুন।</p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategorySlug("all");
                    setSearchQuery("");
                  }}
                  style={{
                    padding: "8px 20px",
                    backgroundColor: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  সকল পণ্য দেখুন
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
