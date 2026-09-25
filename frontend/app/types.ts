export type Review = {
  id: number;
  customer_name: string;
  avatar_url?: string;
  rating: number;
  comment: string;
  created_at: string;
  product_name?: string;
  product_slug?: string;
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
  images: { id: number; image: string; hero_desktop?: string | null; hero_mobile?: string | null; alt_text: string; is_primary: boolean }[];
  reviews?: Review[];
  average_rating?: number;
  total_reviews?: number;
};

export type CartItem = Product & { quantity: number };
