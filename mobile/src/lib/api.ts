export const API =
  process.env.EXPO_PUBLIC_API_URL || 'https://api-alorchoya.newsmartagent.com/api';

export const WHATSAPP = 'https://wa.me/8801302111188';

export type ProductImage = {
  id: number;
  image: string;
  hero_desktop?: string | null;
  hero_mobile?: string | null;
  card_image?: string | null;
  alt_text: string;
  is_primary: boolean;
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  discount_price?: string | null;
  stock: number;
  is_featured?: boolean;
  category: { name: string; slug: string };
  images: ProductImage[];
  average_rating?: number;
  total_reviews?: number;
};

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobile_image?: string | null;
  button_text: string;
  product_slug?: string | null;
};

export type Review = {
  id: number;
  customer_name: string;
  rating: number;
  comment: string;
};

export async function get<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`);
    return res.ok ? ((await res.json()) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Fixes internal docker / insecure media urls so images load on device. */
export function img(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url
    .replace(/^https?:\/\/minio(:9000)?\//i, 'https://minio-alorchoya.newsmartagent.com/')
    .replace(/^http:\/\/minio-alorchoya/i, 'https://minio-alorchoya');
}

export function productImage(p: Product): string | undefined {
  const primary = p.images?.find((i) => i.is_primary) || p.images?.[0];
  return img(primary?.card_image || primary?.hero_desktop || primary?.image);
}

export function effectivePrice(p: Product): number {
  const d = Number(p.discount_price);
  return d > 0 && d < Number(p.price) ? d : Number(p.price);
}

export function discountPercent(p: Product): number {
  const d = Number(p.discount_price);
  const base = Number(p.price);
  return d > 0 && d < base ? Math.round(((base - d) / base) * 100) : 0;
}

export function taka(n: number): string {
  return `৳${Math.round(n).toLocaleString('en-US')}`;
}

