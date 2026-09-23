import { Header } from "../../components";
import ProductClient from "./product-client";
import type { Product } from "../../types";
const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
export default async function ProductPage({ params }: { params: { slug: string } }) { try { const res = await fetch(`${API}/products/${params.slug}/`, { cache: "no-store" }); if (!res.ok) return <><Header/><main className="empty">Product not found.</main></>; const product: Product = await res.json(); return <><Header/><ProductClient product={product}/></>; } catch { return <><Header/><main className="empty">Product not found.</main></>; } }
