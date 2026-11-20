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

export function Model3SplitCanvasStudio({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<"default" | "low" | "high">("default");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProducts = useMemo(() => {
    let list = products;
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category?.slug === selectedCategory);
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
    if (priceSort === "low") {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (priceSort === "high") {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    }
    return list;
  }, [products, selectedCategory, searchQuery, priceSort]);

  return (
    <div style={{ backgroundColor: "#fafaf9", minHeight: "100vh", width: "100%", paddingBottom: "48px" }}>
      {/* Top Studio Bar */}
      <div
        style={{
          backgroundColor: "#1c1917",
          color: "#ffffff",
          padding: "10px clamp(16px, 2.5vw, 40px)",
          fontSize: "13px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#c9a45c", fontWeight: 800 }}>🎨 মডার্ন লাইফস্টাইল স্টুডিও</span>
          <span style={{ color: "#78716c" }}>|</span>
          <span>ইন্টেরিয়র ফার্নিচার, প্রিমিয়াম পোশাক ও লাইফস্টাইল কালেকশন</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "#fef08a" }}>✨ ফ্যাক্টরি সরাসরি ওয়ারেন্টি</span>
          <a href="tel:01302111188" style={{ color: "#ffffff", textDecoration: "none", fontWeight: 700 }}>
            📞 01302 111188
          </a>
        </div>
      </div>

      {/* Main Edge-to-Edge 30% / 70% Split Canvas */}
      <div
        style={{
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          padding: "20px clamp(16px, 2.5vw, 40px)",
          gap: "28px",
          alignItems: "flex-start",
        }}
      >
        {/* Left 30% Fixed Sticky Studio Panel */}
        <aside
          style={{
            width: "320px",
            minWidth: "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            position: "sticky",
            top: "80px",
          }}
        >
          {/* Lookbook / Curated Studio Banner */}
          <div
            style={{
              backgroundColor: "#173f35",
              color: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
              backgroundImage: "radial-gradient(circle at top right, rgba(201,164,92,0.25), transparent)",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#c9a45c", textTransform: "uppercase", letterSpacing: "1px" }}>
              কিউরেটেড কালেকশন
            </span>
            <h3 style={{ margin: "8px 0 10px", fontSize: "20px", fontWeight: 900, lineHeight: 1.3 }}>
              ঘরের আধুনিক রূপ ও ফ্যাশনের পূর্ণাঙ্গ সমাধান
            </h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6 }}>
              আমাদের প্রতিটি পণ্য অত্যন্ত মানসম্পন্ন কাঁচামাল দিয়ে তৈরি।
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700 }}>
                ✓ ক্যাশ অন ডেলিভারি
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.1)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700 }}>
                ✓ দ্রুত শিপিং
              </div>
            </div>
          </div>

          {/* Department Filter Card */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "18px",
              padding: "20px",
              border: "1px solid #e7e5e4",
              boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
            }}
          >
            <h4 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: "#1c1917" }}>
              ডিপার্টমেন্ট ক্যাটাগরি
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: selectedCategory === "all" ? "#173f35" : "#f5f5f4",
                  color: selectedCategory === "all" ? "#ffffff" : "#44403c",
                  fontWeight: selectedCategory === "all" ? 800 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>🌟 সকল কালেকশন</span>
                <span style={{ fontSize: "11px", opacity: 0.85 }}>({products.length})</span>
              </button>

              {categories.map((cat) => {
                const isActive = selectedCategory === cat.slug;
                const count = products.filter((p) => p.category?.slug === cat.slug).length;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedCategory(cat.slug)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "none",
                      backgroundColor: isActive ? "#173f35" : "#ffffff",
                      color: isActive ? "#ffffff" : "#44403c",
                      fontWeight: isActive ? 800 : 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isActive ? "none" : "inset 0 0 0 1px #e7e5e4",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{cat.icon || "🏷️"}</span>
                      <span>{cat.name}</span>
                    </div>
                    <span style={{ fontSize: "11px", opacity: 0.75 }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right 70% Fluid Catalog Canvas */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Panoramic Widescreen Hero Slider */}
          <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <HeroSlider
              products={products.slice(0, 5)}
              heroSlides={heroSlides}
              eyebrow="★ স্প্লিট-ক্যানভাস স্টুডিও কালেকশন"
              defaultTitle="আকর্ষণীয় ডিজাইন ও নিখুঁত ফিনিশিংয়ের নিশ্চয়তা"
              defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
              shopButtonText="এখনই কিনুন"
            />
          </div>

          {/* Quick Filter & Sort Bar */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "16px 20px",
              border: "1px solid #e7e5e4",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#1c1917" }}>
                পণ্য প্রদর্শিত হচ্ছে: <strong>{filteredProducts.length}টি</strong>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              {/* Search */}
              <input
                type="text"
                placeholder="নাম দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d6d3d1",
                  fontSize: "12px",
                  outline: "none",
                }}
              />

              {/* Price Sort */}
              <select
                value={priceSort}
                onChange={(e) => setPriceSort(e.target.value as any)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #d6d3d1",
                  fontSize: "12px",
                  outline: "none",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                }}
              >
                <option value="default">সাজানো: স্বাভাবিক</option>
                <option value="low">দাম: কম থেকে বেশি</option>
                <option value="high">দাম: বেশি থেকে কম</option>
              </select>
            </div>
          </div>

          {/* 4 to 5 Column Fluid Product Grid */}
          {filteredProducts.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "20px",
              }}
            >
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div style={{ backgroundColor: "#ffffff", borderRadius: "18px", padding: "60px 20px", textAlign: "center", color: "#78716c", border: "1px solid #e7e5e4" }}>
              <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "10px" }}>📦</span>
              <strong style={{ fontSize: "16px", color: "#1c1917" }}>কোনো পণ্য পাওয়া যায়নি</strong>
              <p style={{ margin: "6px 0 16px", fontSize: "13px" }}>অনুগ্রহ করে ফিল্টার পরিবর্তন করুন।</p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                  setPriceSort("default");
                }}
                style={{
                  padding: "8px 18px",
                  backgroundColor: "#173f35",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                রিসেট করুন
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
