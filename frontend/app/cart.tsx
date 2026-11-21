"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, Product } from "./types";

function cleanCartImg(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url
    .replace(/minio-alorchoya\.newsmartagent\.com(-alorchoya\.newsmartagent\.com)+/gi, "minio-alorchoya.newsmartagent.com")
    .replace(/^https?:\/\/minio(?::9000)?(?=\/|$)/i, "https://minio-alorchoya.newsmartagent.com")
    .replace(/^http:\/\/minio-alorchoya/i, "https://minio-alorchoya");
}

type CartContextType = {
  items: CartItem[];
  count: number;
  total: number;
  add: (product: Product, showPopup?: boolean) => void;
  remove: (id: number) => void;
  change: (id: number, quantity: number) => void;
  clear: () => void;
  hydrated: boolean;
};

const CartContext = createContext<CartContextType | null>(null);

type AddedItem = { product: Product; quantity: number };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [popupItem, setPopupItem] = useState<AddedItem | null>(null);

  // Read cart once on initial client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("atelier-cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const valid = parsed
            .filter((x) => x && x.id && Number(x.quantity) > 0)
            .map((x) => ({ ...x, quantity: Number(x.quantity) }));
          setItems(valid);
        }
      }
    } catch {
      // storage unavailable or invalid json
    }
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "atelier-cart" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setItems(parsed.filter((x) => x && x.id && Number(x.quantity) > 0));
          }
        } catch {}
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Safely persist items to localStorage whenever state changes
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("atelier-cart", JSON.stringify(items));
    } catch {
      // storage quota or blocked
    }
  }, [items, hydrated]);

  // Pure add function: adds strictly 1 item when not present
  const add = (product: Product, showPopup: boolean = true) => {
    let finalQty = 1;
    setItems((old) => {
      const existing = old.find((x) => x.id === product.id);
      const maxStock = product.stock && Number(product.stock) > 0 ? Number(product.stock) : 99;
      if (existing) {
        finalQty = Math.min(existing.quantity + 1, maxStock);
        return old.map((x) => (x.id === product.id ? { ...x, quantity: finalQty } : x));
      }
      finalQty = 1;
      return [...old, { ...product, quantity: 1 }];
    });

    if (showPopup) {
      setPopupItem({ product, quantity: finalQty });
    }
  };

  const remove = (id: number) => {
    setItems((old) => old.filter((x) => x.id !== id));
  };

  const change = (id: number, quantity: number) => {
    setItems((old) => {
      if (quantity < 1) {
        return old.filter((x) => x.id !== id);
      }
      return old.map((x) => {
        if (x.id === id) {
          const maxStock = x.stock && Number(x.stock) > 0 ? Number(x.stock) : 99;
          return { ...x, quantity: Math.min(quantity, maxStock) };
        }
        return x;
      });
    });
  };

  const clear = () => {
    setItems([]);
  };

  const count = items.reduce((n, x) => n + (x.quantity || 0), 0);
  const total = items.reduce((n, x) => n + Number(x.discount_price || x.price) * (x.quantity || 1), 0);

  return (
    <CartContext.Provider value={{ items, count, total, add, remove, change, clear, hydrated }}>
      {children}

      {/* Cart Add Success Popup Modal */}
      {popupItem && (
        <div
          onClick={() => setPopupItem(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "24px 22px",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              textAlign: "center",
              position: "relative",
              border: "1px solid #e2e8f0",
              animation: "zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <button
              onClick={() => setPopupItem(null)}
              style={{
                position: "absolute",
                top: "14px",
                right: "16px",
                border: "none",
                background: "none",
                fontSize: "1.2rem",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="বন্ধ করুন"
            >
              ✕
            </button>

            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                backgroundColor: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px",
                fontSize: "1.6rem",
                fontWeight: 800,
              }}
            >
              ✓
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", color: "#0f172a", fontWeight: 800 }}>
              কার্টে যোগ করা হয়েছে!
            </h3>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
              পণ্যটি আপনার শপিং কার্টে যুক্ত হয়েছে।
            </p>

            {/* Product Preview Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#f8fafc",
                padding: "12px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                marginBottom: "18px",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "#e2e8f0",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {popupItem.product.images?.[0] ? (
                  <img
                    src={cleanCartImg(
                      popupItem.product.images[0].card_image ||
                        popupItem.product.images[0].hero_desktop ||
                        popupItem.product.images[0].image
                    )}
                    alt={popupItem.product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: "1.5rem" }}>📦</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong
                  style={{
                    fontSize: "0.92rem",
                    color: "#0f172a",
                    display: "block",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {popupItem.product.name}
                </strong>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <span style={{ fontSize: "0.95rem", color: "#059669", fontWeight: 800 }}>
                    ৳{Number(popupItem.product.discount_price || popupItem.product.price).toLocaleString("bn-BD")}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    (পরিমাণ: {popupItem.quantity})
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <a
                  href="/cart"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/cart";
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f1f5f9",
                    color: "#0f172a",
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    border: "1px solid #cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  🛒 কার্ট দেখুন
                </a>
                <a
                  href="/checkout"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = "/checkout";
                  }}
                  className="cart-popup-checkout-btn"
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "linear-gradient(115deg, #047857 0%, #10b981 30%, #06b6d4 70%, #059669 100%)",
                    backgroundSize: "250% 250%",
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    boxShadow: "0 6px 18px rgba(16, 185, 129, 0.45), 0 0 15px rgba(6, 182, 212, 0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    animation: "auroraWave 4s ease infinite",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    ⚡ অর্ডার সম্পন্ন করুন ➔
                  </span>
                </a>
              </div>
              <style>{`
                @keyframes auroraWave {
                  0% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                  100% { background-position: 0% 50%; }
                }
                @keyframes shimmerWave {
                  0% { transform: translateX(-150%) rotate(25deg); }
                  100% { transform: translateX(250%) rotate(25deg); }
                }
                .cart-popup-checkout-btn::after {
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
              `}</style>
              <button
                type="button"
                onClick={() => setPopupItem(null)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                আরো কেনাকাটা করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be within CartProvider");
  return context;
};
