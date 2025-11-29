"use client";

import { Product } from "@/types/product";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";

interface ProductCardProps {
  product: Product;
  priceChange: number;
  priceChangePercentage: number;
}

/**
 * 商品カードコンポーネント（ECサイト風）
 */
export function ProductCard({ product, priceChange, priceChangePercentage }: ProductCardProps) {
  const [showChart, setShowChart] = useState(false);

  // グラフ用データを準備（最新10件）
  const chartData = product.priceHistory
    .slice(-10)
    .map((entry) => ({
      date: new Date(entry.date).toLocaleDateString("ja-JP", {
        month: "short",
        day: "numeric",
      }),
      price: entry.price,
    }));

  // 価格をフォーマット
  const formatPrice = (price: number): string => {
    return `¥${price.toLocaleString()}`;
  };

  // 価格変動の表示用
  const isPositive = priceChange > 0;
  const isNegative = priceChange < 0;
  const changeText = isPositive
    ? `+${formatPrice(priceChange)}`
    : isNegative
    ? formatPrice(priceChange)
    : "変動なし";

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200">
      {/* 商品画像 */}
      <div className="w-full h-64 bg-gray-50 overflow-hidden relative group">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* 商品情報 */}
      <div className="p-4">
        {/* 商品名（2行で省略） */}
        <h2 className="text-sm font-medium text-[#111111] mb-3 line-clamp-2 leading-snug h-10">
          {product.name}
        </h2>

        {/* 価格表示（大きく、赤文字で強調） */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">
              {formatPrice(product.currentPrice)}
            </span>
            {product.currentPrice === 0 && (
              <span className="text-xs text-gray-500">価格要確認</span>
            )}
          </div>
          {/* 前日比（小さく表示） */}
          {priceChange !== 0 && (
            <div className="mt-1">
              <span className="text-xs text-gray-500">前回比: </span>
              <span
                className={`text-xs font-medium ${
                  isPositive
                    ? "text-red-600"
                    : isNegative
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                {changeText}
                {priceChangePercentage !== 0 && (
                  <span className="ml-1">
                    ({isPositive ? "+" : ""}
                    {priceChangePercentage.toFixed(2)}%)
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* 価格推移グラフ（折りたたみ可能） */}
        {product.priceHistory.length > 1 && (
          <div className="mb-3">
            <button
              onClick={() => setShowChart(!showChart)}
              className="text-xs text-[#ff9900] hover:text-[#ff8800] font-medium mb-2"
            >
              {showChart ? "価格推移を隠す" : "価格推移を見る"}
            </button>
            {showChart && (
              <div className="h-32 bg-gray-50 rounded p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 9 }}
                      width={50}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatPrice(value)}
                      labelStyle={{ color: "#374151", fontSize: "10px" }}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "4px",
                        fontSize: "10px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#ff9900"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Amazonで見るボタン（オレンジ色、アイコン付き） */}
        <a
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#ff9900] hover:bg-[#ff8800] text-white text-center font-semibold py-2.5 px-4 rounded-md transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <span>Amazonで見る</span>
          <svg
            className="w-4 h-4"
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
