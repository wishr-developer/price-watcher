"use client";

import { ExternalLink, ArrowDownRight } from 'lucide-react';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  rank?: number;
}

/**
 * Deal Scoreを計算する関数
 */
function calculateDealScore(product: Product): number {
  const history = product.priceHistory || [];
  if (history.length < 2) return 0;

  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  if (diff >= 0) return 0;
  
  const discountPercent = prev > 0 ? (Math.abs(diff) / prev) * 100 : 0;
  const score = Math.min(discountPercent * 2, 100);
  
  return Math.round(score);
}

/**
 * AIコメントを生成する関数
 */
function generateAIComment(product: Product): { text: string; color: string; emoji: string } {
  const history = product.priceHistory || [];
  const dealScore = calculateDealScore(product);
  const hasEnoughData = history.length >= 2;
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;

  if (dealScore >= 90) {
    return {
      text: '【緊急速報】過去最安値を更新しました！',
      color: 'text-red-600',
      emoji: '🚨'
    };
  } else if (dealScore >= 70) {
    return {
      text: '値下がり検知。今が買い時です。',
      color: 'text-blue-600',
      emoji: '📉'
    };
  } else if (!hasEnoughData || history.length === 0) {
    return {
      text: '新着商品がリストに追加されました。',
      color: 'text-purple-600',
      emoji: '✨'
    };
  } else {
    return {
      text: '価格変動を監視中...',
      color: 'text-gray-600',
      emoji: '👀'
    };
  }
}

/**
 * タイムスタンプを生成（ランダムまたはデータ更新時刻）
 */
function generateTimestamp(product: Product): string {
  const history = product.priceHistory || [];
  if (history.length > 0) {
    const lastUpdate = new Date(history[history.length - 1].date);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'たった今 更新';
    if (diffMinutes < 60) return `${diffMinutes}分前 更新`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}時間前 更新`;
    return `${Math.floor(diffHours / 24)}日前 更新`;
  }
  
  // ランダムな分数（1-120分）
  const randomMinutes = Math.floor(Math.random() * 120) + 1;
  return `${randomMinutes}分前 更新`;
}

export default function ProductCard({ product }: ProductCardProps) {
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;
  
  const aiComment = generateAIComment(product);
  const timestamp = generateTimestamp(product);

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 flex gap-4 p-4 md:p-6"
    >
      {/* 左側：商品画像 */}
      <div className="flex-shrink-0">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply p-2"
            loading="lazy"
          />
        </div>
      </div>

      {/* 右側：情報エリア */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        {/* タイムスタンプ */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>🕒</span>
          <span>{timestamp}</span>
        </div>

        {/* AIコメント（大きく表示） */}
        <div className={`text-base md:text-lg font-bold ${aiComment.color} flex items-center gap-2`}>
          <span>{aiComment.emoji}</span>
          <span>{aiComment.text}</span>
        </div>

        {/* 商品名（控えめに） */}
        <h3 className="text-sm md:text-base text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>

        {/* 価格エリア（右端に大きく表示） */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {isCheaper && (
              <span className="flex items-center text-red-600 font-semibold">
                <ArrowDownRight size={14} className="mr-0.5" />
                ¥{Math.abs(diff).toLocaleString()} 値下がり
              </span>
            )}
          </div>
          
          <div className="flex items-baseline gap-2 text-right">
            {isCheaper && (
              <span className="text-sm text-gray-400 line-through">
                ¥{prev.toLocaleString()}
              </span>
            )}
            <span className="text-xl md:text-2xl font-bold text-gray-900">
              ¥{latest.toLocaleString()}
            </span>
            {isCheaper && (
              <span className="text-lg text-red-600">↘</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
