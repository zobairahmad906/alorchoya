import { Header, ProductCatalog } from "../components";
import type { Product } from "../types";
const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
async function getProducts(): Promise<Product[]> { try { const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } }); return response.ok ? response.json() : []; } catch { return []; } }
export default async function ShopPage({ searchParams }: { searchParams: { category?: string } }) { const products = await getProducts(); return <><Header /><main className="listing-page"><div className="listing-shell"><div className="listing-heading"><span className="checkout-kicker">আলোর ছোঁয়া মার্ট</span><h1>সব পণ্য</h1><p>আপনার ঘরের জন্য পছন্দের পণ্য খুঁজে নিন।</p></div><ProductCatalog products={products} initialCategory={searchParams.category || "all"} /></div></main></>; }
