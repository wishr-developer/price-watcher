"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * ヘッダーコンポーネント（Amazon風デザイン）
 */
export function Header() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { name: "パソコン", slug: "computers" },
    { name: "家電", slug: "electronics" },
    { name: "キッチン", slug: "kitchen" },
    { name: "ゲーム", slug: "videogames" },
    { name: "ヘルスケア", slug: "hpc" },
    { name: "ビューティー", slug: "beauty" },
    { name: "食品", slug: "food" },
    { name: "文房具", slug: "office" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // 検索機能はモック（今後実装可能）
    console.log("検索:", searchQuery);
  };

  return (
    <header className="bg-[#232f3e] text-white sticky top-0 z-50 shadow-md">
      {/* メインヘッダー */}
      <div className="bg-[#232f3e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* ロゴ */}
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">Price Watcher</span>
            </Link>

            {/* 検索バー */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-4 hidden md:flex">
              <div className="flex w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="商品を検索..."
                  className="flex-1 px-4 py-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
                />
                <button
                  type="submit"
                  className="bg-[#ff9900] hover:bg-[#ff8800] px-6 py-2 rounded-r-md transition-colors"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* モバイル検索アイコン */}
            <button className="md:hidden p-2">
              <svg
                className="w-6 h-6"
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
      </div>

      {/* カテゴリナビゲーション */}
      <div className="bg-[#1a2332] border-t border-[#3a4553]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/?category=${category.slug}`}
                className="px-4 py-3 text-sm font-medium hover:bg-[#232f3e] transition-colors whitespace-nowrap"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}

