"use client";

import React, { useState, useEffect } from "react";
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

export function Model1MegaMarketplace({
  products,
  categories,
  heroSlides,
  reviews,
  discountedProducts,
}: ModelProps) {
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("all");
  const [timeLeft, setTimeLeft] = useState({ hours: 8, minutes: 45, seconds: 20 });

  // Countdown timer simulation for Flash Deals
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

  const flashProducts = discountedProducts.slice(0, 4);

  return (
    <div className="model1-wrapper" style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Marketplace Ribbon */}
      <div style={{ backgroundColor: "#173f35", color: "#ffffff", padding: "8px 0", fontSize: "0.85rem", borderBottom: "1px solid rgba(201,164,92,0.3)" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#c9a45c", fontWeight: 700 }}>
              ★ মেগা মার্কেটপ্লেস
            </span>
            <span style={{ color: "#cbd5e1" }}>|</span>
            <span>ফার্নিচার, পোশাক, জুতা, ঘড়ি সহ সকল ডিপার্টমেন্টে স্পেশাল ছাড়!</span>
          </div>
          <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
            <span style={{ color: "#fef08a" }}>🔥 ফ্রি ডেলিভারি অফার চলছে</span>
            <a href="tel:01302111188" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>📞 01302 111188</a>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: "16px 0 32px" }}>
        {/* Main Section: Left Category Sidebar + Right Hero Carousel */}
        <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: "20px", alignItems: "start" }} className="model1-hero-grid">
          {/* Left Sticky Mega Category Menu (Desktop) */}
          <aside
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
            className="model1-sidebar"
          >
            <div
              style={{
                backgroundColor: "#173f35",
                color: "#ffffff",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontWeight: 700,
                fontSize: "1rem",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                সকল ক্যাটাগরি
              </span>
              <span style={{ fontSize: "0.78rem", backgroundColor: "#c9a45c", color: "#173f35", padding: "2px 8px", borderRadius: "10px", fontWeight: 800 }}>
                {categories.length}টি
              </span>
            </div>

            <nav style={{ padding: "6px 0" }}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategorySlug("all");
                  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  backgroundColor: activeCategorySlug === "all" ? "#f0fdf4" : "transparent",
                  color: activeCategorySlug === "all" ? "#047857" : "#334155",
                  fontWeight: activeCategorySlug === "all" ? 700 : 500,
                  fontSize: "0.93rem",
                  border: "none",
                  borderLeft: activeCategorySlug === "all" ? "4px solid #10b981" : "4px solid transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span>🌟</span>
                  <span>সকল পণ্য (All Products)</span>
                </span>
                <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>→</span>
              </button>

              {categories.map((cat) => {
                const isActive = activeCategorySlug === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => {
                      setActiveCategorySlug(cat.slug);
                      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "11px 18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: isActive ? "#f0fdf4" : "transparent",
                      color: isActive ? "#047857" : "#334155",
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.93rem",
                      border: "none",
                      borderLeft: isActive ? "4px solid #10b981" : "4px solid transparent",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span>{cat.icon || "📦"}</span>
                      <span>{cat.name}</span>
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {cat.badge && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            backgroundColor: "#fef3c7",
                            color: "#d97706",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontWeight: 700,
                          }}
                        >
                          {cat.badge}
                        </span>
                      )}
                      <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>→</span>
                    </div>
                  </button>
                );
              })}
            </nav>

            <div style={{ padding: "14px 18px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                🔒 ১০০% নিরাপদ পেমেন্ট ও ক্যাশ অন ডেলিভারি
              </span>
            </div>
          </aside>

          {/* Right Hero Banner Slider */}
          <div style={{ minWidth: 0 }}>
            <HeroSlider
              products={products.slice(0, 5)}
              heroSlides={heroSlides}
              eyebrow="★ আলোর ছোঁয়া মেগা ডিলস"
              defaultTitle="আপনার বাড়ি ও লাইফস্টাইলের সেরা পণ্য"
              defaultLede="আকর্ষণীয় ফার্নিচার, এক্সক্লুসিভ থ্রি-পিস, লেদার জুতা এবং প্রিমিয়াম ঘড়িতে বিশেষ মূল্যছাড়।"
              shopButtonText="এখনই কিনুন"
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* Flash Sale Section with Countdown Timer                       */}
        {/* ============================================================== */}
        {flashProducts.length > 0 && (
          <div
            style={{
              marginTop: "32px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "22px 24px",
              border: "1px solid #fecdd3",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "14px", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "1.5rem" }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#9f1239", fontWeight: 800 }}>
                    আজকের ফ্ল্যাশ ডিল (Flash Deals)
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "#64748b" }}>সীমিত সময়ের জন্য বিশেষ মূল্যছাড়</span>
                </div>
              </div>

              {/* Countdown clock */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>সময় বাকি:</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <span style={{ backgroundColor: "#9f1239", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "0.9rem" }}>
                    {String(timeLeft.hours).padStart(2, "0")}
                  </span>
                  <span style={{ fontWeight: 800, color: "#9f1239" }}>:</span>
                  <span style={{ backgroundColor: "#9f1239", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "0.9rem" }}>
                    {String(timeLeft.minutes).padStart(2, "0")}
                  </span>
                  <span style={{ fontWeight: 800, color: "#9f1239" }}>:</span>
                  <span style={{ backgroundColor: "#9f1239", color: "#fff", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "0.9rem" }}>
                    {String(timeLeft.seconds).padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {flashProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Category Visual Cards Grid (Department Explorer)              */}
        {/* ============================================================== */}
        <div style={{ marginTop: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f172a", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🏬</span> টপ ক্যাটাগরি এক্সপ্লোরার
            </h2>
            <Link href="/categories" style={{ color: "#047857", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none" }}>
              সকল ক্যাটাগরি দেখুন →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: "16px" }}>
            {categories.map((cat) => {
              const bgImg = cat.image || cat.image_url || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80";
              return (
                <div
                  key={cat.slug}
                  onClick={() => {
                    setActiveCategorySlug(cat.slug);
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    position: "relative",
                    borderRadius: "14px",
                    overflow: "hidden",
                    cursor: "pointer",
                    height: "160px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                >
                  <img
                    src={bgImg}
                    alt={cat.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.72)" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      padding: "14px",
                      background: "linear-gradient(to top, rgba(15,23,42,0.85) 0%, transparent 60%)",
                      color: "#fff",
                    }}
                  >
                    {cat.badge && (
                      <span
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "#f59e0b",
                          color: "#1e293b",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          marginBottom: "6px",
                        }}
                      >
                        {cat.badge}
                      </span>
                    )}
                    <strong style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                      {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                    </strong>
                    <span style={{ fontSize: "0.8rem", color: "#e2e8f0", marginTop: "2px" }}>
                      পণ্য দেখুন →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ============================================================== */}
        {/* Full Interactive Product Catalog                              */}
        {/* ============================================================== */}
        <div id="shop" style={{ marginTop: "44px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
              🛍️ সকল পণ্যের সংগ্রহশালা
            </h2>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem" }}>
              আপনার পছন্দের ক্যাটাগরি বেছে নিন এবং সরাসরি অর্ডার করুন
            </p>
          </div>

          <ProductCatalog products={products} initialCategory={activeCategorySlug} />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .model1-hero-grid {
            grid-template-columns: 1fr !important;
          }
          .model1-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
