import "./globals.css";
import { CartProvider } from "./cart";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

export const metadata = {
  title: "আলোর ছোঁয়া মার্ট",
  description: "বাংলাদেশের প্রিমিয়াম হোম ডেকর ও ফার্নিচার স্টোর",
  icons: { icon: "/alorchoya-logo.jpeg", shortcut: "/alorchoya-logo.jpeg", apple: "/alorchoya-logo.jpeg" }
};
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return <html lang={locale}><body><NextIntlClientProvider locale={locale} messages={messages}><CartProvider>{children}</CartProvider></NextIntlClientProvider></body></html>;
}
