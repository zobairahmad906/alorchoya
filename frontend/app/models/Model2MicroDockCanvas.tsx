"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { HeroSlider } from "../HeroSlider";
import { cleanImageUrl } from "../components";
import { formatPrice } from "../formatters";
import { useCart } from "../cart";
import type { Product, HeroSlide, Review, Category } from "../types";

function DarkCinematicCard({ product }: { product: Product }) {
  const { add } = useCart();
  const primaryImage = product.images?.find((x) => x.is_primary) || product.images?.[0];
  const image = cleanImageUrl(primaryImage?.card_image || primaryImage?.hero_desktop || primaryImage?.image);
  const currentPrice = product.discount_price || product.price;
  const isAvailable = product.stock === undefined || product.stock === null || Number(product.stock) > 0;

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
        background: "linear-gradient(145deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: "16px",
        border: "1px solid rgba(16, 185, 129, 0.28)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        minWidth: 0,
        boxSizing: "border-box",
        transition: "transform 0.2s ease, border-color 0.2s ease",
      }}
      onClick={() => {
        window.location.href = `/products/${product.slug}`;
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "1/1",
          borderRadius: "10px",
          overflow: "hidden",
          backgroundColor: "#070d18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
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
        <h4 style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#f8fafc", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden", textAlign: "center" }}>
          {product.name}
        </h4>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 900,
            color: "#fef08a",
            letterSpacing: "0.5px",
            marginBottom: "6px",
            textAlign: "center",
          }}
        >
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
              borderRadius: "16px",
              border: "1px solid rgba(16, 185, 129, 0.8)",
              background: isAvailable ? "linear-gradient(135deg, #059669, #0d9488)" : "rgba(30, 41, 59, 0.5)",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 800,
              cursor: isAvailable ? "pointer" : "not-allowed",
              boxShadow: isAvailable ? "0 0 10px rgba(16, 185, 129, 0.3)" : "none",
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
              borderRadius: "16px",
              border: "1px solid rgba(16, 185, 129, 0.5)",
              backgroundColor: "rgba(16, 185, 129, 0.15)",
              color: isAvailable ? "#34d399" : "#64748b",
              fontSize: "11px",
              fontWeight: 800,
              cursor: isAvailable ? "pointer" : "not-allowed",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.15)",
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

export function Model2MicroDockCanvas({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const { count: cartCount } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 20 });

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

  const flashProducts = (discountedProducts && discountedProducts.length > 0 ? discountedProducts : products).slice(0, 5);

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
    : 15;

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

  const chipsScrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const moved = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    moved.current = false;
    startX.current = e.touches[0].pageX - (chipsScrollRef.current?.offsetLeft || 0);
    scrollLeftStart.current = chipsScrollRef.current?.scrollLeft || 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !chipsScrollRef.current) return;
    const x = e.touches[0].pageX - (chipsScrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2;
    if (Math.abs(walk) > 4) moved.current = true;
    chipsScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
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
    startX.current = e.pageX - (chipsScrollRef.current?.offsetLeft || 0);
    scrollLeftStart.current = chipsScrollRef.current?.scrollLeft || 0;
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !chipsScrollRef.current) return;
    const x = e.pageX - (chipsScrollRef.current.offsetLeft || 0);
    const walk = (x - startX.current) * 1.2;
    if (Math.abs(walk) > 4) {
      moved.current = true;
      e.preventDefault();
    }
    chipsScrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const onMouseUp = () => {
    isDragging.current = false;
    setTimeout(() => {
      moved.current = false;
    }, 50);
  };

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== "all") {
      list = list.filter((p) => p.category?.slug === activeCategory);
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
  }, [products, activeCategory, searchQuery]);

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", width: "100%", color: "#f8fafc" }}>
      {/* Edge-to-Edge Container with Left Floating Micro-Dock on Desktop */}
      <div className="model2-layout-container">
        {/* Left Persistent Category Panel (Desktop only) */}
        <aside id="categories" className="model2-desktop-dock">
          {/* Brand Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              cursor: "pointer",
              marginBottom: "8px",
            }}
            onClick={() => setActiveCategory("all")}
          >
            <span style={{ fontSize: "20px" }}>🌟</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 800, fontSize: "14px", color: "#38bdf8" }}>ক্যাটাগরি সমূহ</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>পণ্য নির্বাচন করুন</span>
            </div>
          </div>

          {/* All Collection Button */}
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeCategory === "all" ? "#0284c7" : "transparent",
              color: "#ffffff",
              cursor: "pointer",
              width: "100%",
              justifyContent: "flex-start",
              transition: "all 0.15s ease",
            }}
            title="সকল পণ্য"
          >
            <span style={{ fontSize: "18px" }}>🔥</span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, fontSize: "13px", color: activeCategory === "all" ? "#ffffff" : "#e2e8f0" }}>সকল পণ্য</span>
              <span style={{ fontSize: "11px", backgroundColor: activeCategory === "all" ? "rgba(255,255,255,0.25)" : "#334155", color: "#ffffff", padding: "2px 7px", borderRadius: "10px", fontWeight: 800 }}>
                {products.length}
              </span>
            </div>
          </button>

          {/* Category Items in Dock */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const catImg = cat.image || cat.image_url;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: isActive ? "#0284c7" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                  width: "100%",
                  justifyContent: "flex-start",
                  transition: "all 0.15s ease",
                }}
                title={cat.name}
              >
                <div style={{ width: "26px", height: "26px", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0f172a", flexShrink: 0 }}>
                  {catImg ? (
                    <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "16px" }}>{cat.icon || "🏷️"}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0, gap: "6px" }}>
                  <span style={{ fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: isActive ? "#ffffff" : "#cbd5e1" }}>
                    {cat.name}
                  </span>
                  {cat.badge && (
                    <span style={{ fontSize: "10px", backgroundColor: "#f59e0b", color: "#000", padding: "1px 5px", borderRadius: "4px", fontWeight: 800, flexShrink: 0 }}>
                      {cat.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        {/* 95% Expansive Main Canvas */}
        <main
          className="model2-main-canvas"
          style={{
            flex: 1,
            minWidth: 0,
            padding: "20px clamp(16px, 2.5vw, 40px) 48px",
            backgroundColor: "#0f172a",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {/* Mobile Header (Exact to user uploaded dark reference) */}
          <div className="model2-mobile-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, rgba(201,164,92,0.3), rgba(15,23,42,0.8))", border: "1px solid rgba(201,164,92,0.6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fef08a", fontWeight: 900, fontSize: "14px", fontFamily: "serif" }}>
                AC
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.5px" }}>
                Alor Chhoya
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* Mobile Model Switcher Pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  backgroundColor: "rgba(30, 41, 59, 0.85)",
                  padding: "2px 4px",
                  borderRadius: "14px",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  gap: "2px",
                }}
              >
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", padding: "0 3px" }}>
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
                    backgroundColor: "transparent",
                    color: "#94a3b8",
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
                    backgroundColor: "#10b981",
                    color: "#ffffff",
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
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(6, 78, 59, 0.6)",
                  border: "1px solid rgba(16, 185, 129, 0.5)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  fontSize: "15px",
                  position: "relative",
                }}
              >
                🛒
                {cartCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#10b981",
                      color: "#ffffff",
                      fontSize: "10px",
                      fontWeight: 900,
                      minWidth: "16px",
                      height: "16px",
                      padding: "0 3px",
                      borderRadius: "8px",
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

          {/* Mobile Swipeable Horizontal Categories Strip (Exact to dark reference) */}
          <div
            className="model2-mobile-chips"
            ref={chipsScrollRef}
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
                if (!moved.current) setActiveCategory("all");
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
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  border: activeCategory === "all" ? "1.5px solid #10b981" : "1px solid rgba(201, 164, 92, 0.35)",
                  backgroundColor: activeCategory === "all" ? "rgba(6, 78, 59, 0.5)" : "rgba(30, 41, 59, 0.6)",
                  boxShadow: activeCategory === "all" ? "0 0 14px rgba(16, 185, 129, 0.5)" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: activeCategory === "all" ? "#34d399" : "#cbd5e1",
                  transition: "all 0.2s ease",
                }}
              >
                ✨
              </div>
              <span style={{ fontSize: "10px", fontWeight: 700, color: activeCategory === "all" ? "#34d399" : "#94a3b8", whiteSpace: "nowrap" }}>
                সব পণ্য
              </span>
            </button>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              const catImg = cat.image || cat.image_url;
              return (
                <button
                  key={cat.id || cat.slug}
                  type="button"
                  onClick={() => {
                    if (!moved.current) setActiveCategory(cat.slug);
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
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      border: isActive ? "1.5px solid #10b981" : "1px solid rgba(201, 164, 92, 0.35)",
                      backgroundColor: isActive ? "rgba(6, 78, 59, 0.5)" : "rgba(30, 41, 59, 0.6)",
                      boxShadow: isActive ? "0 0 14px rgba(16, 185, 129, 0.5)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {catImg ? (
                      <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "18px" }}>{cat.icon || "🏷️"}</span>
                    )}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 700, color: isActive ? "#34d399" : "#94a3b8", whiteSpace: "nowrap" }}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
          {/* Mobile Cinematic Glass Promo Slider (Rotating 4 Discounted Products) */}
          <div className="model2-mobile-promo">
            <div
              onTouchStart={onBannerTouchStart}
              onTouchEnd={onBannerTouchEnd}
              style={{
                background: "linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderRadius: "20px",
                padding: "16px 14px 12px",
                color: "#ffffff",
                border: "1px solid rgba(16, 185, 129, 0.35)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
                position: "relative",
                overflow: "hidden",
                minHeight: "165px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                {/* Left Text & CTA */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#34d399", letterSpacing: "0.5px" }}>
                      ✨ এক্সক্লুসিভ কালেকশন
                    </span>
                    {slideDiscountPct > 0 && (
                      <span style={{ fontSize: "9px", fontWeight: 800, backgroundColor: "rgba(225, 29, 72, 0.25)", color: "#fda4af", border: "1px solid rgba(225, 29, 72, 0.4)", padding: "1px 5px", borderRadius: "5px" }}>
                        -{slideDiscountPct}% ছাড়
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 800, color: "#f8fafc", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {currentSlideProd?.name}
                  </h3>

                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "10px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 900, color: "#fef08a" }}>
                      {formatPrice(slideCurrentPrice, "bn")}
                    </span>
                    {slideOldPrice && (
                      <span style={{ fontSize: "11px", color: "#64748b", textDecoration: "line-through" }}>
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
                      background: "linear-gradient(135deg, #059669, #0d9488)",
                      color: "#ffffff",
                      padding: "6px 16px",
                      borderRadius: "20px",
                      fontWeight: 800,
                      fontSize: "11px",
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
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
                    backgroundColor: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
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
                    <span style={{ fontSize: "36px" }}>✨</span>
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
                      backgroundColor: activeSlide === idx ? "#34d399" : "rgba(148, 163, 184, 0.4)",
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

          {/* Panoramic Widescreen Hero Slider (Desktop Only) */}
          <div id="offers" className="desktop-only-hero" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
            <HeroSlider
              products={products.slice(0, 5)}
              heroSlides={heroSlides}
              variant="cinematic"
              eyebrow="★ সিনেমাটিক ক্যানভাস এক্সক্লুসিভ"
              defaultTitle="প্রান্ত-থেকে-প্রান্ত সর্বোচ্চ ভিউতে কেনাকাটার সেরা অভিজ্ঞতা"
              defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
              shopButtonText="অর্ডার করুন"
            />
          </div>

          {/* Flash Deals Section (All Versions: Mobile & Desktop) */}
          {flashProducts.length > 0 && (
            <section
              style={{
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderRadius: "16px",
                border: "1px solid rgba(225, 29, 72, 0.35)",
                padding: "20px clamp(12px, 2vw, 24px)",
                boxShadow: "0 8px 32px rgba(225, 29, 72, 0.12), 0 4px 16px rgba(0, 0, 0, 0.4)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#fda4af", letterSpacing: "0.3px" }}>
                      আজকের মেগা ফ্ল্যাশ সেল (সীমিত সময়)
                    </h3>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>স্টক শেষ হওয়ার আগেই লুফে নিন</span>
                  </div>
                </div>

                {/* Countdown Timer */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>অফার শেষ হতে বাকি:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ backgroundColor: "#e11d48", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.hours).padStart(2, "0")}h
                    </span>
                    <span style={{ fontWeight: 800, color: "#fda4af" }}>:</span>
                    <span style={{ backgroundColor: "#e11d48", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.minutes).padStart(2, "0")}m
                    </span>
                    <span style={{ fontWeight: 800, color: "#fda4af" }}>:</span>
                    <span style={{ backgroundColor: "#e11d48", color: "#ffffff", padding: "4px 8px", borderRadius: "6px", fontWeight: 900, fontSize: "13px" }}>
                      {String(timeLeft.seconds).padStart(2, "0")}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Flash Products Fluid Grid (2 columns on mobile, 5-6 columns on desktop) */}
              <div className="model-product-grid">
                {flashProducts.map((p) => (
                  <DarkCinematicCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Interactive Filter Strip with Search (Desktop Only) */}
          <div
            id="shop"
            className="desktop-only-filter"
            style={{
              backgroundColor: "#1e293b",
              borderRadius: "16px",
              padding: "18px 24px",
              border: "1px solid #334155",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#f8fafc" }}>
                {activeCategory === "all" ? "সিনেমাটিক ক্যাটালগ" : categories.find((c) => c.slug === activeCategory)?.name || "ক্যাটাগরি"}
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                উপলব্ধ পণ্য: <strong>{filteredProducts.length}টি</strong>
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ minWidth: "260px" }}>
              <input
                type="text"
                placeholder="পণ্য বা মডেল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid #475569",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Mobile Cinematic Catalog Header (Visible on Mobile only) */}
          <div className="model2-mobile-catalog-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px", padding: "0 2px" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#f8fafc", letterSpacing: "0.3px" }}>
                {activeCategory === "all" ? "সিনেমাটিক ক্যাটালগ" : categories.find((c) => c.slug === activeCategory)?.name || "ক্যাটাগরি"}
              </h2>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                উপলব্ধ পণ্য: <strong style={{ color: "#34d399" }}>{filteredProducts.length}টি</strong>
              </span>
            </div>
          </div>

          {/* 6 to 7 Columns Ultra-Wide Product Matrix (2 cols on mobile) */}
          {filteredProducts.length > 0 ? (
            <div className="model-product-grid">
              {filteredProducts.map((p) => (
                <DarkCinematicCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>📦</span>
              <strong style={{ fontSize: "16px", color: "#f8fafc" }}>কোনো পণ্য পাওয়া যায়নি</strong>
              <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>ফিল্টার রিসেট করতে ক্লিক করুন।</p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory("all");
                  setSearchQuery("");
                }}
                style={{
                  padding: "8px 20px",
                  backgroundColor: "#0284c7",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                সব পণ্য দেখুন
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
