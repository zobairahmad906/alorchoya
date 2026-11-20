"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { HeroSlider } from "../HeroSlider";
import { ProductCard } from "../components";
import type { Product, HeroSlide, Review, Category } from "../types";

interface ModelProps {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  reviews: Review[];
  discountedProducts: Product[];
}

export function Model4MicroDockCanvas({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dockExpanded, setDockExpanded] = useState<boolean>(false);
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
      {/* Edge-to-Edge Container with Left Floating Micro-Dock */}
      <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
        {/* Left Floating Micro-Dock (Mac / Linear Style) */}
        <aside
          id="categories"
          onMouseEnter={() => setDockExpanded(true)}
          onMouseLeave={() => setDockExpanded(false)}
          style={{
            width: dockExpanded ? "240px" : "72px",
            transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            backgroundColor: "#1e293b",
            borderRight: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
            alignItems: dockExpanded ? "stretch" : "center",
            padding: "16px 10px",
            gap: "10px",
            position: "sticky",
            top: 0,
            height: "100vh",
            zIndex: 40,
            overflowY: "auto",
            overflowX: "hidden",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
        >
          {/* Dock Brand Icon */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              borderRadius: "12px",
              backgroundColor: "#0f172a",
              border: "1px solid #334155",
              cursor: "pointer",
              marginBottom: "8px",
            }}
            onClick={() => setActiveCategory("all")}
          >
            <span style={{ fontSize: "20px" }}>🌟</span>
            {dockExpanded && <span style={{ fontWeight: 800, fontSize: "14px", color: "#38bdf8", whiteSpace: "nowrap" }}>আলোর ছোঁয়া</span>}
          </div>

          {/* All Collection Button */}
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px",
              borderRadius: "10px",
              border: "none",
              backgroundColor: activeCategory === "all" ? "#0284c7" : "transparent",
              color: "#ffffff",
              cursor: "pointer",
              width: "100%",
              justifyContent: dockExpanded ? "flex-start" : "center",
              transition: "all 0.15s ease",
            }}
            title="সব কালেকশন"
          >
            <span style={{ fontSize: "18px" }}>🔥</span>
            {dockExpanded && <span style={{ fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap" }}>সব পণ্য ({products.length})</span>}
          </button>

          {/* Category Icons in Dock */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: isActive ? "#0284c7" : "transparent",
                  color: isActive ? "#ffffff" : "#94a3b8",
                  cursor: "pointer",
                  width: "100%",
                  justifyContent: dockExpanded ? "flex-start" : "center",
                  transition: "all 0.15s ease",
                }}
                title={cat.name}
              >
                <span style={{ fontSize: "18px" }}>{cat.icon || "🏷️"}</span>
                {dockExpanded && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cat.name}
                    </span>
                    {cat.badge && (
                      <span style={{ fontSize: "10px", backgroundColor: "#f59e0b", color: "#000", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                        {cat.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </aside>

        {/* 95% Expansive Main Canvas */}
        <main
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
          {/* Panoramic Widescreen Hero Slider */}
          <div id="offers" style={{ borderRadius: "20px", overflow: "hidden", border: "1px solid #1e293b", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
            <HeroSlider
              products={products.slice(0, 5)}
              heroSlides={heroSlides}
              eyebrow="★ সিনেমাটিক ক্যানভাস এক্সক্লুসিভ"
              defaultTitle="প্রান্ত-থেকে-প্রান্ত সর্বোচ্চ ভিউতে কেনাকাটার সেরা অভিজ্ঞতা"
              defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
              shopButtonText="অর্ডার করুন"
            />
          </div>

          {/* Interactive Filter Strip with Search */}
          <div
            id="shop"
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

          {/* 6 to 7 Columns Ultra-Wide Product Matrix */}
          {filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredProducts.map((p) => (
                <div key={p.id} style={{ backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
                  <ProductCard product={p} />
                </div>
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
