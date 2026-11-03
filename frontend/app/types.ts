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
  images: { id: number; image: string; hero_desktop?: string | null; hero_mobile?: string | null; card_image?: string | null; alt_text: string; is_primary: boolean }[];
  reviews?: Review[];
  average_rating?: number;
  total_reviews?: number;
};

export type CartItem = Product & { quantity: number };

export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  eyebrow: string;
  image: string;
  mobile_image?: string | null;
  button_text: string;
  button_link: string;
  product?: number | null;
  product_slug?: string | null;
  product_name?: string | null;
  product_price?: string | null;
  product_discount_price?: string | null;
  position: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

