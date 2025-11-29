"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { useCategory } from "@/contexts/CategoryContext";
import { Product } from "@/types/product";

/**
 * カテゴリを推測する（商品名から）
 */
function guessCategory(product: Product): string | null {
  const name = product.name.toLowerCase();
  if (
    name.includes("pc") ||
    name.includes("パソコン") ||
    name.includes("macbook") ||
    name.includes("ipad") ||
    name.includes("タブレット")
  ) {
    return "computers";
  }
  if (
    name.includes("家電") ||
    name.includes("イヤホン") ||
    name.includes("ヘッドホン") ||
    name.includes("充電") ||
    name.includes("ケーブル")
  ) {
    return "electronics";
  }
  if (
    name.includes("キッチン") ||
    name.includes("フライパン") ||
    name.includes("鍋") ||
    name.includes("食器")
  ) {
    return "kitchen";
  }
  if (
    name.includes("ゲーム") ||
    name.includes("switch") ||
    name.includes("playstation") ||
    name.includes("nintendo")
  ) {
    return "videogames";
  }
  if (
    name.includes("プロテイン") ||
    name.includes("サプリ") ||
    name.includes("健康") ||
    name.includes("洗剤")
  ) {
    return "hpc";
  }
  if (name.includes("化粧") || name.includes("スキンケア") || name.includes("美容")) {
    return "beauty";
  }
  if (name.includes("食品") || name.includes("飲料") || name.includes("お菓子")) {
    return "food";
  }
  if (name.includes("文房具") || name.includes("ペン") || name.includes("ノート")) {
    return "office";
  }
  return null;
}

/**
 * メインページ（ECメディア風）
 */
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const { selectedCategory } = useCategory();

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts);
  }, []);

  // カテゴリフィルタリング
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => guessCategory(product) === selectedCategory);

  // 価格が下がった商品を取得（特集用）
  const featuredProducts = products
    .filter((product) => {
      const history = product.priceHistory || [];
      if (history.length < 2) return false;
      const latest = history[history.length - 1].price;
      const prev = history[history.length - 2].price;
      return latest < prev;
    })
    .slice(0, 6);

  return (
    <>
      <Header />
      <main className="min-h-screen">
        {/* ヒーローセクション（特集エリア） */}
        {selectedCategory === "all" && featuredProducts.length > 0 && (
          <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-12 border-b border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-text-main mb-2">
                    本日の目玉商品
                  </h2>
                  <p className="text-text-muted">
                    価格が下がったお得な商品をピックアップ
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 商品一覧 */}
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-main">
                {selectedCategory === "all" ? "すべての商品" : "商品一覧"}
              </h2>
              <span className="text-sm text-text-muted">
                {filteredProducts.length}件の商品
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-text-muted text-lg">商品が見つかりませんでした</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
