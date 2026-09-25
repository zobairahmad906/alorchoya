import Link from "next/link";
import { Header } from "../components";
import type { Product } from "../types";
const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
async function getProducts(): Promise<Product[]> { try { const response = await fetch(`${API}/products/`, { next: { revalidate: 30 } }); return response.ok ? response.json() : []; } catch { return []; } }
export default async function CategoriesPage() { const products = await getProducts(); const categories = Array.from(new Map(products.map(product => [product.category.slug, product.category])).values()); return <><Header /><main className="listing-page"><div className="listing-shell"><div className="listing-heading"><span className="checkout-kicker">আলোর ছোঁয়া মার্ট</span><h1>ক্যাটাগরি</h1><p>আপনার প্রয়োজন অনুযায়ী পণ্য বেছে নিন।</p></div><div className="category-page-grid">{categories.map(category => <Link className="category-page-card" key={category.slug} href={`/shop?category=${category.slug}`}><span>{category.name.slice(0, 1)}</span><h2>{category.name}</h2><small>পণ্য দেখুন →</small></Link>)}</div></div></main></>; }
