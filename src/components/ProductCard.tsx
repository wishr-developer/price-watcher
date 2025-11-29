"use client";

import { ExternalLink, ArrowDownRight, Minus, Crown } from 'lucide-react';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  rank?: number; // ランキング順位（1, 2, 3...）
}

/**
 * Deal Scoreを計算する関数
 * 価格変動率を基に0-100のスコアを算出
 */
function calculateDealScore(product: Product): number {
  const history = product.priceHistory || [];
  if (history.length < 2) return 0;

  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  // 値下がりの場合のみスコアを計算
  if (diff >= 0) return 0;
  
  // 割引率を計算
  const discountPercent = prev > 0 ? (Math.abs(diff) / prev) * 100 : 0;
  
  // 割引率を0-100のスコアに変換（最大50%割引で100点）
  const score = Math.min(discountPercent * 2, 100);
  
  return Math.round(score);
}

/**
 * スコアからランクとラベルを取得
 */
function getScoreRank(score: number): { rank: 'S' | 'A' | 'B', label: string, color: string } {
  if (score >= 90) {
    return { rank: 'S', label: '過去最安級', color: 'from-purple-500 to-pink-500' };
  } else if (score >= 70) {
    return { rank: 'A', label: 'かなりお得', color: 'from-blue-500 to-cyan-500' };
  } else {
    return { rank: 'B', label: '通常価格', color: 'from-gray-400 to-gray-500' };
  }
}

/**
 * 円形ゲージコンポーネント
 */
function CircularGauge({ score, size = 60 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const { rank, color } = getScoreRank(score);
  
  const gradientId = `gradient-${rank}-${score}`;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            {rank === 'S' ? (
              <>
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </>
            ) : rank === 'A' ? (
              <>
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#6b7280" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* 背景円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        {/* スコア円 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{score}</span>
      </div>
    </div>
  );
}

export default function ProductCard({ product, rank }: ProductCardProps) {
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;
  
  // 割引率の計算
  const percent = prev > 0 ? Math.round((Math.abs(diff) / prev) * 100) : 0;
  
  // Deal Scoreを計算
  const dealScore = calculateDealScore(product);
  const scoreRank = getScoreRank(dealScore);

  return (
    <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer" 
       className="group bg-white rounded-2xl p-4 transition-all duration-300 hover:shadow-soft border border-transparent hover:border-gray-100 flex flex-col h-full relative overflow-hidden">
      
      {/* ランキングバッジ */}
      {rank && rank <= 3 && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
          <Crown size={10} />
          <span>No.{rank}</span>
        </div>
      )}

      {/* Deal Score円形ゲージ（右上） */}
      <div className="absolute top-3 right-3 z-20 group-hover:scale-110 transition-transform duration-300">
        <CircularGauge score={dealScore} size={56} />
      </div>

      {/* スコア詳細（ホバー時に表示） */}
      <div className="absolute top-3 right-3 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-white rounded-lg shadow-lg p-3 min-w-[140px] border border-gray-100">
          <div className="text-xs font-bold text-gray-900 mb-1">AI Deal Score</div>
          <div className={`text-lg font-bold bg-gradient-to-r ${scoreRank.color} bg-clip-text text-transparent mb-1`}>
            {scoreRank.rank}ランク
          </div>
          <div className="text-xs text-gray-600">{scoreRank.label}</div>
          <div className="text-xs text-gray-400 mt-1">スコア: {dealScore}/100</div>
        </div>
      </div>
      
      {/* 割引バッジ（安くなっている時だけ表示、ランキングバッジと重複しないように） */}
      {isCheaper && !rank && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
          {percent}% OFF
        </div>
      )}

      {/* 画像エリア */}
      <div className="aspect-square w-full mb-4 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply p-4" loading="lazy" />
      </div>

      {/* 情報エリア */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </h3>
        
        {/* スコアラベル（カード内） */}
        {dealScore > 0 && (
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mb-2 w-fit bg-gradient-to-r ${scoreRank.color} text-white`}>
            <span>{scoreRank.rank}: {scoreRank.label}</span>
          </div>
        )}
        
        <div className="mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">¥{latest.toLocaleString()}</span>
            {isCheaper && (
              <span className="text-xs text-gray-400 line-through">¥{prev.toLocaleString()}</span>
            )}
          </div>
          
          {/* 価格変動ステータス */}
          <div className="flex items-center gap-1 mt-1">
            {isCheaper ? (
              <span className="flex items-center text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight size={12} className="mr-0.5" /> 
                ¥{Math.abs(diff).toLocaleString()} 値下がり
              </span>
            ) : (
              <span className="flex items-center text-xs text-gray-400">
                <Minus size={12} className="mr-1" /> 変動なし
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
