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

export function Model3DepartmentHub({
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

  return (
    <div className="model3-wrapper" style={{ backgroundColor: "#fafaf9", minHeight: "100vh" }}>
      {/* Top Department Story Circles (Target / Department Store Style) */}
      <section style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e7e5e4", padding: "18px 0" }}>
        <div className="wrap">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "24px",
              overflowX: "auto",
              paddingBottom: "8px",
              scrollbarWidth: "none",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCat("all");
                document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
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
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: selectedCat === "all" ? "linear-gradient(135deg, #173f35 0%, #2e6b57 100%)" : "#f5f5f4",
                  border: selectedCat === "all" ? "3px solid #c9a45c" : "2px solid #e7e5e4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.6rem",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                🌟
              </div>
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: selectedCat === "all" ? "#173f35" : "#44403c" }}>
                সকল অফার
              </span>
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCat === cat.slug;
              const catImg = cat.image || cat.image_url;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    setSelectedCat(cat.slug);
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
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
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: isSelected ? "3px solid #10b981" : "2px solid #e7e5e4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f4",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      position: "relative",
                    }}
                  >
                    {catImg ? (
                      <img src={catImg} alt={cat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "1.7rem" }}>{cat.icon || "📦"}</span>
                    )}
                  </div>

                  {cat.badge && (
                    <span
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "6px",
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "10px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
                      }}
                    >
                      {cat.badge}
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: isSelected ? 800 : 600,
                      color: isSelected ? "#059669" : "#44403c",
                      textAlign: "center",
                      maxWidth: "86px",
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
      <div className="wrap" style={{ padding: "24px 0 10px" }}>
        <HeroSlider
          products={products.slice(0, 5)}
          heroSlides={heroSlides}
          eyebrow="★ ডিপার্টমেন্ট হাব ও অফার জোন"
          defaultTitle="ঘরের ফার্নিচার থেকে ফ্যাশন পোশাক—সব এক ঠিকানায়"
          defaultLede="সরাসরি প্রস্তুতকারক ও শীর্ষ আমদানিকারকদের থেকে সংগৃহীত প্রিমিয়াম পণ্য।"
          shopButtonText="অর্ডার করুন"
        />
      </div>

      <div className="wrap" style={{ paddingBottom: "40px" }}>
        {/* ============================================================== */}
        {/* Dual Split Feature Promotional Banners                         */}
        {/* ============================================================== */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "24px" }} className="model3-split-banners">
          {/* Banner 1: Furniture & Home */}
          <div
            style={{
              borderRadius: "16px",
              padding: "28px",
              background: "linear-gradient(135deg, #173f35 0%, #235d4e 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(23,63,53,0.15)",
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedCat("furniture");
              document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <div>
              <span style={{ backgroundColor: "#c9a45c", color: "#173f35", padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800 }}>
                🛋️ ফার্নিচার স্পেশাল
              </span>
              <h3 style={{ margin: "10px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>
                আধুনিক লিভিং ও অফিস ফার্নিচার
              </h3>
              <p style={{ margin: "0 0 14px", color: "#d1fae5", fontSize: "0.88rem" }}>
                নান্দনিক ডিজাইন ও দীর্ঘস্থায়ী কোয়ালিটিতে ফ্ল্যাট ৩০% ছাড়!
              </p>
              <span style={{ display: "inline-block", backgroundColor: "#ffffff", color: "#173f35", fontWeight: 700, padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
                কালেকশন দেখুন →
              </span>
            </div>
            <div style={{ fontSize: "4.5rem", paddingRight: "10px" }}>🛋️</div>
          </div>

          {/* Banner 2: Fashion & Lifestyle */}
          <div
            style={{
              borderRadius: "16px",
              padding: "28px",
              background: "linear-gradient(135deg, #831843 0%, #be185d 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(190,24,93,0.15)",
              cursor: "pointer",
            }}
            onClick={() => {
              setSelectedCat("three-piece-clothing");
              document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <div>
              <span style={{ backgroundColor: "#fef08a", color: "#831843", padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: 800 }}>
                👗 ফ্যাশন ও ঘড়ি
              </span>
              <h3 style={{ margin: "10px 0 6px", fontSize: "1.35rem", fontWeight: 800 }}>
                এক্সক্লুসিভ থ্রি-পিস ও লাক্সারি ওয়াচ
              </h3>
              <p style={{ margin: "0 0 14px", color: "#fce7f3", fontSize: "0.88rem" }}>
                আকর্ষণীয় কালার ও ট্রেন্ডি ডিজাইনের নতুন কালেকশন
              </p>
              <span style={{ display: "inline-block", backgroundColor: "#ffffff", color: "#831843", fontWeight: 700, padding: "8px 16px", borderRadius: "8px", fontSize: "0.85rem" }}>
                অর্ডার করুন →
              </span>
            </div>
            <div style={{ fontSize: "4.5rem", paddingRight: "10px" }}>👗</div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Flash Deals Carousel Section                                  */}
        {/* ============================================================== */}
        {flashDeals.length > 0 && (
          <div
            style={{
              marginTop: "32px",
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              border: "1px solid #e7e5e4",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.4rem" }}>🔥</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1c1917", fontWeight: 800 }}>
                    আজকের হট ডিল (Department Flash Deals)
                  </h3>
                  <span style={{ fontSize: "0.85rem", color: "#78716c" }}>স্টক শেষ হওয়ার আগেই অর্ডার নিশ্চিত করুন</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#fef2f2", padding: "6px 14px", borderRadius: "10px", border: "1px solid #fecaca" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#991b1b" }}>সময় বাকি:</span>
                <span style={{ fontWeight: 800, color: "#dc2626" }}>
                  {String(dealTime.hours).padStart(2, "0")}h : {String(dealTime.minutes).padStart(2, "0")}m : {String(dealTime.seconds).padStart(2, "0")}s
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "18px" }}>
              {flashDeals.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Trust Badges Bar (Target Style)                               */}
        {/* ============================================================== */}
        <div
          style={{
            marginTop: "32px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid #e7e5e4",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "20px",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.8rem" }}>🚚</span>
            <strong style={{ fontSize: "0.95rem", color: "#1c1917" }}>দ্রুততম ক্যাশ অন ডেলিভারি</strong>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>সারা বাংলাদেশে বিশ্বস্ত পাঠাও কুরিয়ারে</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.8rem" }}>🔒</span>
            <strong style={{ fontSize: "0.95rem", color: "#1c1917" }}>১০০% অরিজিনাল পণ্য</strong>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>গুণগত মানের নিশ্চিত নিশ্চয়তা</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.8rem" }}>🔄</span>
            <strong style={{ fontSize: "0.95rem", color: "#1c1917" }}>৭ দিনের সহজ রিটার্ন</strong>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>পণ্য পছন্দ না হলে নির্দ্বিধায় পরিবর্তন</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "1.8rem" }}>💬</span>
            <strong style={{ fontSize: "0.95rem", color: "#1c1917" }}>২৪/৭ কাস্টমার সাপোর্ট</strong>
            <span style={{ fontSize: "0.8rem", color: "#78716c" }}>যেকোনো প্রয়োজনে সরাসরি ফোন বা হোয়াটসঅ্যাপ</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* Interactive Shop Catalog with Selected Category               */}
        {/* ============================================================== */}
        <div id="shop" style={{ marginTop: "44px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1c1917", margin: "0 0 6px" }}>
              🏬 সকল ডিপার্টমেন্টের পণ্য তালিকা
            </h2>
            <p style={{ margin: 0, color: "#78716c", fontSize: "0.92rem" }}>
              পণ্য সিলেক্ট করুন এবং সরাসরি চেকআউটে অর্ডার সম্পন্ন করুন
            </p>
          </div>

          <ProductCatalog products={products} initialCategory={selectedCat} />
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .model3-split-banners {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
