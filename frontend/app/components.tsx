"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "./cart";
import type { Product } from "./types";

export function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  return <><header><div className="wrap nav"><Link href="/" className="brand"><span className="mark">আ</span><span className="brand-name">আলোর ছোঁয়া মার্ট<small>Alor Chhoya Mart</small></span></Link><nav className="links"><Link href="/">হোম</Link><Link href="/#shop">শপ</Link><Link href="/#categories">ক্যাটাগরি</Link><Link href="/#contact">যোগাযোগ</Link></nav><div className="nav-right"><button className="lang-switch">বাংলা</button><button className="icon-btn" aria-label="Search">⌕</button><button className="icon-btn" onClick={() => setOpen(true)} aria-label="Cart">▱ <span>{count}</span></button></div></div></header><CartDrawer open={open} close={() => setOpen(false)} /></>;
}

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const image = product.images.find(x => x.is_primary)?.image || product.images[0]?.image;
  return <article className="prod-card"><Link href={`/products/${product.slug}`} className="prod-img">{image ? <img src={image} alt={product.name} /> : <div className="product-monogram">আ</div>}<span className="badge">জনপ্রিয়</span></Link><div className="prod-body"><Link href={`/products/${product.slug}`}><h3 className="t">{product.name}</h3></Link><div className="prod-price"><span className="now">৳{Number(product.price).toLocaleString("bn-BD")}</span></div><div className="prod-actions"><Link className="btn btn-ghost" href={`/products/${product.slug}`}>দেখুন</Link><button className="btn btn-primary" onClick={() => add(product)} disabled={!product.stock}>{product.stock ? "কার্টে যোগ" : "স্টক শেষ"}</button></div></div></article>;
}

function CartDrawer({ open, close }: { open: boolean; close: () => void }) {
  const { items, total, change, remove } = useCart();
  return <div className={`drawer-wrap ${open ? "is-open" : ""}`} aria-hidden={!open}><button className="drawer-backdrop" aria-label="বন্ধ করুন" onClick={close} /><aside className="drawer"><div className="drawer-head"><div><p>আপনার কার্ট</p><h2>{items.length ? "পছন্দের পণ্য" : "কার্ট খালি"}</h2></div><button onClick={close} aria-label="বন্ধ করুন">×</button></div><div className="drawer-items">{items.map(item => <div className="drawer-item" key={item.id}><div className="drawer-thumb">{item.images[0]?.image ? <img src={item.images[0].image} alt="" /> : "আ"}</div><div><h3>{item.name}</h3><p>৳{Number(item.price).toLocaleString("bn-BD")}</p><div className="drawer-quantity"><button onClick={() => change(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => change(item.id, item.quantity + 1)}>+</button><button className="remove" onClick={() => remove(item.id)}>বাদ দিন</button></div></div></div>)}</div>{items.length > 0 ? <div className="drawer-foot"><div><span>সাবটোটাল</span><strong>৳{total.toLocaleString("bn-BD")}</strong></div><Link className="wide" onClick={close} href="/checkout">চেকআউটে যান →</Link></div> : <Link className="wide" onClick={close} href="/#shop">শপিং শুরু করুন</Link>}</aside></div>;
}
