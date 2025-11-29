"use client";

import { useState } from "react";

interface SidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  priceRange: { min: number; max: number } | null;
  onPriceRangeChange: (range: { min: number; max: number } | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * サイドバーコンポーネント（カテゴリ絞り込み、価格帯フィルタ）
 */
export function Sidebar({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  isOpen,
  onClose,
}: SidebarProps) {
  const [minPrice, setMinPrice] = useState(priceRange?.min.toString() || "");
  const [maxPrice, setMaxPrice] = useState(priceRange?.max.toString() || "");

  const categories = [
    { name: "すべて", slug: null },
    { name: "パソコン", slug: "computers" },
    { name: "家電", slug: "electronics" },
    { name: "キッチン", slug: "kitchen" },
    { name: "ゲーム", slug: "videogames" },
    { name: "ヘルスケア", slug: "hpc" },
    { name: "ビューティー", slug: "beauty" },
    { name: "食品", slug: "food" },
    { name: "文房具", slug: "office" },
  ];

  const handlePriceFilter = () => {
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : Infinity;
    if (min > 0 || max < Infinity) {
      onPriceRangeChange({ min, max });
    } else {
      onPriceRangeChange(null);
    }
  };

  const clearPriceFilter = () => {
    setMinPrice("");
    setMaxPrice("");
    onPriceRangeChange(null);
  };

  return (
    <>
      {/* モバイルオーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-full lg:h-auto
          w-64 bg-white border-r border-gray-200
          z-50 lg:z-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          overflow-y-auto
        `}
      >
        <div className="p-6">
          {/* モバイル閉じるボタン */}
          <div className="flex items-center justify-between mb-6 lg:hidden">
            <h2 className="text-lg font-bold text-gray-900">フィルター</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* カテゴリフィルタ */}
          <div className="mb-8">
            <h3 className="text-sm font-bold text-gray-900 mb-4">カテゴリ</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.slug || "all"}>
                  <button
                    onClick={() => onCategoryChange(category.slug)}
                    className={`
                      w-full text-left px-3 py-2 rounded-md text-sm
                      transition-colors
                      ${
                        selectedCategory === category.slug
                          ? "bg-[#ff9900] text-white font-medium"
                          : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 価格帯フィルタ */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-4">価格帯</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  最低価格（円）
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  最高価格（円）
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="上限なし"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePriceFilter}
                  className="flex-1 bg-[#ff9900] hover:bg-[#ff8800] text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  適用
                </button>
                <button
                  onClick={clearPriceFilter}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium py-2 px-4 rounded-md transition-colors"
                >
                  クリア
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

