"use client";

import { useState, useEffect } from 'react';
import { Bell, ExternalLink, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Product } from '@/types/product';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import DealScoreTooltip from './DealScoreTooltip';

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAlertClick?: (product: Product) => void;
  onFavoriteToggle?: (asin: string, isFavorite: boolean) => void;
  isPriority?: boolean;
}

type PeriodType = '7D' | '30D' | 'ALL';

/**
 * URLからASINを抽出
 */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

/**
 * Deal Scoreを計算
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
 * 過去最安値を取得
 */
function getLowestPrice(product: Product): number | null {
  const history = product.priceHistory || [];
  if (history.length === 0) return null;
  
  const prices = history.map(h => h.price);
  return Math.min(...prices, product.currentPrice);
}

/**
 * 直近N日間で最安値更新したかチェック
 */
function isLowestPriceInRecentDays(product: Product, days: number): boolean {
  const history = product.priceHistory || [];
  if (history.length === 0) return false;
  
  const latest = product.currentPrice;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // 直近N日間の価格履歴を取得
  const recentHistory = history.filter(h => {
    const historyDate = new Date(h.date);
    return historyDate >= cutoffDate;
  });
  
  if (recentHistory.length === 0) return false;
  
  // 直近N日間の最安値を計算
  const recentPrices = recentHistory.map(h => h.price);
  const recentLowest = Math.min(...recentPrices, latest);
  
  // 現在価格が直近N日間の最安値と一致し、かつ過去最安値でもある
  const allTimeLowest = getLowestPrice(product);
  return latest === recentLowest && latest === allTimeLowest;
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
    filteredHistory = history.slice(-7);
  } else if (period === '30D') {
    filteredHistory = history.slice(-30);
  }

  return filteredHistory.map(h => ({ price: h.price }));
}

/**
 * グラフの色を決定
 */
function getChartColor(product: Product): string {
  const history = product.priceHistory || [];
  if (history.length < 2) return '#9ca3af';
  
  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  if (diff < 0) return '#EF4444';
  if (diff > 0) return '#3B82F6';
  return '#9ca3af';
}

export default function ProductCard({ product, onAlertClick, onFavoriteToggle, isPriority = false }: ProductCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // 詳細情報の折りたたみ状態
  
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;
  
  // ASINを取得
  const asin = product.asin || extractASIN(product.affiliateUrl);
  
  // お気に入り状態をローカルストレージから読み込み
  useEffect(() => {
    if (!asin) return;
    
    const updateFavoriteState = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(asin));
    };
    
    updateFavoriteState();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites') {
        updateFavoriteState();
      }
    };
    
    const handleFavoriteUpdated = () => {
      updateFavoriteState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('favoriteUpdated', handleFavoriteUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoriteUpdated', handleFavoriteUpdated);
    };
  }, [asin]);
  
  // 価格変動のパーセンテージ
  const percentChange = prev > 0 ? Math.round((Math.abs(diff) / prev) * 100 * 10) / 10 : 0;
  
  // 過去最安値
  const lowestPrice = getLowestPrice(product);
  const diffFromLowest = lowestPrice !== null ? latest - lowestPrice : null;
  
  // 直近7日または30日で最安値更新したかチェック
  const isLowestPriceRecent = isLowestPriceInRecentDays(product, 30);
  
  // Deal Score
  const dealScore = calculateDealScore(product);
  
  // カテゴリ（「その他」の場合は表示しない）
  const category = product.category && product.category !== "その他" ? product.category : null;
  
  const chartData = prepareChartData(product, selectedPeriod);
  const chartColor = getChartColor(product);
  const locale = useLocale();

  // アラートボタンのクリックハンドラ
  const handleAlertClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
    if (onAlertClick) {
      onAlertClick(product);
    }
  };

  // お気に入りボタンのクリックハンドラ
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!asin) return;
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newIsFavorite = !isFavorite;
    
    if (newIsFavorite) {
      if (!favorites.includes(asin)) {
        favorites.push(asin);
      }
    } else {
      const index = favorites.indexOf(asin);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(newIsFavorite);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('favoriteUpdated'));
    }
    
    if (onFavoriteToggle) {
      onFavoriteToggle(asin, newIsFavorite);
    }
  };

  // カード全体のクリックハンドラ
  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button[type="button"]')) {
      e.preventDefault();
    }
  };

  // 詳細情報の展開/折りたたみ
  const handleToggleDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDetailsExpanded(!isDetailsExpanded);
  };

  // 商品詳細ページへのリンクURLを生成
  const detailUrl = asin ? `/${locale}/products/${asin}` : product.affiliateUrl;

  return (
    <a
      href={detailUrl}
      onClick={handleCardClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 flex flex-col h-full relative"
    >
      {/* モバイル: 横並びレイアウト */}
      <div className="md:hidden flex gap-4 p-4 flex-1">
        {/* 左: 画像 */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden relative">
            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-[10px] font-medium">No Image</span>
              </div>
            ) : (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={96}
                height={96}
                className="object-contain mix-blend-multiply p-2"
                priority={isPriority}
                loading={isPriority ? undefined : "lazy"}
                onError={() => setImageError(true)}
                aria-hidden="false"
              />
            )}
          </div>
        </div>

        {/* 右: 情報エリア */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* カテゴリバッジ（「その他」は表示しない） */}
          {category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
              {category}
            </span>
          )}
          
          {/* 商品名（2行制限） */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* 価格変動情報（値下がりのみ表示） */}
          {isCheaper && diff !== 0 && (
            <div className="text-xs font-semibold text-price-drop">
              ▼ {percentChange}%（−¥{Math.abs(diff).toLocaleString()}）
            </div>
          )}

          {/* 過去最安値バッジ（直近30日で更新した商品のみ） */}
          {isLowestPriceRecent && (
            <div className="text-xs font-bold text-yellow-600">
              🏆 過去最安値
            </div>
          )}

          {/* 価格 */}
          <div className="flex items-baseline gap-2 mt-auto">
            {isCheaper && (
              <span className="text-xs text-gray-400 line-through">
                ¥{prev.toLocaleString()}
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              ¥{latest.toLocaleString()}
            </span>
          </div>

          {/* 詳細情報（折りたたみ可能） */}
          {isDetailsExpanded && (
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-100">
              {/* AI Deal Score */}
              {dealScore > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-600">
                    AI Deal Score: {dealScore}/100
                  </span>
                  <DealScoreTooltip />
                </div>
              )}

              {/* 最安値との差 */}
              {diffFromLowest !== null && diffFromLowest > 0 && (
                <div className="text-xs text-gray-600">
                  最安値との差: +¥{diffFromLowest.toLocaleString()}
                </div>
              )}

              {/* 期間選択ボタンとグラフ */}
              <div className="space-y-1">
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
                <div className="h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 詳細情報の展開/折りたたみボタン */}
          <button
            type="button"
            onClick={handleToggleDetails}
            className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700 mt-1"
          >
            {isDetailsExpanded ? (
              <>
                <span>詳細を閉じる</span>
                <ChevronUp size={12} />
              </>
            ) : (
              <>
                <span>詳細を見る</span>
                <ChevronDown size={12} />
              </>
            )}
          </button>

          {/* CTAボタン */}
          <div className="flex gap-2 mt-2">
            {onAlertClick && (
              <button 
                type="button"
                onClick={handleAlertClick}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-10 relative"
              >
                <Bell size={14} />
                <span>通知</span>
              </button>
            )}
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors"
            >
              <span>Amazon</span>
              <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        </div>
      </div>

      {/* PC: 縦長カード型レイアウト */}
      <div className="hidden md:flex flex-col flex-1">
        {/* 画像（上部） */}
        <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
          {imageError ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-sm font-medium">No Image</span>
            </div>
          ) : (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-contain mix-blend-multiply p-4"
              priority={isPriority}
              loading={isPriority ? undefined : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              aria-hidden="false"
            />
          )}
          {/* お気に入りボタン（画像上） */}
          {asin && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
              aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              <Heart
                size={18}
                className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
              />
            </button>
          )}
        </div>

        {/* 情報エリア（下部） */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          {/* カテゴリバッジ（「その他」は表示しない） */}
          {category && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
              {category}
            </span>
          )}
          
          {/* 商品名（2行制限） */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
            {product.name}
          </h3>

          {/* 価格変動情報（値下がりのみ表示） */}
          {isCheaper && diff !== 0 && (
            <div className="text-sm font-semibold text-price-drop">
              ▼ {percentChange}%（−¥{Math.abs(diff).toLocaleString()}）
            </div>
          )}

          {/* 過去最安値バッジ（直近30日で更新した商品のみ） */}
          {isLowestPriceRecent && (
            <div className="text-xs font-bold text-yellow-600">
              🏆 過去最安値
            </div>
          )}

          {/* 価格 */}
          <div className="flex items-baseline gap-2">
            {isCheaper && (
              <span className="text-sm text-gray-400 line-through">
                ¥{prev.toLocaleString()}
              </span>
            )}
            <span className="text-xl font-bold text-gray-900">
              ¥{latest.toLocaleString()}
            </span>
          </div>

          {/* 詳細情報（折りたたみ可能） */}
          {isDetailsExpanded && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {/* AI Deal Score */}
              {dealScore > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-purple-600">
                    AI Deal Score: {dealScore}/100
                  </span>
                  <DealScoreTooltip />
                </div>
              )}

              {/* 最安値との差 */}
              {diffFromLowest !== null && diffFromLowest > 0 && (
                <div className="text-xs text-gray-600">
                  最安値との差: +¥{diffFromLowest.toLocaleString()}
                </div>
              )}

              {/* 期間選択ボタンとグラフ */}
              <div className="space-y-1">
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
                <div className="h-10 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke={chartColor}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* 詳細情報の展開/折りたたみボタン */}
          <button
            type="button"
            onClick={handleToggleDetails}
            className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            {isDetailsExpanded ? (
              <>
                <span>詳細を閉じる</span>
                <ChevronUp size={12} />
              </>
            ) : (
              <>
                <span>詳細を見る</span>
                <ChevronDown size={12} />
              </>
            )}
          </button>

          {/* CTAボタン */}
          <div className="flex gap-2 mt-auto">
            {onAlertClick && (
              <button 
                type="button"
                onClick={handleAlertClick}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-10 relative"
              >
                <Bell size={14} />
                <span>通知</span>
              </button>
            )}
            <a
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors"
            >
              <span>Amazon</span>
              <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        </div>
      </div>
    </a>
  );
}
