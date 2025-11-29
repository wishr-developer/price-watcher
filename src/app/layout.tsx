import type { Metadata } from "next";
import Footer from "@/components/Footer";
import { CategoryProvider } from "@/contexts/CategoryContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Watcher - 商品価格比較・検索サイト",
  description: "Amazon商品の価格変動を監視・比較するサイト",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-text-main font-sans selection:bg-primary/20">
        <CategoryProvider>
          {children}
          <Footer />
        </CategoryProvider>
      </body>
    </html>
  );
}
