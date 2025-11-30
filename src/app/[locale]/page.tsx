'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import AlertModal from '@/components/AlertModal';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import VirtualProductList from '@/components/VirtualProductList';
import { Product } from '@/types/product';
import { Crown, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import { useCategory } from '@/contexts/CategoryContext';

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
 * URLからASINを抽出（重複防止用）
 */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

type TabType = 'drops' | 'new' | 'ranking' | 'all';

// ページネーションは仮想スクロールで不要のため削除
// const ITEMS_PER_PAGE = 20;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ページネーションは仮想スクロールで不要のため削除
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const { selectedCategory, setSelectedCategory } = useCategory();

  // カテゴリリスト（Header.tsxと同期）
  const categories = useMemo(() => [
    { id: 'all', label: 'すべて' },
    { id: 'ガジェット', label: 'ガジェット' },
    { id: '家電', label: '家電' },
    { id: 'キッチン', label: 'キッチン' },
    { id: 'ゲーム', label: 'ゲーム' },
    { id: 'ヘルスケア', label: 'ヘルスケア' },
    { id: 'ビューティー', label: 'ビューティー' },
    { id: '食品', label: '食品' },
    { id: '文房具', label: '文房具' },
    { id: 'その他', label: 'その他' },
  ], []);
  
  // 画面サイズを動的に取得
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 初回レンダリング時にサイズを設定
    updateWindowSize();

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', updateWindowSize);

    return () => {
      window.removeEventListener('resize', updateWindowSize);
    };
  }, []);

  useEffect(() => { 
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/products');
        
        if (!response.ok) {
          // エラーレスポンスの詳細を取得
          let errorMessage = `HTTP ${response.status}`;
          let errorDetails = '';
          
          try {
            const errorData = await response.json();
            errorDetails = errorData.error || errorData.message || '';
            if (errorData.details) {
              errorDetails += ` (${errorData.details})`;
            }
          } catch {
            // JSONパースに失敗した場合は、ステータステキストを使用
            errorDetails = response.statusText || '';
          }
          
          // ステータスコードに応じた詳細メッセージを生成
          const statusMessages: Record<number, string> = {
            404: '商品データファイルが見つかりません',
            500: 'サーバー内部エラーが発生しました',
            503: 'サービスが一時的に利用できません',
          };
          
          const statusMessage = statusMessages[response.status] || 'データの取得に失敗しました';
          const fullMessage = errorDetails 
            ? `${statusMessage} (${response.status}: ${errorDetails})`
            : `${statusMessage} (${response.status})`;
          
          throw new Error(fullMessage);
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error('商品データの取得に失敗しました:', err);
        const errorMessage = err instanceof Error 
          ? err.message 
          : 'データの取得に失敗しました。時間をおいてお試しください。';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  // リトライ関数
  const handleRetry = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorMessage = `HTTP ${response.status}`;
        let errorDetails = '';
        
        try {
          const errorData = await response.json();
          errorDetails = errorData.error || errorData.message || '';
          if (errorData.details) {
            errorDetails += ` (${errorData.details})`;
          }
        } catch {
          errorDetails = response.statusText || '';
        }
        
        // ステータスコードに応じた詳細メッセージを生成
        const statusMessages: Record<number, string> = {
          404: '商品データファイルが見つかりません',
          500: 'サーバー内部エラーが発生しました',
          503: 'サービスが一時的に利用できません',
        };
        
        const statusMessage = statusMessages[response.status] || 'データの取得に失敗しました';
        const fullMessage = errorDetails 
          ? `${statusMessage} (${response.status}: ${errorDetails})`
          : `${statusMessage} (${response.status})`;
        
        throw new Error(fullMessage);
      }
      
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('商品データの取得に失敗しました:', err);
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'データの取得に失敗しました。時間をおいてお試しください。';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 重複防止（ASINベースでフィルタリング）
  const uniqueProducts = useMemo(() => {
    const seenASINs = new Set<string>();
    const unique: Product[] = [];
    
    for (const product of products) {
      const asin = extractASIN(product.affiliateUrl);
      if (asin && !seenASINs.has(asin)) {
        seenASINs.add(asin);
        unique.push(product);
      } else if (!asin) {
        // ASINが抽出できない場合はidベースで重複チェック
        if (!unique.find(p => p.id === product.id)) {
          unique.push(product);
        }
      }
    }
    
    return unique;
  }, [products]);


  // 統計情報を計算
  const stats = useMemo(() => {
    const totalProducts = uniqueProducts.length;
    
    // 本日値下がり件数
    const dropsToday = uniqueProducts.filter((p) => {
      const history = p.priceHistory || [];
      if (history.length < 2) return false;
      const latest = p.currentPrice;
      const prev = history[history.length - 2].price;
      return latest < prev;
    }).length;
    
    // 最安値更新件数（現在価格が過去最安値と同じ）
    const lowestPriceUpdates = uniqueProducts.filter((p) => {
      const history = p.priceHistory || [];
      if (history.length === 0) return false;
      const prices = history.map(h => h.price);
      const lowest = Math.min(...prices, p.currentPrice);
      return p.currentPrice === lowest && history.length >= 2;
    }).length;
    
    // カテゴリ別の値下がり件数
    const categoryDrops: Record<string, number> = {};
    uniqueProducts.forEach((p) => {
      const history = p.priceHistory || [];
      if (history.length < 2) return;
      const latest = p.currentPrice;
      const prev = history[history.length - 2].price;
      if (latest < prev) {
        const category = p.category || "その他";
        categoryDrops[category] = (categoryDrops[category] || 0) + 1;
      }
    });
    
    // 最も値下がりが多いカテゴリ
    const topCategory = Object.entries(categoryDrops).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalProducts,
      dropsToday,
      lowestPriceUpdates,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryCount: topCategory ? topCategory[1] : 0,
    };
  }, [uniqueProducts]);

  // タブに応じたフィルタリング
  const filteredProducts = useMemo(() => {
    let result = [...uniqueProducts];

    // ¥0商品を除外
    result = result.filter((p: Product) => p.currentPrice > 0);

    // カテゴリフィルター（最初に適用）
    if (selectedCategory && selectedCategory !== 'all') {
      result = result.filter((p: Product) => {
        const category = p.category || "その他";
        return category === selectedCategory;
      });
    }

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

    // デフォルトフィルター：Deal Score 10点未満の商品を非表示（「すべて」タブ以外）
    if (activeTab !== 'all') {
      result = result.filter((p: Product) => {
        const score = calculateDealScore(p);
        return score >= 10;
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

    // 最終確認：ASINベースで重複排除（1商品 = 1カードを保証）
    const finalResult: Product[] = [];
    const seenASINs = new Set<string>();
    
    for (const product of result) {
      const asin = extractASIN(product.affiliateUrl);
      const identifier = asin || product.id;
      
      if (!seenASINs.has(identifier)) {
        seenASINs.add(identifier);
        finalResult.push(product);
      }
    }

    return finalResult;
  }, [uniqueProducts, searchQuery, activeTab, selectedCategory]);

  // お気に入り商品を取得
  const favoriteProducts = useMemo(() => {
    if (typeof window === 'undefined') return [];
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.length === 0) return [];
    
    return uniqueProducts.filter((product) => {
      const asin = extractASIN(product.affiliateUrl);
      return asin && favorites.includes(asin);
    });
  }, [uniqueProducts]);

  // ページネーションは仮想スクロールで不要のため削除
  // 仮想スクロールでは全商品を一度に表示するため、スライスは不要

  // トレンドTOP3（スコア順）
  const trendProducts = useMemo(() => {
    const sorted = [...uniqueProducts].sort((a, b) => {
      const scoreA = calculateDealScore(a);
      const scoreB = calculateDealScore(b);
      return scoreB - scoreA;
    });
    return sorted.filter(p => calculateDealScore(p) > 0).slice(0, 3);
  }, [uniqueProducts]);

  const tabs: Array<{ id: TabType; label: string; emoji: string }> = [
    { id: 'drops', label: '値下がり速報', emoji: '🔥' },
    { id: 'new', label: '新着', emoji: '✨' },
    { id: 'ranking', label: 'ランキング', emoji: '👑' },
    { id: 'all', label: 'すべて', emoji: '' },
  ];

  const handleAlertClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // 構造化データ（JSON-LD）の生成（表示中の商品のみに限定）
  const structuredData = useMemo(() => {
    // ページネーション済みの商品（現在画面に表示されている商品のみ）から生成
    const productStructuredData = filteredProducts
      .filter(product => {
        const asin = extractASIN(product.affiliateUrl);
        return asin !== null;
      })
      .map(product => {
        const asin = extractASIN(product.affiliateUrl);
        return {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          sku: asin,
          image: product.imageUrl,
          offers: {
            '@type': 'Offer',
            price: product.currentPrice,
            priceCurrency: 'JPY',
            availability: 'https://schema.org/InStock',
            url: product.affiliateUrl,
          },
        };
      });

    // 動的なBreadcrumbList（カテゴリフィルターに応じて変更）
    const baseUrl = 'https://price-watcher-plum.vercel.app';
    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
    ];

    if (selectedCategory && selectedCategory !== 'all') {
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: categoryLabel,
        item: `${baseUrl}?category=${encodeURIComponent(selectedCategory)}`,
      });
    } else {
      breadcrumbItems.push({
        '@type': 'ListItem',
        position: 2,
        name: 'All Products',
        item: baseUrl,
      });
    }

    const breadcrumbStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems,
    };

    return {
      products: productStructuredData,
      breadcrumb: breadcrumbStructuredData,
    };
  }, [filteredProducts, selectedCategory, categories]);

  // 動的なページタイトルを生成
  const pageTitle = useMemo(() => {
    const baseTitle = 'TRENDIX | Amazon価格トレンド分析・速報';
    if (selectedCategory && selectedCategory !== 'all') {
      const categoryLabel = categories.find(c => c.id === selectedCategory)?.label || selectedCategory;
      return `${categoryLabel} | ${baseTitle}`;
    }
    if (searchQuery) {
      return `「${searchQuery}」の検索結果 | ${baseTitle}`;
    }
    return baseTitle;
  }, [selectedCategory, searchQuery, categories]);

  // ページタイトルを動的に更新
  useEffect(() => {
    document.title = pageTitle;
    
    // OGPメタタグを更新
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', pageTitle);
    }
    
    // Twitter Cardメタタグを更新
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', pageTitle);
    }
  }, [pageTitle]);

  return (
    <>

      {/* 構造化データ（JSON-LD） */}
      {structuredData.products.length > 0 && (
        <>
          {structuredData.products.map((productData, index) => (
            <script
              key={`product-${index}`}
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(productData),
              }}
            />
          ))}
        </>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData.breadcrumb),
        }}
      />
      
      <Header 
        onSearch={setSearchQuery} 
        onRankingClick={() => {
          setActiveTab('ranking');
          // ページトップにスクロール（仮想スクロールではページネーション不要）
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <AlertModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        product={selectedProduct} 
      />
      <div className="pb-20 bg-[#f8f9fa] min-h-screen">
        {/* 統計サマリーエリア（ヘッダー直下） */}
        <section className="bg-white border-b border-gray-200 py-8 px-4">
          <div className="container mx-auto max-w-7xl">
            {/* メインメッセージ */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                買い時の商品が、<span className="text-blue-600">一瞬でわかる。</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mb-2">
                Amazonの価格変動を24時間365日監視中
              </p>
              <p className="text-gray-500 text-xs md:text-sm max-w-2xl mx-auto">
                TRENDIXは、Amazonの価格変動をAIがリアルタイムで分析し、本当に安くなった商品のみを自動で抽出・表示します。
              </p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* 監視商品数 */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                <div className="text-sm text-blue-700 font-medium mb-2">監視商品数</div>
                <div className="text-4xl font-bold text-blue-900">{stats.totalProducts}</div>
                <div className="text-xs text-blue-600 mt-1">商品をリアルタイム監視中</div>
              </div>

              {/* 本日値下がり件数 */}
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                <div className="text-sm text-red-700 font-medium mb-2">本日値下がり件数</div>
                <div className="text-4xl font-bold text-red-900">{stats.dropsToday}</div>
                <div className="text-xs text-red-600 mt-1">件の商品が値下がり</div>
              </div>

              {/* 最安値更新件数 */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                <div className="text-sm text-yellow-700 font-medium mb-2">最安値更新件数</div>
                <div className="text-4xl font-bold text-yellow-900">{stats.lowestPriceUpdates}</div>
                <div className="text-xs text-yellow-600 mt-1">件が過去最安値を更新</div>
              </div>
            </div>
          </div>
        </section>

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

        {/* トップサマリーバー */}
        {stats.dropsToday > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 py-3 px-4">
            <div className="container mx-auto max-w-7xl">
              <p className="text-sm text-gray-700 text-center">
                今日は<strong className="text-blue-700 font-bold">{stats.dropsToday}</strong>商品が値下がりしています。
                {stats.topCategory && stats.topCategoryCount > 0 && (
                  <span> 特に<strong className="text-purple-700 font-bold">{stats.topCategory}</strong>カテゴリが狙い目です。</span>
                )}
              </p>
            </div>
          </div>
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
          {/* 検索結果・カテゴリフィルター情報 */}
          {(searchQuery || (selectedCategory && selectedCategory !== 'all')) && !isLoading && !error && (
            <div className="mb-6">
              {searchQuery && (
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  「{searchQuery}」の検索結果
                </h2>
              )}
              {selectedCategory && selectedCategory !== 'all' && !searchQuery && (
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}カテゴリ
                </h2>
              )}
              {searchQuery && selectedCategory && selectedCategory !== 'all' && (
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  「{searchQuery}」の検索結果（{categories.find(c => c.id === selectedCategory)?.label || selectedCategory}カテゴリ）
                </h2>
              )}
              <span className="text-sm text-gray-500">
                {filteredProducts.length}件 / 全{uniqueProducts.length}件
              </span>
            </div>
          )}
          
          {/* ローディング状態 */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, index) => (
                <LoadingSkeleton key={index} />
              ))}
            </div>
          )}

          {/* エラー状態 */}
          {error && !isLoading && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">データの取得に失敗しました</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>再試行</span>
                </button>
              </div>
            </div>
          )}

          {/* 正常状態：商品一覧 */}
          {!isLoading && !error && (
            <>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 px-4">
                  <div className="max-w-md mx-auto">
                    {/* アイコン */}
                    <div className="flex justify-center mb-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                    </div>
                    
                    {/* メインメッセージ */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      お探しの商品が見つかりませんでした
                    </h2>
                    
                    {/* サブメッセージ */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {searchQuery ? (
                        <>
                          「<span className="font-semibold text-gray-900">{searchQuery}</span>」に一致する商品は見つかりませんでした。
                          <br />
                          別のキーワードで検索するか、フィルターを変更してお試しください。
                        </>
                      ) : selectedCategory && selectedCategory !== 'all' ? (
                        <>
                          選択したカテゴリ「<span className="font-semibold text-gray-900">
                            {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}
                          </span>」に該当する商品は現在ありません。
                          <br />
                          別のカテゴリを選択するか、検索条件を変更してお試しください。
                        </>
                      ) : (
                        <>
                          現在、表示できる商品がありません。
                          <br />
                          検索条件やフィルターを変更してお試しください。
                        </>
                      )}
                    </p>
                    
                    {/* アクションボタン */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      {(searchQuery || (selectedCategory && selectedCategory !== 'all')) && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedCategory('all');
                            setActiveTab('all');
                          }}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X size={18} />
                          <span>検索条件をクリア</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                          setActiveTab('all');
                        }}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Search size={18} />
                        <span>すべての商品を表示</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* 仮想スクロール対応の商品リスト */}
                  {windowSize.width > 0 && windowSize.height > 0 ? (
                    <VirtualProductList
                      products={filteredProducts} // ページネーションなし：全商品を表示
                      width={Math.min(windowSize.width - 32, 1200)} // パディングを考慮、最大幅1200px
                      height={Math.max(600, windowSize.height - 400)} // 最小600px、画面高さからヘッダー等を引く
                      onAlertClick={handleAlertClick}
                      onFavoriteToggle={(asin, isFavorite) => {
                        // お気に入り状態変更時の処理（必要に応じて実装）
                      }}
                    />
                  ) : (
                    // 初期レンダリング時のフォールバック（グリッド表示）
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {filteredProducts.slice(0, 6).map((p, index) => (
                        <ProductCard 
                          key={p.id} 
                          product={p} 
                          isPriority={index < 3}
                          onAlertClick={handleAlertClick}
                          onFavoriteToggle={(asin, isFavorite) => {
                            // お気に入り状態変更時の処理（必要に応じて実装）
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
