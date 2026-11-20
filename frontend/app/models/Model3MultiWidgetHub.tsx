"use client";

import React, { useState, useEffect } from "react";
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

export function Model3MultiWidgetHub({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [dealTime, setDealTime] = useState({ hours: 14, minutes: 22, seconds: 40 });

  useEffect(() => {
    const timer = setInterval(() => {
      setDealTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const flashDeals = discountedProducts.slice(0, 4);

  // Group products into departments
  const furnitureProducts = products.filter(
    (p) => p.category?.slug.includes("furniture") || p.name.includes("শেলফ") || p.name.includes("টেবিল") || p.name.includes("সোফা")
  ).slice(0, 4);

  const fashionProducts = products.filter(
    (p) => p.category?.slug.includes("three") || p.category?.slug.includes("cloth") || p.name.includes("থ্রি") || p.name.includes("শাড়ি")
  ).slice(0, 4);

  const lifestyleProducts = products.filter(
    (p) => p.category?.slug.includes("shoe") || p.category?.slug.includes("watch") || p.name.includes("ঘড়ি") || p.name.includes("জুতো")
  ).slice(0, 4);

  const catalogProducts = selectedCat === "all" ? products : products.filter((p) => p.category?.slug === selectedCat);

  return (
    <div style={{ backgroundColor: "#f1f5f9", minHeight: "100vh", width: "100%", paddingBottom: "48px" }}>
      {/* 1. Edge-to-Edge Hero + Quick Stats Ribbon */}
      <div style={{ padding: "16px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div style={{ borderRadius: "18px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <HeroSlider
            products={products.slice(0, 5)}
            heroSlides={heroSlides}
            eyebrow="★ ড্যাশবোর্ড মাল্টি-উইজেট হাব"
            defaultTitle="প্রতিটি ডিপার্টমেন্টে সাজানো চমৎকার কালেকশন"
            defaultLede="ফার্নিচার, পোশাক, জুতো, ঘড়ি ও লাইফস্টাইল পণ্য।"
            shopButtonText="অর্ডার করুন"
          />
        </div>
      </div>

      {/* 2. Top Edge-to-Edge Department Stories Bar */}
      <div style={{ padding: "18px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCat("all")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderRadius: "12px",
              border: "none",
              backgroundColor: selectedCat === "all" ? "#173f35" : "#f8fafc",
              color: selectedCat === "all" ? "#ffffff" : "#334155",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>🔥</span>
            <span>সকল ডিপার্টমেন্ট ({products.length})</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCat === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => setSelectedCat(cat.slug)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 18px",
                  borderRadius: "12px",
                  border: isSelected ? "1px solid #10b981" : "1px solid #e2e8f0",
                  backgroundColor: isSelected ? "#f0fdf4" : "#ffffff",
                  color: isSelected ? "#047857" : "#475569",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{cat.icon || "🛍️"}</span>
                <span>{cat.name}</span>
                {cat.badge && (
                  <span style={{ fontSize: "10px", fontWeight: 800, backgroundColor: "#fef3c7", color: "#b45309", padding: "1px 6px", borderRadius: "6px" }}>
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Multi-Widget Edge-to-Edge Grid (Inspired by Dashboard Cards) */}
      <div
        style={{
          padding: "24px clamp(16px, 2.5vw, 40px) 0",
          boxSizing: "border-box",
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: "24px",
        }}
      >
        {/* Widget 1: Flash Deals & Live Countdown Card */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #fecdd3",
            boxShadow: "0 4px 16px rgba(225,29,72,0.05)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>⚡</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#be123c" }}>
                আজকের ফ্ল্যাশ সেল
              </h3>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              <span style={{ backgroundColor: "#be123c", color: "#fff", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
                {String(dealTime.hours).padStart(2, "0")}h
              </span>
              <span style={{ backgroundColor: "#be123c", color: "#fff", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
                {String(dealTime.minutes).padStart(2, "0")}m
              </span>
              <span style={{ backgroundColor: "#be123c", color: "#fff", padding: "3px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: 800 }}>
                {String(dealTime.seconds).padStart(2, "0")}s
              </span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", flex: 1 }}>
            {(flashDeals.length > 0 ? flashDeals : products.slice(0, 4)).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Widget 2: Furniture Lounge & Living Room Decor */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>🛋️</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#173f35" }}>
                ফার্নিচার ও হোম ডেকর লাউঞ্জ
              </h3>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#fef3c7", color: "#b45309", padding: "3px 8px", borderRadius: "8px" }}>
              ফ্যাক্টরি প্রাইস
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", flex: 1 }}>
            {(furnitureProducts.length > 0 ? furnitureProducts : products.slice(4, 8)).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* Widget 3: Fashion & Three-Piece Corner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "24px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>👗</span>
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#831843" }}>
                পোশাক ও থ্রি পিস এক্সক্লুসিভ
              </h3>
            </div>
            <span style={{ fontSize: "11px", fontWeight: 800, backgroundColor: "#fce7f3", color: "#9d174d", padding: "3px 8px", borderRadius: "8px" }}>
              প্রিমিয়াম কোয়ালিটি
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", flex: 1 }}>
            {(fashionProducts.length > 0 ? fashionProducts : products.slice(2, 6)).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* 4. Full Widescreen Product Catalog (6 Columns Edge-to-Edge) */}
      <div style={{ padding: "28px clamp(16px, 2.5vw, 40px) 0", boxSizing: "border-box", width: "100%" }}>
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "28px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#0f172a" }}>
                {selectedCat === "all" ? "সকল পণ্য ক্যাটালগ" : categories.find((c) => c.slug === selectedCat)?.name || "ক্যাটাগরি পণ্য"}
              </h2>
              <span style={{ fontSize: "13px", color: "#64748b" }}>
                পণ্য প্রদর্শিত হচ্ছে: <strong>{catalogProducts.length}টি</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCat("all")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              রিসেট ফিল্টার
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
              gap: "20px",
            }}
          >
            {catalogProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
