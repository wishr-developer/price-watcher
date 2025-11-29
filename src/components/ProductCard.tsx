"use client";

import { Product } from "@/types/product";

interface ProductCardProps {
  product: Product;
}

/**
 * 商品カードコンポーネント（ECサイト風）
 */
export default function ProductCard({ product }: ProductCardProps) {
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const percent = prev > 0 ? ((diff / prev) * 100).toFixed(1) : "0.0";

  // ステータス判定
  let status: "drop" | "rise" | "stable" = "stable";
  if (diff < 0) status = "drop";
  if (diff > 0) status = "rise";

  // 割引率を計算（価格が下がった場合）
  const discountPercent = status === "drop" ? Math.abs(Number(percent)) : 0;

  return (
    <div className="group bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden border border-border hover:border-primary/30 flex flex-col h-full">
      {/* 商品画像（大きく表示 - aspect-square） */}
      <div className="w-full aspect-square bg-surface flex items-center justify-center p-4 relative overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {/* 割引バッジ */}
        {status === "drop" && discountPercent > 0 && (
          <div className="absolute top-2 right-2 bg-danger text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
            {discountPercent}% OFF
          </div>
        )}
        {/* 最安値バッジ */}
        {status === "drop" && discountPercent > 5 && (
          <div className="absolute top-2 left-2 bg-success text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
            最安値
          </div>
        )}
      </div>

      {/* 商品情報 */}
      <div className="p-4 flex flex-col flex-1">
        {/* 商品名 */}
        <h3 className="text-sm font-medium text-text-main leading-tight line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* 価格（大きく強調） */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold text-text-main">
              ¥{latest.toLocaleString()}
            </span>
            {status === "drop" && (
              <span className="text-sm text-text-dim line-through">
                ¥{prev.toLocaleString()}
              </span>
            )}
          </div>
          {status === "drop" && (
            <div className="text-xs text-success font-medium flex items-center gap-1">
              <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
              <span>
                {Math.abs(diff).toLocaleString()}円安 ({Math.abs(Number(percent))}%)
              </span>
            </div>
          )}
          {status === "rise" && (
            <div className="text-xs text-danger font-medium flex items-center gap-1">
              <svg width={12} height={12} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span>
                {Math.abs(diff).toLocaleString()}円高 ({Math.abs(Number(percent))}%)
              </span>
            </div>
          )}
        </div>

        {/* Amazonで見るボタン（オレンジ、幅100%） */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto w-full bg-primary hover:bg-accent text-white text-center font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <span>Amazonで見る</span>
          <svg
            width={16}
            height={16}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
