"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { HeroSlider } from "../HeroSlider";
import { ProductCard, ProductCatalog } from "../components";
import type { Product, HeroSlide, Review, Category } from "../types";

interface ModelProps {
  products: Product[];
  categories: Category[];
  heroSlides: HeroSlide[];
  reviews: Review[];
  discountedProducts: Product[];
}

export function Model4ResponsiveMegastore({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [quickSearch, setQuickSearch] = useState<string>("");

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeFilter !== "all") {
      list = list.filter((p) => p.category?.slug === activeFilter);
    }
    if (quickSearch.trim()) {
      const q = quickSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeFilter, quickSearch]);

  return (
    <div className="model4-wrapper" style={{ backgroundColor: "#f1f5f9", minHeight: "100vh" }}>
      {/* Top App-Like Category Stories Bar */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div className="wrap">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              overflowX: "auto",
              paddingBottom: "6px",
              scrollbarWidth: "none",
            }}
          >
            {/* All items bubble */}
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                document.getElementById("megastore-grid")?.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                border: "none",
                background: "none",
                cursor: "pointer",
                minWidth: "70px",
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "50%",
                  background: activeFilter === "all" ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "#f1f5f9",
                  border: activeFilter === "all" ? "3px solid #047857" : "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                🔥
              </div>
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: activeFilter === "all" ? 800 : 600,
                  color: activeFilter === "all" ? "#047857" : "#475569",
                }}
              >
                সব পণ্য
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = activeFilter === cat.slug;
              const catImg = cat.image || cat.image_url;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    setActiveFilter(cat.slug);
                    document.getElementById("megastore-grid")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    minWidth: "78px",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      width: "58px",
                      height: "58px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: isSelected ? "3px solid #2563eb" : "2px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8fafc",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                    }}
                  >
                    {catImg ? (
                      <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "1.6rem" }}>{cat.icon || "🛍️"}</span>
                    )}
                  </div>

                  {cat.badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-3px",
                        right: "4px",
                        backgroundColor: "#f59e0b",
                        color: "#0f172a",
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: "8px",
                      }}
                    >
                      {cat.badge}
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? "#2563eb" : "#475569",
                      textAlign: "center",
                      maxWidth: "80px",
                      lineHeight: "1.2",
                    }}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Hero Slider */}
      <div className="wrap" style={{ padding: "20px 0 10px" }}>
        <HeroSlider
          products={products.slice(0, 5)}
          heroSlides={heroSlides}
          eyebrow="★ আলোর ছোঁয়া মেগাস্টোর এক্সক্লুসিভ"
          defaultTitle="সরাসরি কেনাকাটায় দারুণ ছাড় ও উপহার"
          defaultLede="ফার্নিচার, পোশাক, থ্রি-পিস, জুতা, ঘড়ি ও লাইফস্টাইল পণ্য।"
          shopButtonText="এখনই কিনুন"
        />
      </div>

      <div className="wrap" style={{ paddingBottom: "48px" }}>
        {/* ============================================================== */}
        {/* High-Energy Interactive Category Filter Bar                    */}
        {/* ============================================================== */}
        <div
          id="megastore-grid"
          style={{
            marginTop: "28px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚡</span> ইনস্ট্যান্ট ক্যাটাগরি ফিল্টার
              </h2>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                পণ্য প্রদর্শিত হচ্ছে: <strong>{filteredProducts.length}টি</strong>
              </span>
            </div>

            {/* Quick Search Input */}
            <div style={{ position: "relative", minWidth: "240px" }}>
              <input
                type="text"
                placeholder="নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px 9px 36px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                🔍
              </span>
              {quickSearch && (
                <button
                  type="button"
                  onClick={() => setQuickSearch("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Chips (Pills) */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: activeFilter === "all" ? "#047857" : "#e2e8f0",
                backgroundColor: activeFilter === "all" ? "#10b981" : "#f8fafc",
                color: activeFilter === "all" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.88rem",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              🌟 সব ({products.length})
            </button>

            {categories.map((cat) => {
              const isSelected = activeFilter === cat.slug;
              const count = products.filter((p) => p.category?.slug === cat.slug).length;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveFilter(cat.slug)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: isSelected ? "#047857" : "#e2e8f0",
                    backgroundColor: isSelected ? "#10b981" : "#f8fafc",
                    color: isSelected ? "#ffffff" : "#475569",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span>{cat.icon || "🏷️"}</span>
                  <span>{cat.name}</span>
                  {count > 0 && <span style={{ opacity: 0.8, fontSize: "0.78rem" }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Filtered Product Grid */}
          {filteredProducts.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "20px" }}>
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "48px 16px", color: "#64748b" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>📦</span>
              <strong style={{ fontSize: "1.1rem", color: "#0f172a", display: "block", marginBottom: "6px" }}>
                কোনো পণ্য খুঁজে পাওয়া যায়নি
              </strong>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                অনুগ্রহ করে অন্য কোনো ক্যাটাগরি বেছে নিন অথবা ফিল্টার রিসেট করুন।
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
                  setQuickSearch("");
                }}
                style={{
                  marginTop: "16px",
                  padding: "8px 20px",
                  backgroundColor: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
