"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product, HeroSlide } from "./types";
import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "./components";

interface HeroSliderProps {
  products: Product[];
  heroSlides?: HeroSlide[];
  eyebrow?: string;
  defaultTitle?: string;
  defaultLede?: string;
  shopButtonText?: string;
}

type UnifiedSlide = {
  id: string;
  eyebrow: string;
  catTag?: string;
  title: string;
  desc: string;
  image?: string;
  hasPrice: boolean;
  currentPrice?: string | null;
  oldPrice?: string | null;
  discountPercent?: number | null;
  buttonText: string;
  buttonLink: string;
};

export function HeroSlider({
  products,
  heroSlides = [],
  eyebrow,
  defaultTitle,
  defaultLede,
  shopButtonText,
}: HeroSliderProps) {
  const locale = useLocale();
  const tHome = useTranslations("home");
  const fallbackEyebrow = eyebrow || tHome("eyebrow");
  const fallbackTitle = defaultTitle || tHome("title");
  const fallbackLede = defaultLede || tHome("lede");
  const fallbackButtonText = shopButtonText || tHome("shop");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const hasCustomSlides = Boolean(heroSlides && heroSlides.length > 0);

  const slides: UnifiedSlide[] = hasCustomSlides
    ? heroSlides.map((slide) => {
        const hasDiscount = Boolean(
          slide.product_discount_price &&
          Number(slide.product_discount_price) > 0 &&
          Number(slide.product_discount_price) < Number(slide.product_price)
        );
        const discountPct =
          hasDiscount && slide.product_price
            ? Math.round(
                ((Number(slide.product_price) - Number(slide.product_discount_price)) /
                  Number(slide.product_price)) *
                  100
              )
            : null;

        return {
          id: `slide-${slide.id}`,
          eyebrow: slide.eyebrow || fallbackEyebrow,
          catTag: slide.product_name ? (locale === "en" ? "Offer" : "প্রোডাক্ট অফার") : undefined,
          title: slide.title || slide.product_name || fallbackTitle,
          desc: slide.subtitle || fallbackLede,
          image: isMobile && slide.mobile_image ? slide.mobile_image : slide.image,
          hasPrice: Boolean(slide.product_price),
          currentPrice: slide.product_discount_price || slide.product_price,
          oldPrice: hasDiscount ? slide.product_price : null,
          discountPercent: discountPct,
          buttonText: slide.button_text || fallbackButtonText,
          buttonLink:
            slide.button_link ||
            (slide.product_slug ? `/products/${slide.product_slug}` : "#shop"),
        };
      })
    : products.slice(0, 5).map((p) => {
        const hasDiscount = Boolean(
          p.discount_price &&
          Number(p.discount_price) > 0 &&
          Number(p.discount_price) < Number(p.price)
        );
        const discountPct = hasDiscount
          ? Math.round(
              ((Number(p.price) - Number(p.discount_price)) / Number(p.price)) * 100
            )
          : null;
        const source = p.images?.find((img) => img.is_primary) || p.images?.[0];
        const imgUrl =
          source?.card_image ||
          (isMobile
            ? source?.hero_mobile || source?.hero_desktop
            : source?.hero_desktop || source?.hero_mobile) ||
          source?.image;

        return {
          id: `prod-${p.id}`,
          eyebrow: fallbackEyebrow,
          catTag: p.category?.name || (locale === "en" ? "Home Decor" : "হোম ডেকর"),
          title: p.name,
          desc: p.description
            ? p.description.slice(0, 120) + (p.description.length > 120 ? "..." : "")
            : fallbackLede,
          image: imgUrl,
          hasPrice: true,
          currentPrice: p.discount_price || p.price,
          oldPrice: hasDiscount ? p.price : null,
          discountPercent: discountPct,
          buttonText: tHome("orderNowCta"),
          buttonLink: `/products/${p.slug}`,
        };
      });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [outgoingSlide, setOutgoingSlide] = useState<UnifiedSlide | null>(null);
  const previousSlide = useRef<UnifiedSlide | null>(null);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // 3 seconds auto-slide
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length, nextSlide]);

  useEffect(() => {
    setOutgoingSlide(previousSlide.current);
    previousSlide.current = slides[currentIndex] || null;
    const timer = window.setTimeout(() => setOutgoingSlide(null), 850);
    return () => window.clearTimeout(timer);
  }, [currentIndex, slides]);

  if (slides.length === 0) {
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
              <i /><i /><i /><i /><i /><i />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activeSlide = slides[currentIndex] || slides[0];

  return (
    <section
      className="hero-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="wrap hero-slider-container">
        <div className="hero-split hero-split-anim">
          <div className="hero-split-copy">
            <div className="hero-badge-row">
              <span className="hero-badge">{activeSlide.eyebrow}</span>
              {activeSlide.catTag && (
                <span className="hero-cat-tag">{activeSlide.catTag}</span>
              )}
            </div>
            <h1 className="hero-product-title">{activeSlide.title}</h1>
            <p className="hero-product-desc">{activeSlide.desc}</p>

            {activeSlide.hasPrice && activeSlide.currentPrice && (
              <div className="hero-price-row">
                <span className="hero-current-price">
                  {formatPrice(activeSlide.currentPrice, locale)}
                </span>
                {activeSlide.oldPrice && (
                  <span className="hero-old-price">
                    {formatPrice(activeSlide.oldPrice, locale)}
                  </span>
                )}
                {activeSlide.discountPercent ? (
                  <span className="hero-save-badge">
                    {tHome("discountOff", { discount: activeSlide.discountPercent })}
                  </span>
                ) : null}
              </div>
            )}

            <div className="cta-row">
              {activeSlide.buttonLink.startsWith("http") || activeSlide.buttonLink.startsWith("#") ? (
                <a className="btn btn-primary hero-btn-buy" href={activeSlide.buttonLink}>
                  {activeSlide.buttonText}
                </a>
              ) : (
                <Link className="btn btn-primary hero-btn-buy" href={activeSlide.buttonLink}>
                  {activeSlide.buttonText}
                </Link>
              )}
              <a className="btn btn-ghost" href="#shop">
                {tHome("viewAllProducts")}
              </a>
            </div>
          </div>

          <div className="hero-split-media">
            {outgoingSlide?.image && (
              <Image
                src={outgoingSlide.image}
                alt=""
                width={800}
                height={1000}
                key={outgoingSlide.id}
                className="hero-split-img hero-split-out"
                unoptimized
              />
            )}
            {activeSlide.image ? (
              <Image
                src={activeSlide.image}
                alt={activeSlide.title}
                width={800}
                height={1000}
                key={activeSlide.id}
                className="hero-split-img hero-split-in"
                priority
                unoptimized
              />
            ) : (
              <div className="hero-img-placeholder">
                <div className="hero-shelf">
                  <i /><i /><i /><i /><i /><i />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls and Indicators */}
        {slides.length > 1 && (
          <div className="hero-controls-bar">
            <button onClick={prevSlide} className="hero-arrow-btn" aria-label="আগেরটি">
              ‹
            </button>

            <div className="hero-dots">
              {slides.map((s, idx) => (
                <button
                  key={s.id}
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
