'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { Product } from '@/types/product';
import { Crown, ArrowUpDown } from 'lucide-react';

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
  const [sortOption, setSortOption] = useState<SortOption>('recommended');
  const [showSortMenu, setShowSortMenu] = useState(false);
  
  useEffect(() => { 
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts); 
  }, []);

  // 検索フィルタリング
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // ソート処理
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    
    switch (sortOption) {
      case 'recommended':
        // おすすめ順（スコア順）
        return sorted.sort((a, b) => {
          const scoreA = calculateDealScore(a);
          const scoreB = calculateDealScore(b);
          return scoreB - scoreA;
        });
      
      case 'discount':
        // 割引率が高い順
        return sorted.sort((a, b) => {
          const discountA = calculateDiscountPercent(a);
          const discountB = calculateDiscountPercent(b);
          return discountB - discountA;
        });
      
      case 'price':
        // 価格が安い順
        return sorted.sort((a, b) => a.currentPrice - b.currentPrice);
      
      case 'newest':
        // 新着順（最新の価格履歴の日付順）
        return sorted.sort((a, b) => {
          const dateA = a.priceHistory && a.priceHistory.length > 0 
            ? new Date(a.priceHistory[a.priceHistory.length - 1].date).getTime() 
            : 0;
          const dateB = b.priceHistory && b.priceHistory.length > 0 
            ? new Date(b.priceHistory[b.priceHistory.length - 1].date).getTime() 
            : 0;
          return dateB - dateA;
        });
      
      default:
        return sorted;
    }
  }, [filteredProducts, sortOption]);

  // ベストバイ商品（スコアが最も高い商品）
  const bestDeal = sortedProducts.length > 0 && calculateDealScore(sortedProducts[0]) > 0 
    ? sortedProducts[0] 
    : null;

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
        {/* ヒーローセクション（アイキャッチ） */}
        <section className="relative bg-surface border-b border-border py-20 px-4 mb-10 overflow-hidden">
          {/* 背景グラデーション（ぼかし円） */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl opacity-60 animate-pulse"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>
          
          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              買い時の商品が、<br className="md:hidden" />
              <span className="text-blue-600">一瞬でわかる。</span>
            </h1>
            <p className="text-gray-600 mb-10 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              Amazonの価格変動を24時間365日監視。
              <br />
              <span className="font-medium">今、本当に安くなっている商品だけを厳選して表示します。</span>
            </p>
            <div className="flex justify-center gap-2 text-sm font-medium overflow-x-auto pb-2">
              {['Apple', 'Anker', 'Sony', 'Nintendo', '食品', '日用品'].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setSearchQuery(tag)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
                >
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
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                {searchQuery ? `「${searchQuery}」の検索結果` : '注目の値下がり商品'}
              </h2>
              <span className="text-sm text-gray-500">
                {sortedProducts.length}件{searchQuery && ` / 全${products.length}件`}
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
              
              {/* 並び替えメニュー */}
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
          
          {sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">商品が見つかりませんでした</p>
              <p className="text-gray-400 text-sm">検索条件を変更してお試しください</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {sortedProducts.map((p, index) => (
                <ProductCard key={p.id} product={p} rank={index + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
