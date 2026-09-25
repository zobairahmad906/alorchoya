"use client";

import { useState, useEffect } from "react";
import { useCart } from "../../cart";
import type { Product } from "../../types";
import { ProductReviews } from "./reviews";
import { MarkdownPreview } from "../../markdown";

export default function ProductClient({ product: initialProduct }: { product: Product }) {
  const { add } = useCart();
  const [product] = useState<Product>(initialProduct);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [quantity, setQuantity] = useState(1);

  const images = product.images.length > 0
    ? product.images
    : [{ id: 0, image: "", alt_text: product.name, is_primary: true }];

  const currentImage = images[selectedIndex] || images[0];
  const price = product.discount_price || product.price;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
        setZoomLevel(1);
      } else if (e.key === "ArrowRight") {
        setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
        setZoomLevel(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, images.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="product-page-wrapper" style={{ backgroundColor: "#f8fafc", paddingBottom: "60px" }}>
      <main className="detail-container">
        {/* Product Image Gallery & Main View */}
        <div className="gallery-column">
          <div 
            className="main-image-wrapper"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseMove={handleMouseMove}
          >
            {currentImage.image ? (
              <div className="image-stage">
                <img
                  src={currentImage.image}
                  alt={currentImage.alt_text || product.name}
                  className="main-product-img"
                  style={
                    isHovering
                      ? {
                          transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                          transform: "scale(1.6)",
                        }
                      : { transform: "scale(1)" }
                  }
                />
              </div>
            ) : (
              <div className="placeholder-stage">
                <span className="placeholder-logo">আ</span>
                <p>ছবি পাওয়া যায়নি</p>
              </div>
            )}

            {/* Badges & Overlay Tools */}
            <div className="image-badges">
              {currentImage.is_primary && <span className="primary-badge">✨ প্রিমিয়াম গ্যারান্টি</span>}
              <span className="count-badge">
                📷 {selectedIndex + 1} / {images.length}
              </span>
            </div>

            <button
              className="lightbox-trigger-btn"
              onClick={() => {
                setIsLightboxOpen(true);
                setZoomLevel(1);
              }}
              title="সম্পূর্ণ বড় করে দেখুন"
            >
              🔍 বড় করে দেখুন
            </button>

            {images.length > 1 && (
              <>
                <button
                  className="nav-arrow left-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
                  }}
                  aria-label="আগের ছবি"
                >
                  ‹
                </button>
                <button
                  className="nav-arrow right-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
                  }}
                  aria-label="পরের ছবি"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Selector Strip */}
          {images.length > 1 && (
            <div className="thumbnails-wrapper">
              <div className="thumbnails-grid">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    className={`thumb-card ${selectedIndex === idx ? "is-selected" : ""}`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    {img.image ? (
                      <img src={img.image} alt={img.alt_text || `ছবি ${idx + 1}`} />
                    ) : (
                      <div className="thumb-placeholder">আ</div>
                    )}
                    {img.is_primary && <span className="mini-badge">মূল</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Details Section */}
        <div className="detail-copy-column">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <span className="cat-chip">{product.category.name}</span>
            <span style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 700, backgroundColor: "#ecfdf5", padding: "3px 10px", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
              ✓ ইন-স্টক (তাৎক্ষণিক ডেলিভারি)
            </span>
          </div>

          <h1 className="product-title">{product.name}</h1>

          {/* Rating Summary */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <div style={{ display: "flex", color: "#fbbf24", fontSize: "1.1rem" }}>
              {"★".repeat(Math.round(product.average_rating || 5))}
            </div>
            <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>
              {product.average_rating ? Number(product.average_rating).toFixed(1) : "5.0"}
            </strong>
            <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
              ({product.total_reviews !== undefined ? product.total_reviews : (product.reviews?.length || 0)}টি রিভিউ)
            </span>
          </div>
          
          <div className="price-box">
            <span className="current-price">৳{Number(price).toLocaleString("bn-BD")}</span>
            {product.discount_price && (
              <del className="original-price">৳{Number(product.price).toLocaleString("bn-BD")}</del>
            )}
            {product.discount_price && (
              <span className="discount-tag">
                ৳{(Number(product.price) - Number(product.discount_price)).toLocaleString("bn-BD")} ছাড়
              </span>
            )}
          </div>

          <div style={{ backgroundColor: "#ffffff", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "24px" }}>
            <h4 style={{ margin: "0 0 6px", fontSize: "0.9rem", color: "#334155", fontWeight: 700 }}>পণ্যের সংক্ষিপ্ত বিবরণ:</h4>
            <MarkdownPreview value={product.description || "আপনার ঘরের জন্য যত্নসহকারে নির্বাচিত আসল ও মানসম্মত পণ্য। আলোর ছোঁয়া মার্ট থেকে কেনাকাটায় ১০০% গুণমান নিশ্চিত।"} className="description-text" />
          </div>

          {/* Quantity Selector */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
              পরিমাণ নির্বাচন করুন:
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px", backgroundColor: "#ffffff", overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ padding: "8px 16px", border: "none", backgroundColor: "#f8fafc", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", color: "#334155" }}
                >
                  −
                </button>
                <span style={{ padding: "8px 20px", fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(product.stock || 10, q + 1))}
                  style={{ padding: "8px 16px", border: "none", backgroundColor: "#f8fafc", fontSize: "1.1rem", fontWeight: 700, cursor: "pointer", color: "#334155" }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                (অবশিষ্ট স্টক: {product.stock || "উপলব্ধ"})
              </span>
            </div>
          </div>

          {/* Action Buttons: Add to Cart & Buy Now */}
          <div className="action-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
            <button
              className="btn-add-cart"
              onClick={() => {
                for (let i = 0; i < quantity; i++) add(product);
              }}
              disabled={!product.stock}
              style={{
                backgroundColor: "#0f172a",
                color: "#ffffff",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              🛒 কার্টে যোগ করুন
            </button>

            <button
              type="button"
              onClick={() => {
                for (let i = 0; i < quantity; i++) add(product);
                window.location.href = "/checkout";
              }}
              disabled={!product.stock}
              style={{
                backgroundColor: "#10b981",
                color: "#ffffff",
                padding: "14px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "1rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              ⚡ সরাসরি অর্ডার করুন
            </button>
          </div>

          {/* Trust Features Strip */}
          <div className="trust-features" style={{ backgroundColor: "#ffffff", padding: "18px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
            <div className="trust-item">
              <span className="trust-icon">🚚</span>
              <div>
                <strong>ক্যাশ অন ডেলিভারি</strong>
                <p>পণ্য দেখে টাকা পরিশোধের সুযোগ</p>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🛡️</span>
              <div>
                <strong>১০০% অরিজিনাল পণ্য</strong>
                <p>গুণমান নিশ্চিতকৃত সেরা সামগ্রী</p>
              </div>
            </div>
            <div className="trust-item">
              <span className="trust-icon">🔄</span>
              <div>
                <strong>সহজ রিটার্ন পলিসি</strong>
                <p>পছন্দ না হলে সহজে পরিবর্তন</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div style={{ maxWidth: "1140px", margin: "0 auto", padding: "0 24px" }}>
        <ProductReviews product={product} />
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Controls Header */}
            <div className="lightbox-header">
              <div className="lightbox-title">
                <span>{product.name}</span>
                <small>({selectedIndex + 1} / {images.length})</small>
              </div>
              <div className="lightbox-tools">
                <button 
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  title="জুম ইন (+)"
                  className="tool-btn"
                >
                  ➕
                </button>
                <button 
                  onClick={() => setZoomLevel(1)}
                  title="রিসেট জুম"
                  className="tool-btn"
                >
                  🔄
                </button>
                <button 
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  title="জুম আউট (-)"
                  className="tool-btn"
                >
                  ➖
                </button>
                <button 
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  title="বন্ধ করুন (Esc)"
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Stage Image View */}
            <div className="lightbox-body">
              {images.length > 1 && (
                <button
                  className="lightbox-arrow left"
                  onClick={() => {
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
                    setZoomLevel(1);
                  }}
                >
                  ‹
                </button>
              )}

              <div className="lightbox-image-container">
                {currentImage.image ? (
                  <img
                    src={currentImage.image}
                    alt={currentImage.alt_text || product.name}
                    style={{ transform: `scale(${zoomLevel})` }}
                    className="lightbox-full-img"
                  />
                ) : (
                  <div className="placeholder-stage">ছবি নেই</div>
                )}
              </div>

              {images.length > 1 && (
                <button
                  className="lightbox-arrow right"
                  onClick={() => {
                    setSelectedIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
                    setZoomLevel(1);
                  }}
                >
                  ›
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip */}
            {images.length > 1 && (
              <div className="lightbox-footer">
                <div className="lightbox-thumbs-strip">
                  {images.map((img, idx) => (
                    <button
                      key={img.id || idx}
                      className={`lightbox-thumb ${selectedIndex === idx ? "active" : ""}`}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setZoomLevel(1);
                      }}
                    >
                      {img.image ? (
                        <img src={img.image} alt="" />
                      ) : (
                        <span>আ</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
