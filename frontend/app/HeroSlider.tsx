"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "./types";

interface HeroSliderProps {
  products: Product[];
  eyebrow?: string;
  defaultTitle?: string;
  defaultLede?: string;
  shopButtonText?: string;
}

export function HeroSlider({
  products,
  eyebrow = "আভিজাত্য ও নান্দনিকতার মিলনমেলা",
  defaultTitle = "আপনার ঘরের সৌন্দর্য বাড়ান প্রিমিয়াম হোম ডেকোরে",
  defaultLede = "অভিজ্ঞ কারিগরদের তৈরি বুকশেলফ, ওয়াল শেলফ ও ডেকোরেটিভ ফার্নিচারের বিশ্বস্ত অনলাইন শপ।",
  shopButtonText = "কেনাকাটা শুরু করুন",
}: HeroSliderProps) {
  // Take at most 5 products
  const sliderProducts = products.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => { const media = window.matchMedia("(max-width: 640px)"); const update = () => setIsMobile(media.matches); update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update); }, []);
  const [outgoingProduct, setOutgoingProduct] = useState<Product | null>(null);
  const previousProduct = useRef<Product | null>(null);

  const nextSlide = useCallback(() => {
    if (sliderProducts.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sliderProducts.length);
  }, [sliderProducts.length]);

  const prevSlide = useCallback(() => {
    if (sliderProducts.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sliderProducts.length) % sliderProducts.length);
  }, [sliderProducts.length]);

  // 2.5 seconds auto-slide
  useEffect(() => {
    if (isPaused || sliderProducts.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 2500);
    return () => clearInterval(interval);
  }, [isPaused, sliderProducts.length, nextSlide]);

  useEffect(() => {
    setOutgoingProduct(previousProduct.current);
    previousProduct.current = sliderProducts[currentIndex] || null;
    const timer = window.setTimeout(() => setOutgoingProduct(null), 850);
    return () => window.clearTimeout(timer);
  }, [currentIndex]);

  if (sliderProducts.length === 0) {
    return (
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{defaultTitle}</h1>
            <p className="lede">{defaultLede}</p>
            <div className="cta-row">
              <a className="btn btn-primary" href="#shop">
                {shopButtonText}
              </a>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-shelf">
              <i/><i/><i/><i/><i/><i/>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeProduct = sliderProducts[currentIndex];
  const imageFor = (product: Product | null) => {
    if (!product) return undefined;
    const source = product.images?.find((img) => img.is_primary) || product.images?.[0];
    // card_image is a normalised 4:5 frame (cream background), so every upload looks identical.
    return source?.card_image || (isMobile ? source?.hero_mobile || source?.hero_desktop : source?.hero_desktop || source?.hero_mobile) || source?.image;
  };
  const primaryImg = imageFor(activeProduct);
  const outgoingImg = imageFor(outgoingProduct);

  return (
    <section className="hero-slider-section" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="wrap hero-slider-container">
        <div className="hero-split hero-split-anim">
          <div className="hero-split-copy">
            <div className="hero-badge-row">
              <span className="hero-badge">★ বিশেষ অফার</span>
              <span className="hero-cat-tag">{activeProduct.category?.name || "হোম ডেকর"}</span>
            </div>
            <h1 className="hero-product-title">{activeProduct.name}</h1>
            <p className="hero-product-desc">
              {activeProduct.description
                ? activeProduct.description.slice(0, 120) + (activeProduct.description.length > 120 ? "..." : "")
                : defaultLede}
            </p>
            
            <div className="hero-price-row">
              {activeProduct.discount_price ? (
                <>
                  <span className="hero-current-price">৳{Number(activeProduct.discount_price).toLocaleString("bn-BD")}</span>
                  <span className="hero-old-price">৳{Number(activeProduct.price).toLocaleString("bn-BD")}</span>
                  <span className="hero-save-badge">
                    {Math.round(((Number(activeProduct.price) - Number(activeProduct.discount_price)) / Number(activeProduct.price)) * 100)}% ছাড়
                  </span>
                </>
              ) : (
                <span className="hero-current-price">৳{Number(activeProduct.price).toLocaleString("bn-BD")}</span>
              )}
            </div>

            <div className="cta-row">
              <Link className="btn btn-primary hero-btn-buy" href={`/products/${activeProduct.slug}`}>
                এখনই অর্ডার করুন →
              </Link>
              <a className="btn btn-ghost" href="#shop">
                সব পণ্য দেখুন
              </a>
            </div>
          </div>

          <div className="hero-split-media">
            {outgoingImg && <Image src={outgoingImg} alt="" width={800} height={1000} key={outgoingProduct?.id} className="hero-split-img hero-split-out" />}
            {primaryImg ? (
              <Image src={primaryImg} alt={activeProduct.name} width={800} height={1000} key={activeProduct.id} className="hero-split-img hero-split-in" priority />
            ) : (
              <div className="hero-img-placeholder">
                <div className="hero-shelf"><i/><i/><i/><i/><i/><i/></div>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Indicators */}
        {sliderProducts.length > 1 && (
          <div className="hero-controls-bar">
            <button onClick={prevSlide} className="hero-arrow-btn" aria-label="আগেরটি">
              ‹
            </button>

            <div className="hero-dots">
              {sliderProducts.map((prod, idx) => (
                <button
                  key={prod.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`hero-dot ${idx === currentIndex ? "active" : ""}`}
                  aria-label={`স্লাইড ${idx + 1}`}
                />
              ))}
            </div>

            <button onClick={nextSlide} className="hero-arrow-btn" aria-label="পরেরটি">
              ›
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
