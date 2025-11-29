'use client';

import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import { Product } from '@/types/product';
import { Crown } from 'lucide-react';

/**
 * Deal Scoreを計算する関数（ProductCardと同じロジック）
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => { 
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts); 
  }, []);

  // Deal Scoreでソート（降順）
  const sortedProducts = [...products].sort((a, b) => {
    const scoreA = calculateDealScore(a);
    const scoreB = calculateDealScore(b);
    return scoreB - scoreA;
  });

  // ベストバイ商品（スコアが最も高い商品）
  const bestDeal = sortedProducts.length > 0 && calculateDealScore(sortedProducts[0]) > 0 
    ? sortedProducts[0] 
    : null;

  return (
    <div className="pb-20">
      {/* ヒーローセクション（アイキャッチ） */}
      <section className="bg-surface border-b border-border py-16 px-4 mb-10">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
            買い時の商品が、<br className="md:hidden" /><span className="text-blue-600">一瞬でわかる。</span>
          </h1>
          <p className="text-gray-500 mb-8 max-w-2xl mx-auto text-sm md:text-base">
            Amazonの価格変動を24時間365日監視。
            <br />
            今、本当に安くなっている商品だけを厳選して表示します。
          </p>
          <div className="flex justify-center gap-2 text-sm font-medium overflow-x-auto pb-2">
            {['Apple', 'Anker', 'Sony', 'Nintendo', '食品', '日用品'].map(tag => (
              <button key={tag} className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm">
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 本日のベストバイセクション */}
      {bestDeal && (
        <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-b border-border py-12 px-4 mb-10">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-slate-900">本日のベストバイ</h2>
            <span className="text-sm text-gray-500">Today's Best Deal</span>
          </div>
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
            <div className="grid md:grid-cols-2 gap-6 items-center">
              {/* 画像 */}
              <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center overflow-hidden">
                <img 
                  src={bestDeal.imageUrl} 
                  alt={bestDeal.name} 
                  className="w-full h-full object-contain mix-blend-multiply p-8" 
                />
              </div>
              {/* 情報 */}
              <div className="flex flex-col gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full mb-3">
                    <Crown size={12} />
                    <span>AI Deal Score: {calculateDealScore(bestDeal)}/100</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3 leading-tight">
                    {bestDeal.name}
                  </h3>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-slate-900">
                      ¥{bestDeal.currentPrice.toLocaleString()}
                    </span>
                    {bestDeal.priceHistory.length >= 2 && (
                      <span className="text-lg text-gray-400 line-through">
                        ¥{bestDeal.priceHistory[bestDeal.priceHistory.length - 2].price.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-red-600 font-semibold mb-4">
                    {bestDeal.priceHistory.length >= 2 && (
                      <>
                        ¥{Math.abs(bestDeal.currentPrice - bestDeal.priceHistory[bestDeal.priceHistory.length - 2].price).toLocaleString()} 値下がり
                      </>
                    )}
                  </div>
                </div>
                <a
                  href={bestDeal.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-center"
                >
                  Amazonで詳細を見る →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 商品グリッド */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">注目の値下がり商品</h2>
          <span className="text-sm text-gray-500">{products.length}商品を監視中</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {sortedProducts.map((p, index) => (
            <ProductCard key={p.id} product={p} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
