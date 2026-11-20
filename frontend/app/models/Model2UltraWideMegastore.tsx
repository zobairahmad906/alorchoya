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

export function Model2UltraWideMegastore({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");
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
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", width: "100%" }}>
      {/* 1. Full-Width Edge-to-Edge Circular Category Stories Bar */}
      <section
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px clamp(16px, 2.5vw, 40px)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            overflowX: "auto",
            scrollbarWidth: "none",
            paddingBottom: "4px",
          }}
        >
          {/* All products story bubble */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter("all");
              document.getElementById("megastore-catalog")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              border: "none",
              background: "none",
              cursor: "pointer",
              minWidth: "76px",
            }}
          >
            <div
              style={{
                width: "66px",
                height: "66px",
                borderRadius: "50%",
                background: activeFilter === "all" ? "linear-gradient(135deg, #059669 0%, #10b981 100%)" : "#f1f5f9",
                border: activeFilter === "all" ? "3px solid #047857" : "2px solid #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.7rem",
                boxShadow: "0 3px 8px rgba(0,0,0,0.08)",
                transition: "all 0.2s ease",
              }}
            >
              🔥
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: activeFilter === "all" ? 800 : 600,
                color: activeFilter === "all" ? "#047857" : "#334155",
              }}
            >
              সব অফার
            </span>
          </button>

          {/* Individual Category Stories */}
          {categories.map((cat) => {
            const isSelected = activeFilter === cat.slug;
            const catImg = cat.image || cat.image_url;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setActiveFilter(cat.slug);
                  document.getElementById("megastore-catalog")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  minWidth: "82px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "66px",
                    height: "66px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: isSelected ? "3px solid #2563eb" : "2px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#f8fafc",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {catImg ? (
                    <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "1.7rem" }}>{cat.icon || "🛍️"}</span>
                  )}
                </div>

                {cat.badge && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "6px",
                      backgroundColor: "#f59e0b",
                      color: "#0f172a",
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {cat.badge}
                  </span>
                )}

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? "#2563eb" : "#334155",
                    textAlign: "center",
                    maxWidth: "84px",
                    lineHeight: "1.2",
                  }}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Edge-to-Edge Cinema Widescreen Hero Banner */}
      <div style={{ padding: "16px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <HeroSlider
            products={products.slice(0, 5)}
            heroSlides={heroSlides}
            eyebrow="★ আল্ট্রা-ওয়াইড মেগাস্টোর কালেকশন"
            defaultTitle="হাজারো প্রডাক্টের বিশাল সমাহার এক ঠিকানায়"
            defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও হোম ডেকরে এক্সক্লুসিভ অফার।"
            shopButtonText="শপ করুন"
          />
        </div>
      </div>

      {/* 3. Trust Highlights Ribbon */}
      <div style={{ padding: "20px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            backgroundColor: "#ffffff",
            padding: "16px 24px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🚚</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>সারা দেশে দ্রুত ডেলিভারি</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>ক্যাশ অন ডেলিভারি সুবিধা সহ</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>✨</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>১০০% অরিজিনাল পণ্য</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>সরাসরি প্রস্তুতকারক থেকে সংগৃহীত</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>🔄</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>সহজ রিটার্ন পলিসি</div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>কোনো ঝামেলা ছাড়াই পরিবর্তন করুন</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "24px" }}>📞</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>২৪/৭ কাস্টমার হেল্পলাইন</div>
              <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>01302 111188</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main 6-Column Edge-to-Edge Product Grid */}
      <div id="megastore-catalog" style={{ padding: "24px clamp(16px, 2.5vw, 40px) 48px", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          {/* Header & Instant Search */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>🛍️</span>
                <span>আল্ট্রা-ওয়াইড মেগাস্টোর ক্যাটালগ</span>
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                মোট পণ্য: <strong>{filteredProducts.length}টি</strong>
              </span>
            </div>

            {/* Quick Search */}
            <div style={{ minWidth: "260px" }}>
              <input
                type="text"
                placeholder="নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 14px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                padding: "8px 18px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: activeFilter === "all" ? "#047857" : "#e2e8f0",
                backgroundColor: activeFilter === "all" ? "#10b981" : "#f8fafc",
                color: activeFilter === "all" ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              🌟 সব কালেকশন ({products.length})
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
                    fontSize: "13px",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>{cat.icon || "🏷️"}</span>
                  <span>{cat.name}</span>
                  {count > 0 && <span style={{ opacity: 0.8, fontSize: "11px" }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* 6-Column Fluid Edge-to-Edge Product Grid */}
          {filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredProducts.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 16px", color: "#64748b" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>📦</span>
              <strong style={{ fontSize: "16px", color: "#0f172a" }}>কোনো পণ্য পাওয়া যায়নি</strong>
              <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>অন্য ক্যাটাগরি বেছে নিন অথবা ফিল্টার রিসেট করুন।</p>
              <button
                type="button"
                onClick={() => {
                  setActiveFilter("all");
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
                ফিল্টার রিসেট করুন
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
