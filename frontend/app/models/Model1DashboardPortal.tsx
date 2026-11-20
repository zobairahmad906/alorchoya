"use client";

import React, { useState, useEffect, useMemo } from "react";
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

export function Model1DashboardPortal({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
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
      <div
        style={{
          backgroundColor: "#173f35",
          color: "#ffffff",
          padding: "10px 24px",
          fontSize: "13px",
          borderBottom: "1px solid rgba(201,164,92,0.3)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <span style={{ color: "#c9a45c", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "6px" }}>
            🖥️ ফুল-স্ক্রিন পোর্টাল
          </span>
          <span style={{ color: "#94a3b8" }}>|</span>
          <span>ফার্নিচার, পোশাক, জুতো, ঘড়ি ও হোম ডেকরে বিশেষ মেগা অফার চলছে!</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <span style={{ color: "#fef08a", fontWeight: 700 }}>⚡ ফ্রি ক্যাশ অন ডেলিভারি</span>
          <a href="tel:01302111188" style={{ color: "#ffffff", textDecoration: "none", fontWeight: 700 }}>
            📞 01302 111188
          </a>
        </div>
      </div>

      {/* Main Full-Screen Body: Persistent Left Sidebar + Fluid Right Canvas */}
      <div
        style={{
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
          padding: "16px clamp(12px, 1.8vw, 32px)",
          gap: "24px",
          alignItems: "flex-start",
        }}
      >
        {/* Persistent Left Category Sidebar (Like Admin Dashboard Sidebar) */}
        <aside
          id="categories"
          style={{
            width: "280px",
            minWidth: "260px",
            flexShrink: 0,
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            overflow: "hidden",
            position: "sticky",
            top: "80px",
          }}
        >
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
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Panoramic Widescreen Hero Banner */}
          <div style={{ borderRadius: "16px", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
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

          {/* Flash Deals Edge-to-Edge Strip */}
          {flashProducts.length > 0 && (
            <section
              id="offers"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #fecdd3",
                padding: "20px 24px",
                boxShadow: "0 2px 12px rgba(225,29,72,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px" }}>⚡</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: "#be123c" }}>
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

              {/* Flash Products Fluid Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "16px" }}>
                {flashProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Main Product Catalog Section: 5-6 Columns High-Density Grid */}
          <section
            id="shop"
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              padding: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#0f172a" }}>
                  {activeCategorySlug === "all" ? "সকল পণ্য ক্যাটালগ" : categories.find((c) => c.slug === activeCategorySlug)?.name || "ক্যাটাগরি পণ্য"}
                </h3>
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  প্রদর্শিত হচ্ছে: <strong>{filteredProducts.length}টি পণ্য</strong>
                </span>
              </div>

              {/* Category Filter Pills on Top of Grid */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

            {/* High-Density Responsive Fluid Grid (5-6 Columns on Widescreen) */}
            {filteredProducts.length > 0 ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "20px",
                }}
              >
                {filteredProducts.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
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
