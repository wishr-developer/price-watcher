"use client";

import { ProductCard } from "@/components/ProductCard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Product } from "@/types/product";
import { useEffect, useState } from "react";

/**
 * 商品データを読み込む（クライアントサイド）
 */
async function getProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  if (!response.ok) {
    return [];
  }
  return response.json();
}

/**
 * 前日比を計算する
 */
function calculatePriceChange(
  currentPrice: number,
  priceHistory: Array<{ date: string; price: number }>
): {
  change: number;
  percentage: number;
} {
  if (priceHistory.length < 2) {
    return { change: 0, percentage: 0 };
  }

  // 最新の価格とその前の価格を比較
  const latestPrice = priceHistory[priceHistory.length - 1]?.price || currentPrice;
  const previousPrice = priceHistory[priceHistory.length - 2]?.price || currentPrice;

  const change = latestPrice - previousPrice;
  const percentage = previousPrice !== 0 ? (change / previousPrice) * 100 : 0;

  return { change, percentage };
}

/**
 * カテゴリを推測する（商品名から）
 */
function guessCategory(product: Product): string | null {
  const name = product.name.toLowerCase();
  if (name.includes("pc") || name.includes("パソコン") || name.includes("macbook") || name.includes("ipad") || name.includes("タブレット")) {
    return "computers";
  }
  if (name.includes("家電") || name.includes("イヤホン") || name.includes("ヘッドホン") || name.includes("充電") || name.includes("ケーブル")) {
    return "electronics";
  }
  if (name.includes("キッチン") || name.includes("フライパン") || name.includes("鍋") || name.includes("食器")) {
    return "kitchen";
  }
  if (name.includes("ゲーム") || name.includes("switch") || name.includes("playstation") || name.includes("nintendo")) {
    return "videogames";
  }
  if (name.includes("プロテイン") || name.includes("サプリ") || name.includes("健康") || name.includes("洗剤")) {
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
 * メインページ
 */
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // 商品データを読み込む
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch (error) {
        console.error("商品データの読み込みに失敗しました:", error);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  // URLパラメータからカテゴリを取得
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    if (category) {
      setSelectedCategory(category);
    }
  }, []);

  // フィルタリング
  useEffect(() => {
    let filtered = [...products];

    // カテゴリフィルタ
    if (selectedCategory) {
      filtered = filtered.filter((product) => guessCategory(product) === selectedCategory);
    }

    // 価格帯フィルタ
    if (priceRange) {
      filtered = filtered.filter((product) => {
        const price = product.currentPrice;
        return price >= priceRange.min && price <= priceRange.max;
      });
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, priceRange]);

  return (
    <div className="min-h-screen bg-[#f3f3f3]">
      <Header />

      {/* メインコンテンツ（2カラムレイアウト） */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* サイドバー */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <Sidebar
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
          </div>

          {/* モバイル用フィルターボタン */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="bg-white border border-gray-300 rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              フィルター
            </button>
          </div>

          {/* モバイルサイドバー */}
          <Sidebar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            priceRange={priceRange}
            onPriceRangeChange={setPriceRange}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* 商品グリッド */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-16">
                <p className="text-gray-500">読み込み中...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">商品が見つかりませんでした</p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600">
                  {filteredProducts.length}件の商品が見つかりました
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => {
                    const { change, percentage } = calculatePriceChange(
                      product.currentPrice,
                      product.priceHistory
                    );

                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        priceChange={change}
                        priceChangePercentage={percentage}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
