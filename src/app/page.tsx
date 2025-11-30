'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { Product } from '@/types/product';
import { Crown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

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
 * 割引率を計算する関数
 */
function calculateDiscountPercent(product: Product): number {
  const history = product.priceHistory || [];
  if (history.length < 2) return 0;

  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  if (diff >= 0) return 0;
  
  return prev > 0 ? Math.round((Math.abs(diff) / prev) * 100) : 0;
}

type SortOption = 'recommended' | 'discount' | 'price' | 'newest';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('newest'); // デフォルトを新着順に
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [trendScrollIndex, setTrendScrollIndex] = useState(0);
  
  useEffect(() => { 
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts); 
  }, []);

  // 検索・ソート・フィルタリングロジック
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. 検索フィルター（賢いバージョン）
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: Product) => {
        const name = p.name.toLowerCase();
        
        // 基本的な一致チェック
        const isMatch = name.includes(query);
        if (!isMatch) return false;

        // 🚫 除外ロジック
        if (query === 'apple' || query === 'アップル') {
          if (name.includes('香り') || name.includes('トリートメント') || name.includes('ヘア') || name.includes('ボディ') || name.includes('シャンプー')) {
            return false;
          }
        }

        return true;
      });
    }

    // 2. ソート
    switch (sortOption) {
      case 'recommended':
        // おすすめ順（スコア順）
        result.sort((a, b) => {
          const scoreA = calculateDealScore(a);
          const scoreB = calculateDealScore(b);
          return scoreB - scoreA;
        });
        break;
      
      case 'discount':
        // 割引率が高い順
        result.sort((a, b) => {
          const discountA = calculateDiscountPercent(a);
          const discountB = calculateDiscountPercent(b);
          return discountB - discountA;
        });
        break;
      
      case 'price':
        // 価格が安い順
        result.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      
      case 'newest':
        // 新着順（最新の価格履歴の日付順）
        result.sort((a, b) => {
          const dateA = a.priceHistory && a.priceHistory.length > 0 
            ? new Date(a.priceHistory[a.priceHistory.length - 1].date).getTime() 
            : 0;
          const dateB = b.priceHistory && b.priceHistory.length > 0 
            ? new Date(b.priceHistory[b.priceHistory.length - 1].date).getTime() 
            : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [products, searchQuery, sortOption]);

  // トレンドTOP3（スコア順）
  const trendProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const scoreA = calculateDealScore(a);
      const scoreB = calculateDealScore(b);
      return scoreB - scoreA;
    });
    return sorted.filter(p => calculateDealScore(p) > 0).slice(0, 3);
  }, [products]);

  const sortLabels: Record<SortOption, string> = {
    recommended: 'おすすめ順',
    discount: '割引率が高い順',
    price: '価格が安い順',
    newest: '新着順',
  };

  return (
    <>
      <Header onSearch={setSearchQuery} />
      <div className="pb-20">
        {/* Liveヘッダー */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 py-3 px-4">
          <div className="container mx-auto max-w-4xl flex items-center justify-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-bold text-gray-900">Xiora Live Market</span>
            <span className="text-xs text-gray-600">現在 {products.length}商品をリアルタイム監視中</span>
          </div>
        </div>

        {/* 本日のトレンド（TOP3カルーセル） */}
        {trendProducts.length > 0 && !searchQuery && (
          <section className="bg-white border-b border-gray-200 py-6 px-4">
            <div className="container mx-auto max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-slate-900">本日のトレンド</h2>
              </div>
              <div className="relative">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-4 pb-2">
                    {trendProducts.map((product, index) => (
                      <a
                        key={product.id}
                        href={product.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 w-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Crown size={14} className="text-yellow-500" />
                          <span className="text-xs font-bold text-purple-600">No.{index + 1}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 line-clamp-2 mb-2">
                          {product.name}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ¥{product.currentPrice.toLocaleString()}
                          </span>
                          {product.priceHistory.length >= 2 && (
                            <span className="text-xs text-gray-400 line-through">
                              ¥{product.priceHistory[product.priceHistory.length - 2].price.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-red-600 font-semibold mt-1">
                          AI Deal Score: {calculateDealScore(product)}/100
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* タイムライン（1カラム表示） */}
        <div className="container mx-auto max-w-4xl px-4">
          {searchQuery && (
            <div className="py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    「{searchQuery}」の検索結果
                  </h2>
                  <span className="text-sm text-gray-500">
                    {filteredProducts.length}件 / 全{products.length}件
                  </span>
                </div>
                
                {/* 並び替えボタン */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                  >
                    <ArrowUpDown size={16} />
                    <span>{sortLabels[sortOption]}</span>
                  </button>
                  
                  {showSortMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowSortMenu(false)}
                      ></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                        {Object.entries(sortLabels).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSortOption(key as SortOption);
                              setShowSortMenu(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                              sortOption === key ? 'text-blue-600 font-semibold bg-blue-50' : 'text-gray-700'
                            } ${key !== 'recommended' ? 'border-t border-gray-100' : ''}`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">商品が見つかりませんでした</p>
              <p className="text-gray-400 text-sm">検索条件を変更してお試しください</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
