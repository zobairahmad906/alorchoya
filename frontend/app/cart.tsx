"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { CartItem, Product } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

type CartContextType = { items: CartItem[]; count: number; total: number; add: (product: Product) => void; remove: (id: number) => void; change: (id: number, quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextType | null>(null);
type ServerCartItem = { product: Product; quantity: number };

type AddedItem = { product: Product; quantity: number };

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartToken, setCartToken] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [popupItem, setPopupItem] = useState<AddedItem | null>(null);
  const syncedIds = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    const loadCart = async () => {
      const saved = localStorage.getItem("atelier-cart");
      const savedToken = localStorage.getItem("atelier-cart-token") || window.crypto.randomUUID();
      localStorage.setItem("atelier-cart-token", savedToken);
      setCartToken(savedToken);
      let localItems: CartItem[] = [];
      if (saved) {
        try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) localItems = parsed.filter(item => item && item.id && item.stock > 0 && item.quantity > 0).map(item => ({ ...item, quantity: Math.min(item.quantity, item.stock) })); } catch { localStorage.removeItem("atelier-cart"); }
      }
      let serverItems: CartItem[] = [];
      try {
        const response = await fetch(`${API}/carts/${savedToken}/`, { credentials: "include", cache: "no-store" });
        if (response.ok) { const data = await response.json() as { items?: ServerCartItem[] }; serverItems = (data.items || []).filter(item => item.product && item.quantity > 0 && item.product.stock > 0).map(item => ({ ...item.product, quantity: Math.min(item.quantity, item.product.stock) })); }
      } catch { /* local cart remains available when API is unavailable */ }
      if (active) { setItems(serverItems.length ? serverItems : localItems); setHydrated(true); }
    };
    void loadCart();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("atelier-cart", JSON.stringify(items));
    if (!cartToken) return;
    const currentIds = items.map(item => item.id);
    void Promise.all(syncedIds.current.filter(id => !currentIds.includes(id)).map(id => fetch(`${API}/carts/${cartToken}/items/${id}/`, { method: "DELETE", credentials: "include" }).catch(() => undefined)));
    syncedIds.current = currentIds;
    void Promise.all(items.map(item => fetch(`${API}/carts/${cartToken}/items/`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ product_id: item.id, quantity: item.quantity }) }).catch(() => undefined)));
  }, [items, hydrated, cartToken]);

  const add = (product: Product) => {
    let addedQty = 1;
    setItems(old => {
      const found = old.find(x => x.id === product.id);
      if (found) {
        addedQty = found.quantity + 1;
        return old.map(x => x.id === product.id ? { ...x, quantity: Math.min(x.quantity + 1, product.stock) } : x);
      }
      return [...old, { ...product, quantity: 1 }];
    });
    setPopupItem({ product, quantity: addedQty });
  };

  const remove = (id: number) => setItems(old => old.filter(x => x.id !== id));
  const change = (id: number, quantity: number) => setItems(old => quantity < 1 ? old.filter(x => x.id !== id) : old.map(x => x.id === id ? { ...x, quantity: Math.min(quantity, x.stock) } : x));
  const clear = () => setItems([]);
  const count = items.reduce((n, x) => n + x.quantity, 0);
  const total = items.reduce((n, x) => n + Number(x.discount_price || x.price) * x.quantity, 0);

  return (
    <CartContext.Provider value={{items, count, total, add, remove, change, clear}}>
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
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(6px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "24px 28px",
              maxWidth: "420px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
              position: "relative",
              animation: "zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "1px solid #e2e8f0"
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
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#ecfdf5",
                color: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                fontSize: "1.8rem",
                fontWeight: 700
              }}
            >
              ✓
            </div>

            <h3 style={{ margin: "0 0 6px", fontSize: "1.25rem", color: "#0f172a", fontWeight: 700 }}>
              কার্টে যোগ করা হয়েছে!
            </h3>
            <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: "0.9rem" }}>
              পণ্যটি সফলভাবে আপনার শপিং কার্টে যুক্ত হয়েছে।
            </p>

            {/* Product Preview Card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "#f8fafc",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                marginBottom: "20px",
                textAlign: "left"
              }}
            >
              <div style={{ width: "50px", height: "50px", borderRadius: "8px", overflow: "hidden", backgroundColor: "#e2e8f0", flexShrink: 0 }}>
                {popupItem.product.images?.[0]?.image ? (
                  <img src={popupItem.product.images[0].hero_desktop || popupItem.product.images[0].image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.2rem", padding: "8px" }}>📦</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "0.92rem", color: "#1e293b", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {popupItem.product.name}
                </strong>
                <span style={{ fontSize: "0.83rem", color: "#059669", fontWeight: 700 }}>
                  ৳{Number(popupItem.product.discount_price || popupItem.product.price).toLocaleString("bn-BD")}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => setPopupItem(null)}
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "#f1f5f9",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                আরো কেনাকাটা করুন
              </button>
              <a
                href="/cart"
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  textDecoration: "none",
                  display: "inline-block",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                }}
              >
                কার্ট দেখুন ➔
              </a>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}
export const useCart = () => { const context = useContext(CartContext); if (!context) throw new Error("useCart must be within CartProvider"); return context; };
