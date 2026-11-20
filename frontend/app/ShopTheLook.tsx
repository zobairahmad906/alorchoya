"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./cart";
import { formatPrice } from "./components";
import type { Product } from "./types";
import { useLocale, useTranslations } from "next-intl";

interface LookbookItem {
  id: string;
  pin: { x: number; y: number }; // Percentage coords
  title: string;
  titleEn: string;
  price: number;
  oldPrice?: number;
  category: string;
  categoryEn: string;
  image: string;
  description: string;
  descriptionEn: string;
  rating: number;
  reviewsCount: number;
  slug?: string;
  product?: Product;
}

export function ShopTheLook({ products = [] }: { products?: Product[] }) {
  const router = useRouter();
  const { add } = useCart();
  const locale = useLocale();
  const t = useTranslations("lookbook");

  // Map hotspots to actual products if available, or use curated decor defaults
  const p0 = products[0];
  const p1 = products[1];
  const p2 = products[2];
  const p3 = products[3];

  const lookItems: LookbookItem[] = [
    {
      id: "lamp-1",
      pin: { x: 34, y: 32 },
      title: p0 ? p0.name : "মডার্ন অ্যাকসেন্ট পেন্ডেন্ট ল্যাম্প",
      titleEn: p0 ? p0.name : "Modern Brass Pendant Lamp",
      price: p0 ? Number(p0.discount_price || p0.price) : 3450,
      oldPrice: p0 ? (p0.discount_price ? Number(p0.price) : undefined) : 4200,
      category: p0?.category?.name || "লাইটিং ও ল্যাম্প",
      categoryEn: p0?.category?.name || "Lighting & Lamps",
      image: p0?.images?.[0]?.image || "/lookbook-living-room.jpg",
      description: p0?.description || "ওয়ার্ম লাইটিং এবং ব্রাস ফিনিশের প্রিমিয়াম পেন্ডেন্ট ল্যাম্প, যা ড্রয়িং রুমে আনে রাজকীয় আবহ।",
      descriptionEn: p0?.description || "Warm brass finish pendant lamp that brings ambient luxury to modern living spaces.",
      rating: 4.9,
      reviewsCount: 18,
      slug: p0?.slug,
      product: p0,
    },
    {
      id: "sofa-1",
      pin: { x: 26, y: 68 },
      title: p1 ? p1.name : "লাক্সারি স্ক্যান্ডিনেভিয়ান লাউঞ্জ সোফা",
      titleEn: p1 ? p1.name : "Scandinavian Luxury Lounge Sofa",
      price: p1 ? Number(p1.discount_price || p1.price) : 24500,
      oldPrice: p1 ? (p1.discount_price ? Number(p1.price) : undefined) : 28000,
      category: p1?.category?.name || "লিভিং ফার্নিচার",
      categoryEn: p1?.category?.name || "Living Furniture",
      image: p1?.images?.[0]?.image || "/lookbook-living-room.jpg",
      description: p1?.description || "অর্গানিক ওক উড ফ্রেম ও নরম লিনেন ফেব্রিকে তৈরি আরামদায়ক লাউঞ্জ চেয়ার।",
      descriptionEn: p1?.description || "Handcrafted oak wood lounge sofa with ultra-soft linen cushioning.",
      rating: 5.0,
      reviewsCount: 24,
      slug: p1?.slug,
      product: p1,
    },
    {
      id: "table-1",
      pin: { x: 55, y: 78 },
      title: p2 ? p2.name : "ন্যাচারাল টিম্বার কফি টেবিল",
      titleEn: p2 ? p2.name : "Natural Solid Timber Coffee Table",
      price: p2 ? Number(p2.discount_price || p2.price) : 8900,
      oldPrice: p2 ? (p2.discount_price ? Number(p2.price) : undefined) : 10500,
      category: p2?.category?.name || "সেন্টার টেবিল",
      categoryEn: p2?.category?.name || "Coffee Tables",
      image: p2?.images?.[0]?.image || "/lookbook-living-room.jpg",
      description: p2?.description || "প্রাকৃতিক কাঠের টেক্সচার এবং মসৃণ ফিনিশিং যুক্ত আধুনিক মিনিমালিস্ট কফি টেবিল।",
      descriptionEn: p2?.description || "Minimalist solid timber coffee table featuring smooth rounded bevels.",
      rating: 4.8,
      reviewsCount: 12,
      slug: p2?.slug,
      product: p2,
    },
    {
      id: "shelf-1",
      pin: { x: 82, y: 44 },
      title: p3 ? p3.name : "মিনিমালিস্ট ওক বুকশেলফ ও ডেকর র‍্যাক",
      titleEn: p3 ? p3.name : "Minimalist Oak Bookshelf & Decor Rack",
      price: p3 ? Number(p3.discount_price || p3.price) : 12500,
      oldPrice: p3 ? (p3.discount_price ? Number(p3.price) : undefined) : 14000,
      category: p3?.category?.name || "শেলফ ও স্টোরেজ",
      categoryEn: p3?.category?.name || "Shelves & Storage",
      image: p3?.images?.[0]?.image || "/lookbook-living-room.jpg",
      description: p3?.description || "বই ও শোপিস সাজানোর জন্য পারফেক্ট জ্যামিতিক পার্টিশন যুক্ত নান্দনিক শেলফ।",
      descriptionEn: p3?.description || "Architectural wall shelving unit crafted from seasoned teak wood.",
      rating: 4.9,
      reviewsCount: 31,
      slug: p3?.slug,
      product: p3,
    },
  ];

  const [activePin, setActivePin] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<LookbookItem | null>(null);
  const [qty, setQty] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  const openQuickView = (item: LookbookItem) => {
    setDrawerItem(item);
    setActivePin(item.id);
    setQty(1);
    setAddedNotice(false);
  };

  const closeQuickView = () => {
    setDrawerItem(null);
  };

  const getTargetProduct = (item: LookbookItem): Product => {
    if (item.product) return item.product;
    return {
      id: 9000 + Math.abs(item.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)),
      name: locale === "en" ? item.titleEn : item.title,
      slug: item.slug || item.id,
      description: locale === "en" ? item.descriptionEn : item.description,
      price: String(item.price),
      discount_price: item.oldPrice ? String(item.price) : null,
      stock: 30,
      category: {
        name: locale === "en" ? item.categoryEn : item.category,
        slug: item.id
      },
      images: [
        {
          id: 1,
          image: item.image,
          alt_text: item.title,
          is_primary: true
        }
      ]
    };
  };

  const handleAddToCart = (item: LookbookItem) => {
    const prod = getTargetProduct(item);
    for (let i = 0; i < qty; i++) {
      add(prod, true);
    }
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2400);
  };

  const handleBuyNow = (item: LookbookItem) => {
    const prod = getTargetProduct(item);
    for (let i = 0; i < qty; i++) {
      add(prod, false);
    }
    window.location.href = "/checkout";
  };

  return (
    <section className="lookbook-section" id="lookbook">
      <div className="wrap">
        {/* Section Header */}
        <div className="lookbook-header">
          <div className="lookbook-badge-row">
            <span className="lookbook-pill">{t("badge")}</span>
            <span className="lookbook-hint-text">
              <span className="pulse-dot" /> {t("hotspotHint")}
            </span>
          </div>
          <h2 className="lookbook-title">{t("title")}</h2>
          <p className="lookbook-subtitle">{t("subtitle")}</p>
        </div>

        {/* Lookbook Layout: Image + Curated Items */}
        <div className="lookbook-grid">
          {/* Main Visual Lookbook Container with Hotspots */}
          <div className="lookbook-stage">
            <div className="lookbook-media-wrap">
              <img
                src="/lookbook-living-room.jpg"
                alt="Alor Chhoya Curated Living Room Inspiration"
                className="lookbook-image"
                loading="lazy"
              />

              {/* Hotspot Pins */}
              {lookItems.map((item) => {
                const isActive = activePin === item.id;
                const isItemOpen = drawerItem?.id === item.id;
                const title = locale === "en" ? item.titleEn : item.title;

                return (
                  <div
                    key={item.id}
                    className={`lookbook-hotspot ${isActive || isItemOpen ? "is-active" : ""}`}
                    style={{ left: `${item.pin.x}%`, top: `${item.pin.y}%` }}
                    onMouseEnter={() => setActivePin(item.id)}
                    onMouseLeave={() => {
                      if (!drawerItem) setActivePin(null);
                    }}
                  >
                    {/* Animated Pulsing Pin Button */}
                    <button
                      type="button"
                      className="hotspot-trigger"
                      onClick={() => openQuickView(item)}
                      aria-label={`Explore ${title}`}
                    >
                      <span className="hotspot-ring" />
                      <span className="hotspot-core">+</span>
                    </button>

                    {/* Desktop Hover Card Preview */}
                    <div className="hotspot-popover">
                      <div className="popover-cat">
                        {locale === "en" ? item.categoryEn : item.category}
                      </div>
                      <div className="popover-title">{title}</div>
                      <div className="popover-price">
                        {formatPrice(item.price, locale)}
                        {item.oldPrice && (
                          <span className="popover-old-price">
                            {formatPrice(item.oldPrice, locale)}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="popover-quick-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openQuickView(item);
                        }}
                      >
                        {t("quickView")} →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Curated Sidebar Items in this Room */}
          <div className="lookbook-sidebar">
            <div className="sidebar-head">
              <h3>{t("itemsInLook")}</h3>
              <span className="sidebar-count">{lookItems.length} Items</span>
            </div>

            <div className="lookbook-item-list">
              {lookItems.map((item) => {
                const isSelected = activePin === item.id || drawerItem?.id === item.id;
                const title = locale === "en" ? item.titleEn : item.title;

                return (
                  <article
                    key={item.id}
                    className={`lookbook-card ${isSelected ? "card-highlighted" : ""}`}
                    onMouseEnter={() => setActivePin(item.id)}
                    onMouseLeave={() => {
                      if (!drawerItem) setActivePin(null);
                    }}
                    onClick={() => openQuickView(item)}
                  >
                    <div className="card-thumb">
                      <img src={item.image} alt={title} />
                      <span className="card-pin-badge">Pin</span>
                    </div>

                    <div className="card-info">
                      <span className="card-cat">
                        {locale === "en" ? item.categoryEn : item.category}
                      </span>
                      <h4 className="card-name">{title}</h4>
                      <div className="card-price-row">
                        <span className="card-price">
                          {formatPrice(item.price, locale)}
                        </span>
                        {item.oldPrice && (
                          <span className="card-old-price">
                            {formatPrice(item.oldPrice, locale)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="card-action-col" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-card-quick"
                        onClick={() => openQuickView(item)}
                        title={t("quickView")}
                      >
                        {t("quickView")}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick View Slide-over Drawer / Modal */}
        {drawerItem && (
          <div className="quickview-backdrop" onClick={closeQuickView}>
            <div
              className="quickview-drawer"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="quickview-head">
                <span className="quickview-pill">{t("quickView")}</span>
                <button
                  type="button"
                  className="quickview-close-btn"
                  onClick={closeQuickView}
                  aria-label={t("close")}
                >
                  ✕
                </button>
              </div>

              <div className="quickview-body">
                <div className="quickview-img-wrap">
                  <img
                    src={drawerItem.image}
                    alt={locale === "en" ? drawerItem.titleEn : drawerItem.title}
                  />
                  <span className="quickview-stock-tag">✓ {t("inStock")}</span>
                </div>

                <div className="quickview-details">
                  <span className="quickview-cat">
                    {locale === "en" ? drawerItem.categoryEn : drawerItem.category}
                  </span>
                  <h3 className="quickview-title">
                    {locale === "en" ? drawerItem.titleEn : drawerItem.title}
                  </h3>

                  <div className="quickview-rating-row">
                    <span className="stars">★ ★ ★ ★ ★</span>
                    <span className="rating-val">{drawerItem.rating}</span>
                    <span className="rating-count">({drawerItem.reviewsCount} {t("rating")})</span>
                  </div>

                  <div className="quickview-price-box">
                    <span className="quickview-price">
                      {formatPrice(drawerItem.price, locale)}
                    </span>
                    {drawerItem.oldPrice && (
                      <span className="quickview-old-price">
                        {formatPrice(drawerItem.oldPrice, locale)}
                      </span>
                    )}
                  </div>

                  <p className="quickview-desc">
                    {locale === "en" ? drawerItem.descriptionEn : drawerItem.description}
                  </p>

                  {/* Quantity Stepper */}
                  <div className="quickview-qty-row">
                    <label>{t("quantity")}:</label>
                    <div className="qty-control">
                      <button
                        type="button"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        disabled={qty <= 1}
                      >
                        −
                      </button>
                      <span>{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty((q) => q + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="quickview-actions">
                    <button
                      type="button"
                      className={`btn btn-secondary btn-quick-cart ${addedNotice ? "is-added" : ""}`}
                      onClick={() => handleAddToCart(drawerItem)}
                    >
                      {addedNotice ? `✓ ${t("addedToCart")}` : `🛒 ${t("addToCart")}`}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-quick-buy"
                      onClick={() => handleBuyNow(drawerItem)}
                    >
                      ⚡ {t("buyNow")}
                    </button>
                  </div>

                  {drawerItem.slug && (
                    <div className="quickview-footer-link">
                      <Link
                        href={`/products/${drawerItem.slug}`}
                        onClick={closeQuickView}
                      >
                        {t("viewDetails")} →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
