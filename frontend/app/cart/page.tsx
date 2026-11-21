"use client";

import Link from "next/link";
import { useCart } from "../cart";
import { Header, formatPrice, formatNumber, cleanImageUrl } from "../components";
import { useLocale, useTranslations } from "next-intl";

export default function CartPage() {
  const { items, total, change, remove } = useCart();
  const locale = useLocale();
  const t = useTranslations("cart");

  return (
    <>
      <Header />
      <main className="cart-page-wrapper">
        <div className="cart-container">
          
          {/* Top Header */}
          <div className="cart-header-bar">
            <div>
              <span className="cart-kicker">
                {t("kicker")}
              </span>
              <h1 className="cart-main-title">
                {items.length ? t("title") : t("emptyTitle")}
              </h1>
            </div>
            <Link href="/#shop" className="continue-shopping-btn">
              {t("continueShopping")}
            </Link>
          </div>

          {items.length ? (
            <div className="cart-grid-layout">
              
              {/* Cart Items List */}
              <section className="cart-items-section">
                <div className="cart-section-head">
                  <h2>
                    {t("itemsTitle", { count: locale === "en" ? items.length : formatNumber(items.length, "bn") })}
                  </h2>
                  <span className="cart-head-sub">{t("priceAndQty")}</span>
                </div>

                <div className="cart-items-stack">
                  {items.map((item) => {
                    const unitPrice = Number(item.discount_price || item.price);
                    const lineTotal = unitPrice * item.quantity;
                    const imageSrc = cleanImageUrl(
                      item.images?.[0]?.card_image ||
                      item.images?.[0]?.hero_desktop ||
                      item.images?.[0]?.image
                    );

                    return (
                      <article key={item.id} className="cart-item-card">
                        {/* Product Image */}
                        <div className="cart-item-img-box">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.name}
                            />
                          ) : (
                            <span className="fallback-emoji">🛍️</span>
                          )}
                        </div>

                        {/* Title & Details */}
                        <div className="cart-item-details">
                          <Link href={`/products/${item.slug}`} className="cart-item-name">
                            {item.name}
                          </Link>
                          <div className="cart-item-price">
                            {item.discount_price ? (
                              <>
                                <strong>
                                  {formatPrice(item.discount_price, locale)}
                                </strong>
                                <del>
                                  {formatPrice(item.price, locale)}
                                </del>
                              </>
                            ) : (
                              <strong>
                                {formatPrice(item.price, locale)}
                              </strong>
                            )}
                          </div>
                          <span className="in-stock-badge">
                            {t("inStock")}
                          </span>
                        </div>

                        {/* Quantity & Total Actions Box for Mobile/Desktop */}
                        <div className="cart-item-actions">
                          {/* Quantity Counter */}
                          <div className="quantity-counter">
                            <button
                              onClick={() => change(item.id, item.quantity - 1)}
                              aria-label="-"
                            >
                              −
                            </button>
                            <span>
                              {formatNumber(item.quantity, locale)}
                            </span>
                            <button
                              onClick={() => change(item.id, item.quantity + 1)}
                              aria-label="+"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal & Delete */}
                          <div className="cart-item-totals">
                            <span className="line-total-price">
                              {formatPrice(lineTotal, locale)}
                            </span>
                            <button
                              onClick={() => remove(item.id)}
                              className="remove-item-btn"
                            >
                              🗑️ {t("remove")}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* Mobile / Inline High-Conversion Checkout Prompt */}
                <div className="mobile-cart-prompt">
                  <a
                    href="/checkout"
                    className="checkout-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = "/checkout";
                    }}
                  >
                    <span className="checkout-btn-content">
                      <span className="checkout-btn-icon">⚡</span>
                      <span className="checkout-btn-text">
                        {t("proceedCheckout")}
                      </span>
                      <span className="checkout-btn-arrow">➔</span>
                    </span>
                    <span className="checkout-btn-sub">
                      ক্যাশ অন ডেলিভারি • দ্রুত ও নিরাপদ শিপিং
                    </span>
                  </a>
                </div>
              </section>

              {/* Order Summary Sidebar */}
              <aside className="cart-summary-sidebar">
                <h2 className="summary-title">
                  {t("summaryTitle")}
                </h2>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t("itemsTotal")}</span>
                    <span>{formatPrice(total, locale)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{t("deliveryCharge")}</span>
                    <span className="free-tag">{t("deliveryCalc")}</span>
                  </div>
                  <hr className="summary-divider" />
                  <div className="summary-row grand-total">
                    <span>{t("grandTotal")}</span>
                    <span className="total-amount">{formatPrice(total, locale)}</span>
                  </div>
                </div>

                <a
                  href="/checkout"
                  className="checkout-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/checkout";
                  }}
                >
                  <span className="checkout-btn-content">
                    <span className="checkout-btn-icon">⚡</span>
                    <span className="checkout-btn-text">
                      {t("proceedCheckout")}
                    </span>
                    <span className="checkout-btn-arrow">➔</span>
                  </span>
                  <span className="checkout-btn-sub">
                    ক্যাশ অন ডেলিভারি • দ্রুত ও নিরাপদ শিপিং
                  </span>
                </a>

                <div className="trust-badge">
                  🛡️ <span>{t("trustBadge")}</span>
                </div>
              </aside>
            </div>
          ) : (
            /* Empty Cart View */
            <section className="empty-cart-view">
              <div className="empty-icon">🛒</div>
              <h2>
                {t("emptyPrompt")}
              </h2>
              <p>
                {t("emptySub")}
              </p>
              <Link href="/#shop" className="start-shopping-btn">
                {t("startShopping")}
              </Link>
            </section>
          )}
        </div>
      </main>

      <style jsx>{`
        .cart-page-wrapper {
          padding: 40px 16px 80px;
          background-color: #f8fafc;
          min-height: 80vh;
        }
        .cart-container {
          max-width: 1050px;
          margin: 0 auto;
        }
        .cart-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
          gap: 16px;
        }
        .cart-kicker {
          font-size: 0.8rem;
          font-weight: 600;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .cart-main-title {
          margin: 4px 0 0;
          font-size: 1.8rem;
          color: #0f172a;
          font-weight: 700;
        }
        .continue-shopping-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 0.9rem;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          white-space: nowrap;
        }
        .cart-grid-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          align-items: start;
        }
        .cart-items-section {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
        }
        .cart-section-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          margin-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .cart-section-head h2 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: #1e293b;
        }
        .cart-head-sub {
          font-size: 0.85rem;
          color: #64748b;
        }
        .cart-items-stack {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .cart-item-card {
          display: grid;
          grid-template-columns: 80px 1fr auto;
          gap: 16px;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #f8fafc;
        }
        .cart-item-img-box {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cart-item-img-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .fallback-emoji {
          font-size: 1.5rem;
          color: #94a3b8;
        }
        .cart-item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .cart-item-name {
          font-size: 0.98rem;
          font-weight: 600;
          color: #0f172a;
          text-decoration: none;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cart-item-price {
          font-size: 0.9rem;
          color: #475569;
        }
        .cart-item-price strong {
          color: #059669;
          font-weight: 700;
        }
        .cart-item-price del {
          color: #94a3b8;
          font-size: 0.8rem;
          margin-left: 6px;
        }
        .in-stock-badge {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 500;
        }
        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .quantity-counter {
          display: inline-flex;
          align-items: center;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background-color: #f8fafc;
          overflow: hidden;
        }
        .quantity-counter button {
          border: none;
          background: none;
          padding: 6px 10px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 700;
          color: #475569;
        }
        .quantity-counter span {
          padding: 0 8px;
          font-size: 0.92rem;
          font-weight: 700;
          color: #0f172a;
          min-width: 20px;
          text-align: center;
        }
        .cart-item-totals {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .line-total-price {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }
        .remove-item-btn {
          border: none;
          background: none;
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 4px;
        }
        .cart-summary-sidebar {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          position: sticky;
          top: 90px;
        }
        .summary-title {
          margin: 0 0 16px;
          font-size: 1.2rem;
          font-weight: 700;
          color: #0f172a;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
        }
        .summary-rows {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          color: #475569;
          font-size: 0.95rem;
        }
        .free-tag {
          color: #10b981;
          font-weight: 500;
        }
        .summary-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 4px 0;
        }
        .grand-total {
          color: #0f172a;
          font-size: 1.2rem;
          font-weight: 800;
        }
        .total-amount {
          color: #059669;
        }
        @keyframes auroraWave {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmerWave {
          0% { transform: translateX(-150%) rotate(25deg); }
          100% { transform: translateX(250%) rotate(25deg); }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 10px 25px -4px rgba(16, 185, 129, 0.5), 0 0 20px rgba(6, 182, 212, 0.35);
          }
          50% {
            box-shadow: 0 14px 32px -4px rgba(16, 185, 129, 0.75), 0 0 30px rgba(6, 182, 212, 0.6);
          }
        }
        .checkout-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          width: 100%;
          text-align: center;
          background: linear-gradient(115deg, #047857 0%, #10b981 30%, #06b6d4 70%, #059669 100%);
          background-size: 250% 250%;
          animation: auroraWave 4s ease infinite, pulseGlow 3s ease-in-out infinite;
          color: #ffffff !important;
          font-weight: 800;
          padding: 16px 22px;
          border-radius: 14px;
          text-decoration: none;
          border: 1.5px solid rgba(255, 255, 255, 0.4);
          cursor: pointer;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
        }
        .checkout-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 40%;
          height: 200%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          transform: rotate(25deg);
          animation: shimmerWave 2.8s infinite;
          pointer-events: none;
        }
        .checkout-btn:hover {
          transform: translateY(-2px) scale(1.01);
        }
        .checkout-btn:active {
          transform: translateY(1px) scale(0.99);
        }
        .checkout-btn-content {
          display: inline-flex;
          align-items: center;
          justifyContent: center;
          gap: 10px;
          line-height: 1.2;
          position: relative;
          z-index: 2;
        }
        .checkout-btn-icon {
          font-size: 1.4rem;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        }
        .checkout-btn-text {
          font-weight: 900;
          font-size: 1.22rem;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          letter-spacing: 0.2px;
        }
        .checkout-btn-arrow {
          font-size: 1.3rem;
          font-weight: 900;
          transition: transform 0.2s ease;
        }
        .checkout-btn:hover .checkout-btn-arrow {
          transform: translateX(5px);
        }
        .checkout-btn-sub {
          display: block;
          font-size: 0.82rem;
          font-weight: 700;
          color: #d1fae5;
          margin-top: 5px;
          letter-spacing: 0.2px;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 2;
        }
        .mobile-cart-prompt {
          display: none;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px dashed #e2e8f0;
        }
        .trust-badge {
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #64748b;
        }
        .empty-cart-view {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 60px 24px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #f1f5f9;
          max-width: 500px;
          margin: 40px auto;
        }
        .empty-icon {
          font-size: 3.5rem;
          margin-bottom: 16px;
        }
        .empty-cart-view h2 {
          margin: 0 0 8px;
          font-size: 1.4rem;
          font-weight: 700;
          color: #0f172a;
        }
        .empty-cart-view p {
          color: #64748b;
          font-size: 0.95rem;
          margin: 0 0 24px;
        }
        .start-shopping-btn {
          display: inline-block;
          background-color: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          padding: 12px 28px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
        }

        /* Mobile & Tablet Responsive Media Queries */
        @media (max-width: 868px) {
          .cart-grid-layout {
            grid-template-columns: 1fr;
          }
          .cart-summary-sidebar {
            position: static;
          }
          .mobile-cart-prompt {
            display: block;
          }
        }
        @media (max-width: 640px) {
          .cart-header-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .cart-item-card {
            grid-template-columns: 65px 1fr;
            gap: 12px;
            position: relative;
          }
          .cart-item-img-box {
            width: 65px;
            height: 65px;
          }
          .cart-item-actions {
            grid-column: 1 / -1;
            justify-content: space-between;
            width: 100%;
            padding-top: 10px;
            border-top: 1px dashed #e2e8f0;
          }
          .cart-main-title {
            font-size: 1.4rem;
          }
          .cart-item-name {
            white-space: normal;
          }
        }
      `}</style>
    </>
  );
}

