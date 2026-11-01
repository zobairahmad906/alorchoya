"use client";

import Link from "next/link";
import { useCart } from "../cart";
import { Header } from "../components";

export default function CartPage() {
  const { items, total, change, remove } = useCart();

  return (
    <>
      <Header />
      <main className="cart-page-wrapper">
        <div className="cart-container">
          
          {/* Top Header */}
          <div className="cart-header-bar">
            <div>
              <span className="cart-kicker">
                শপিং কার্ট
              </span>
              <h1 className="cart-main-title">
                {items.length ? "আপনার পছন্দের পণ্যসমূহ" : "আপনার কার্ট বর্তমানে খালি"}
              </h1>
            </div>
            <Link href="/#shop" className="continue-shopping-btn">
              ← কেনাকাটা চালিয়ে যান
            </Link>
          </div>

          {items.length ? (
            <div className="cart-grid-layout">
              
              {/* Cart Items List */}
              <section className="cart-items-section">
                <div className="cart-section-head">
                  <h2>
                    আইটেমসমূহ ({items.length})
                  </h2>
                  <span className="cart-head-sub">মূল্য ও পরিমাণ</span>
                </div>

                <div className="cart-items-stack">
                  {items.map((item) => {
                    const unitPrice = Number(item.discount_price || item.price);
                    const lineTotal = unitPrice * item.quantity;
                    const imageSrc = item.images[0]?.card_image || item.images[0]?.hero_desktop || item.images[0]?.image;

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
                                  ৳{Number(item.discount_price).toLocaleString("bn-BD")}
                                </strong>
                                <del>
                                  ৳{Number(item.price).toLocaleString("bn-BD")}
                                </del>
                              </>
                            ) : (
                              <strong>
                                ৳{Number(item.price).toLocaleString("bn-BD")}
                              </strong>
                            )}
                          </div>
                          <span className="in-stock-badge">
                            ✓ ইন স্টক
                          </span>
                        </div>

                        {/* Quantity & Total Actions Box for Mobile/Desktop */}
                        <div className="cart-item-actions">
                          {/* Quantity Counter */}
                          <div className="quantity-counter">
                            <button
                              onClick={() => change(item.id, item.quantity - 1)}
                              aria-label="কমিয়ে দিন"
                            >
                              −
                            </button>
                            <span>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => change(item.id, item.quantity + 1)}
                              aria-label="বাড়িয়ে দিন"
                            >
                              +
                            </button>
                          </div>

                          {/* Subtotal & Delete */}
                          <div className="cart-item-totals">
                            <span className="line-total-price">
                              ৳{lineTotal.toLocaleString("bn-BD")}
                            </span>
                            <button
                              onClick={() => remove(item.id)}
                              className="remove-item-btn"
                            >
                              🗑️ সরান
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              {/* Order Summary Sidebar */}
              <aside className="cart-summary-sidebar">
                <h2 className="summary-title">
                  অর্ডার সারাংশ
                </h2>

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>আইটেম মোট</span>
                    <span>৳{total.toLocaleString("bn-BD")}</span>
                  </div>
                  <div className="summary-row">
                    <span>ডেলিভারি চার্জ</span>
                    <span className="free-tag">চেকআউটে হিসেব হবে</span>
                  </div>
                  <hr className="summary-divider" />
                  <div className="summary-row grand-total">
                    <span>সর্বমোট</span>
                    <span className="total-amount">৳{total.toLocaleString("bn-BD")}</span>
                  </div>
                </div>

                <Link href="/checkout" className="checkout-btn">
                  অর্ডার সম্পন্ন করতে এগিয়ে যান →
                </Link>

                <div className="trust-badge">
                  🛡️ <span>নিরাপদ ও সহজ অর্ডার প্রক্রিয়া</span>
                </div>
              </aside>
            </div>
          ) : (
            /* Empty Cart View */
            <section className="empty-cart-view">
              <div className="empty-icon">🛒</div>
              <h2>
                আপনার কার্ট এখনো খালি!
              </h2>
              <p>
                পছন্দের হোম ডেকর ও প্রয়োজনীয় পণ্য কার্টে যোগ করে কেনাকাটা শুরু করুন।
              </p>
              <Link href="/#shop" className="start-shopping-btn">
                শপিং শুরু করুন
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
        .checkout-btn {
          display: block;
          width: 100%;
          text-align: center;
          background-color: #10b981;
          color: #ffffff;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 14px 20px;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
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

