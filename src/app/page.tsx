'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import { Product } from '@/types/product';
import { Crown } from 'lucide-react';

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

type TabType = 'drops' | 'new' | 'ranking' | 'all';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  useEffect(() => { 
    fetch('/api/products')
      .then(res => res.json())
      .then(setProducts); 
  }, []);

  // タブに応じたフィルタリング
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p: Product) => {
        const name = p.name.toLowerCase();
        const isMatch = name.includes(query);
        if (!isMatch) return false;

        if (query === 'apple' || query === 'アップル') {
          if (name.includes('香り') || name.includes('トリートメント') || name.includes('ヘア') || name.includes('ボディ') || name.includes('シャンプー')) {
            return false;
          }
        }

        return true;
      });
    }

    // タブフィルター
    switch (activeTab) {
      case 'drops':
        // 値下がり速報
        result = result.filter((p: Product) => {
          const history = p.priceHistory || [];
          if (history.length < 2) return false;
          const latest = p.currentPrice;
          const prev = history[history.length - 2].price;
          return latest < prev;
        });
        // 値下がり率が高い順にソート
        result.sort((a, b) => {
          const historyA = a.priceHistory || [];
          const historyB = b.priceHistory || [];
          if (historyA.length < 2 || historyB.length < 2) return 0;
          const diffA = a.currentPrice - historyA[historyA.length - 2].price;
          const diffB = b.currentPrice - historyB[historyB.length - 2].price;
          return diffA - diffB; // より値下がりしている順
        });
        break;
      
      case 'new':
        // 新着（登録が新しい順）
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
      
      case 'ranking':
        // ランキング（Deal Score順）
        result.sort((a, b) => {
          const scoreA = calculateDealScore(a);
          const scoreB = calculateDealScore(b);
          return scoreB - scoreA;
        });
        break;
      
      case 'all':
      default:
        // すべて（新着順）
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
  }, [products, searchQuery, activeTab]);

  // トレンドTOP3（スコア順）
  const trendProducts = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const scoreA = calculateDealScore(a);
      const scoreB = calculateDealScore(b);
      return scoreB - scoreA;
    });
    return sorted.filter(p => calculateDealScore(p) > 0).slice(0, 3);
  }, [products]);

  const tabs: Array<{ id: TabType; label: string; emoji: string }> = [
    { id: 'drops', label: '値下がり速報', emoji: '🔥' },
    { id: 'new', label: '新着', emoji: '✨' },
    { id: 'ranking', label: 'ランキング', emoji: '👑' },
    { id: 'all', label: 'すべて', emoji: '' },
  ];

  return (
    <>
      <Header onSearch={setSearchQuery} />
      <div className="pb-20 bg-[#f8f9fa] min-h-screen">
        {/* Liveヘッダー */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 py-3 px-4">
          <div className="container mx-auto max-w-7xl flex items-center justify-center gap-3">
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
            <div className="container mx-auto max-w-7xl">
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

        {/* タブ切り替えUI */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {tab.emoji && <span className="mr-1">{tab.emoji}</span>}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 商品グリッド */}
        <div className="container mx-auto max-w-7xl px-4 py-6">
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                「{searchQuery}」の検索結果
              </h2>
              <span className="text-sm text-gray-500">
                {filteredProducts.length}件 / 全{products.length}件
              </span>
            </div>
          )}
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-2">商品が見つかりませんでした</p>
              <p className="text-gray-400 text-sm">検索条件を変更してお試しください</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
