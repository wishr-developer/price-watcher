import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Watcher - Amazon商品価格監視",
  description: "Amazon商品の価格変動を監視するサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen bg-[#f3f3f3]">
        <div className="flex-grow">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

