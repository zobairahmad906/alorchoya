import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { effectivePrice, type Product } from '@/lib/api';

export type CartItem = Product & { quantity: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (p: Product, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const KEY = 'alor-cart-v1';
const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setItems(JSON.parse(raw)))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => undefined);
  }, [items, ready]);

  const add = useCallback((p: Product, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      if (found) {
        return cur.map((i) =>
          i.id === p.id ? { ...i, quantity: Math.min(i.quantity + qty, Math.max(p.stock, 1)) } : i,
        );
      }
      return [...cur, { ...p, quantity: qty }];
    });
  }, []);

  const setQty = useCallback((id: number, qty: number) => {
    setItems((cur) =>
      qty <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const remove = useCallback((id: number) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      items,
      count: items.reduce((s, i) => s + i.quantity, 0),
      total: items.reduce((s, i) => s + effectivePrice(i) * i.quantity, 0),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, add, setQty, remove, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}

