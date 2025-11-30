"use client";

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Product } from '@/types/product';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface ProductCardProps {
  product: Product;
  rank?: number;
}

type PeriodType = '7D' | '30D' | 'ALL';

/**
 * カテゴリを推測する関数
 */
function guessCategory(product: Product): string {
  const name = product.name.toLowerCase();
  if (name.includes("pc") || name.includes("パソコン") || name.includes("macbook") || name.includes("ipad") || name.includes("タブレット")) {
    return "ガジェット";
  }
  if (name.includes("家電") || name.includes("イヤホン") || name.includes("ヘッドホン") || name.includes("充電") || name.includes("ケーブル")) {
    return "家電";
  }
  if (name.includes("キッチン") || name.includes("フライパン") || name.includes("鍋") || name.includes("食器")) {
    return "キッチン";
  }
  if (name.includes("ゲーム") || name.includes("switch") || name.includes("playstation") || name.includes("nintendo")) {
    return "ゲーム";
  }
  if (name.includes("プロテイン") || name.includes("サプリ") || name.includes("健康") || name.includes("洗剤")) {
    return "ヘルスケア";
  }
  if (name.includes("化粧") || name.includes("スキンケア") || name.includes("美容")) {
    return "ビューティー";
  }
  if (name.includes("食品") || name.includes("飲料") || name.includes("お菓子")) {
    return "食品";
  }
  if (name.includes("文房具") || name.includes("ペン") || name.includes("ノート")) {
    return "文房具";
  }
  return "その他";
}

/**
 * 期間に基づいて価格推移データをフィルタリング
 */
function prepareChartData(product: Product, period: PeriodType): Array<{ price: number }> {
  const history = product.priceHistory || [];
  
  if (history.length === 0) {
    return [{ price: product.currentPrice }];
  }

  let filteredHistory = [...history];

  if (period === '7D') {
    // 過去7日分（末尾から7件）
    filteredHistory = history.slice(-7);
  } else if (period === '30D') {
    // 過去30日分（末尾から30件）
    filteredHistory = history.slice(-30);
  }
  // 'ALL'の場合は全て

  return filteredHistory.map(h => ({ price: h.price }));
}

/**
 * グラフの色を決定
 */
function getChartColor(product: Product): string {
  const history = product.priceHistory || [];
  if (history.length < 2) return '#9ca3af'; // グレー
  
  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  if (diff < 0) return '#10b981'; // 緑（値下がり）
  if (diff > 0) return '#ef4444'; // 赤（値上がり）
  return '#9ca3af'; // グレー（変動なし）
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');
  
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;
  const isExpensive = diff > 0;
  
  const category = guessCategory(product);
  const chartData = prepareChartData(product, selectedPeriod);
  const chartColor = getChartColor(product);

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
    >
      {/* モバイル: 横並びレイアウト */}
      <div className="md:hidden flex gap-4 p-4">
        {/* 左: 大きな正方形画像 */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-contain mix-blend-multiply p-2"
              loading="lazy"
            />
          </div>
        </div>

        {/* 右: 情報エリア */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* カテゴリタグ */}
          <span className="text-xs text-gray-500 font-medium">{category}</span>
          
          {/* 商品名（2行制限） */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* 期間選択ボタンと価格推移グラフ */}
          <div className="space-y-1">
            {/* 期間選択ボタン */}
            <div className="flex gap-1">
              {(['7D', '30D', 'ALL'] as PeriodType[]).map((period) => (
                <button
                  key={period}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPeriod(period);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    selectedPeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* 価格推移グラフ */}
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#gradient-${product.id})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 価格とボタン */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-2">
              {isCheaper && (
                <span className="text-xs text-gray-400 line-through">
                  ¥{prev.toLocaleString()}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                ¥{latest.toLocaleString()}
              </span>
              {/* 価格変動額の表示 */}
              {diff !== 0 && (
                <span className={`text-xs font-semibold ${
                  isCheaper ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCheaper ? '-' : '+'}¥{Math.abs(diff).toLocaleString()}
                </span>
              )}
            </div>
            <button 
              onClick={(e) => e.preventDefault()}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* PC: 縦長カード型レイアウト */}
      <div className="hidden md:flex flex-col">
        {/* 画像（上部） */}
        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply p-4"
            loading="lazy"
          />
        </div>

        {/* 情報エリア（下部） */}
        <div className="p-4 flex flex-col gap-3">
          {/* カテゴリタグ */}
          <span className="text-xs text-gray-500 font-medium">{category}</span>
          
          {/* 商品名（2行制限） */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
            {product.name}
          </h3>

          {/* 期間選択ボタンと価格推移グラフ */}
          <div className="space-y-1">
            {/* 期間選択ボタン */}
            <div className="flex gap-1">
              {(['7D', '30D', 'ALL'] as PeriodType[]).map((period) => (
                <button
                  key={period}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPeriod(period);
                  }}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    selectedPeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            {/* 価格推移グラフ */}
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`gradient-pc-${product.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    fill={`url(#gradient-pc-${product.id})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 価格とボタン */}
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-2">
              {isCheaper && (
                <span className="text-sm text-gray-400 line-through">
                  ¥{prev.toLocaleString()}
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">
                ¥{latest.toLocaleString()}
              </span>
              {/* 価格変動額の表示 */}
              {diff !== 0 && (
                <span className={`text-sm font-semibold ${
                  isCheaper ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCheaper ? '-' : '+'}¥{Math.abs(diff).toLocaleString()}
                </span>
              )}
            </div>
            <button 
              onClick={(e) => e.preventDefault()}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Amazon</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
      </div>
    </a>
  );
}
