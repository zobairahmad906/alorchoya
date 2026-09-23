export type Product = { id: number; name: string; slug: string; description: string; price: string; discount_price?: string | null; stock: number; is_featured?: boolean; category: { name: string; slug: string }; images: { id: number; image: string; alt_text: string; is_primary: boolean }[] };
export type CartItem = Product & { quantity: number };
