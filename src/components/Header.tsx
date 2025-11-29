"use client";

import Link from "next/link";
import { useCategory } from "@/contexts/CategoryContext";

/**
 * ヘッダーコンポーネント（スティッキーヘッダー - ECメディア風）
 */
export default function Header() {
  const { selectedCategory, setSelectedCategory } = useCategory();

  const categories = [
    { id: "all", name: "すべて" },
    { id: "computers", name: "パソコン" },
    { id: "electronics", name: "家電" },
    { id: "videogames", name: "ゲーム" },
    { id: "kitchen", name: "キッチン" },
    { id: "hpc", name: "ヘルスケア" },
    { id: "beauty", name: "ビューティー" },
    { id: "food", name: "食品" },
    { id: "office", name: "文房具" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* メインヘッダー */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* ロゴ */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-text-main">Price Watcher</span>
          </Link>

          {/* 検索バー（中央） */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="商品を検索..."
                className="w-full h-10 px-4 pr-10 bg-surface border border-border rounded-full text-text-main placeholder:text-text-dim focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary hover:bg-accent rounded-full flex items-center justify-center transition-colors">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* モバイル検索アイコン */}
          <button className="md:hidden p-2 rounded-full hover:bg-surface transition-colors">
            <svg
              className="w-6 h-6 text-text-main"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* カテゴリナビゲーション */}
      <div className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-surface hover:text-text-main"
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
