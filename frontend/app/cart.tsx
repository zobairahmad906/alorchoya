"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { CartItem, Product } from "./types";

type CartContextType = { items: CartItem[]; count: number; total: number; add: (product: Product) => void; remove: (id: number) => void; change: (id: number, quantity: number) => void; clear: () => void };
const CartContext = createContext<CartContextType | null>(null);
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { const saved = localStorage.getItem("atelier-cart"); if (saved) setItems(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem("atelier-cart", JSON.stringify(items)); }, [items]);
  const add = (product: Product) => setItems(old => { const found = old.find(x => x.id === product.id); return found ? old.map(x => x.id === product.id ? { ...x, quantity: Math.min(x.quantity + 1, product.stock) } : x) : [...old, { ...product, quantity: 1 }]; });
  const remove = (id: number) => setItems(old => old.filter(x => x.id !== id));
  const change = (id: number, quantity: number) => setItems(old => quantity < 1 ? old.filter(x => x.id !== id) : old.map(x => x.id === id ? { ...x, quantity: Math.min(quantity, x.stock) } : x));
  const clear = () => setItems([]);
  const count = items.reduce((n, x) => n + x.quantity, 0);
  const total = items.reduce((n, x) => n + Number(x.price) * x.quantity, 0);
  return <CartContext.Provider value={{items, count, total, add, remove, change, clear}}>{children}</CartContext.Provider>;
}
export const useCart = () => { const context = useContext(CartContext); if (!context) throw new Error("useCart must be within CartProvider"); return context; };
