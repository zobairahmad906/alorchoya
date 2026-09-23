import "./globals.css";
import { CartProvider } from "./cart";

export const metadata = { title: "Atelier Store", description: "A modern everyday store" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><CartProvider>{children}</CartProvider></body></html>;
}
