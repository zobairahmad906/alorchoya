"use client";

import React, { useState, useMemo } from "react";
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

  const handleOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    add(product, false);
    window.location.href = "/checkout";
  };

  return (
    <article
      style={{
        background: "linear-gradient(145deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.9))",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderRadius: "18px",
        border: "1px solid rgba(16, 185, 129, 0.28)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
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
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#070d18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {image ? (
          <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "32px" }}>📦</span>
        )}
      </div>

      <div style={{ marginTop: "10px", textAlign: "center" }}>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 900,
            color: "#fef08a",
            letterSpacing: "0.5px",
            marginBottom: "8px",
          }}
        >
          {formatPrice(currentPrice, "bn")}
        </div>

        <button
          type="button"
          onClick={handleOrderNow}
          style={{
            width: "100%",
            padding: "8px 14px",
            borderRadius: "20px",
            border: "1px solid rgba(16, 185, 129, 0.7)",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 0 10px rgba(16, 185, 129, 0.25)",
            transition: "all 0.15s ease",
          }}
        >
          অর্ডার করুন
        </button>
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
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

              <Link href="/cart" style={{ width: "34px", height: "34px", borderRadius: "50%", backgroundColor: "rgba(6, 78, 59, 0.6)", border: "1px solid rgba(16, 185, 129, 0.5)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: "15px", position: "relative" }}>
                🛒
                <span style={{ position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#f59e0b" }}></span>
              </Link>
            </div>
          </div>

          {/* Mobile Swipeable Horizontal Categories Strip (Exact to dark reference) */}
          <div className="model2-mobile-chips">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
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
                  onClick={() => setActiveCategory(cat.slug)}
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
          {/* Mobile Cinematic Glass Promo (Exact to reference image) */}
          <div className="model2-mobile-promo">
            <div style={{
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.75), rgba(15, 23, 42, 0.95))",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderRadius: "20px",
              padding: "24px 16px",
              textAlign: "center",
              color: "#ffffff",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "relative", zIndex: 2 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: "19px", fontWeight: 900, color: "#f8fafc", letterSpacing: "0.5px" }}>
                  এক্সক্লুসিভ কালেকশন
                </h3>
                <a
                  href="#shop"
                  style={{
                    display: "inline-block",
                    background: "linear-gradient(135deg, #059669, #0d9488)",
                    color: "#ffffff",
                    padding: "8px 24px",
                    borderRadius: "24px",
                    fontWeight: 800,
                    fontSize: "12px",
                    textDecoration: "none",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)"
                  }}
                >
                  এখনই কিনুন
                </a>
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "14px" }}>
                  <span style={{ width: "16px", height: "4px", borderRadius: "2px", backgroundColor: "#34d399" }}></span>
                  <span style={{ width: "6px", height: "4px", borderRadius: "2px", backgroundColor: "#475569" }}></span>
                  <span style={{ width: "6px", height: "4px", borderRadius: "2px", backgroundColor: "#475569" }}></span>
                </div>
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
