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

export function Model6MegaGridDrawer({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeFilter !== "all") {
      list = list.filter((p) => p.category?.slug === activeFilter);
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
  }, [products, activeFilter, searchQuery]);

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", width: "100%", position: "relative" }}>
      {/* 1. Edge-to-Edge Panoramic Hero Banner */}
      <div style={{ padding: "16px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <HeroSlider
            products={products.slice(0, 5)}
            heroSlides={heroSlides}
            eyebrow="★ হাই-ডেনসিটি মেগা গ্রিড কালেকশন"
            defaultTitle="সবচেয়ে দ্রুত সময়ে খুঁজে নিন আপনার পছন্দের সেরা পণ্য"
            defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
            shopButtonText="অর্ডার করুন"
          />
        </div>
      </div>

      {/* 2. Top Sticky Command Bar with Category Chips & Search */}
      <div
        style={{
          position: "sticky",
          top: "60px",
          zIndex: 30,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          padding: "12px clamp(16px, 2.5vw, 40px)",
          boxSizing: "border-box",
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "16px",
        }}
      >
        {/* Category Filter Chips */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", scrollbarWidth: "none", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            style={{
              padding: "7px 16px",
              borderRadius: "20px",
              border: "none",
              backgroundColor: activeFilter === "all" ? "#173f35" : "#f1f5f9",
              color: activeFilter === "all" ? "#ffffff" : "#475569",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            🔥 সকল পণ্য ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = activeFilter === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setActiveFilter(cat.slug)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "20px",
                  border: isSelected ? "1px solid #10b981" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                  color: isSelected ? "#047857" : "#475569",
                  fontWeight: 700,
                  fontSize: "12px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{cat.icon || "🏷️"}</span>
                <span>{cat.name}</span>
                {cat.badge && (
                  <span style={{ fontSize: "9px", backgroundColor: "#fef3c7", color: "#b45309", padding: "1px 5px", borderRadius: "4px", fontWeight: 800 }}>
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Search & Drawer Toggle Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="text"
            placeholder="সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "12px",
              outline: "none",
              minWidth: "180px",
            }}
          />

          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: drawerOpen ? "#ef4444" : "#10b981",
              color: "#ffffff",
              padding: "7px 16px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(16,185,129,0.25)",
            }}
          >
            <span>{drawerOpen ? "✕ বন্ধ করুন" : "🛒 কুইক ড্রয়ার"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main 6 to 7 Column Fluid Edge-to-Edge Grid */}
      <div style={{ padding: "24px clamp(16px, 2.5vw, 40px) 48px", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      {/* 4. Slide-Out Quick Cart & Offers Side Drawer */}
      {drawerOpen && (
        <aside
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            bottom: 0,
            width: "360px",
            backgroundColor: "#ffffff",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
            zIndex: 60,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e2e8f0",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              padding: "18px 20px",
              backgroundColor: "#173f35",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, fontSize: "16px" }}>
              <span>🛒</span>
              <span>কুইক কার্ট ও অর্ডার হেল্প</span>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              style={{ background: "none", border: "none", color: "#ffffff", fontSize: "18px", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: "20px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ backgroundColor: "#f0fdf4", padding: "14px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              <strong style={{ color: "#047857", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                ⚡ বিশেষ অফার চলছে
              </strong>
              <p style={{ margin: 0, fontSize: "12px", color: "#334155" }}>
                যে কোনো পণ্য অর্ডার করলেই ক্যাশ অন ডেলিভারি এবং ফ্রি ডেলিভারির সুবিধা উপভোগ করুন!
              </p>
            </div>

            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                জনপ্রিয় দ্রুত ক্যাটাগরি
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                {categories.slice(0, 5).map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      setActiveFilter(c.slug);
                      setDrawerOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#f8fafc",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span>{c.icon || "🏷️"} {c.name}</span>
                    <span style={{ color: "#10b981" }}>দেখুন →</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "auto", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>জরুরি প্রয়োজনে ফোন করুন:</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#0f172a", marginTop: "2px" }}>01302 111188</div>
              <a
                href="/cart"
                style={{
                  display: "block",
                  textAlign: "center",
                  marginTop: "12px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  padding: "10px",
                  borderRadius: "8px",
                  fontWeight: 800,
                  fontSize: "13px",
                  textDecoration: "none",
                }}
              >
                কার্ট ও চেকআউট পেজে যান
              </a>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
