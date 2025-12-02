"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Bell, ExternalLink, Heart, Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/product';
import DealScoreBadge from './DealScoreBadge';
import ProductCardChart from './ProductCardChart';

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAlertClick?: (product: Product) => void;
  onFavoriteToggle?: (asin: string, isFavorite: boolean) => void;
  isPriority?: boolean;
  categoryLabel?: string;
}

type PeriodType = '7D' | '30D' | 'ALL';

/** URLからASINを抽出 */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

/** Deal Scoreを計算 */
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

/** 過去最安値を取得 */
function getLowestPrice(product: Product): number | null {
  const history = product.priceHistory || [];
  if (history.length === 0) return null;

  const prices = history.map((h) => h.price);
  return Math.min(...prices, product.currentPrice);
}

/** 直近N日間で最安値更新したかチェック */
function isLowestPriceInRecentDays(product: Product, days: number): boolean {
  const history = product.priceHistory || [];
  if (history.length === 0) return false;

  const latest = product.currentPrice;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history.filter((h) => {
    const historyDate = new Date(h.date);
    return historyDate >= cutoffDate;
  });

  if (recentHistory.length === 0) return false;

  const recentPrices = recentHistory.map((h) => h.price);
  const recentLowest = Math.min(...recentPrices, latest);

  const allTimeLowest = getLowestPrice(product);
  return latest === recentLowest && latest === allTimeLowest;
}


export default function ProductCard({
  product,
  onAlertClick,
  onFavoriteToggle,
  isPriority = false,
  categoryLabel,
}: ProductCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;

  const asin = product.asin || extractASIN(product.affiliateUrl);

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

  const percentChange =
    prev > 0 ? Math.round((Math.abs(diff) / prev) * 100 * 10) / 10 : 0;

  const lowestPrice = getLowestPrice(product);
  const diffFromLowest = lowestPrice !== null ? latest - lowestPrice : null;

  const isLowestPriceRecent = isLowestPriceInRecentDays(product, 7);

  const dealScore = calculateDealScore(product);

  const handleAlertClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      e.nativeEvent &&
      typeof (e.nativeEvent as any).stopImmediatePropagation === 'function'
    ) {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
    if (onAlertClick) {
      onAlertClick(product);
    }
  };

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

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
      className="group bg-white rounded-3xl shadow-artistic hover:shadow-card transition-all duration-300 ease-out overflow-hidden flex flex-col h-full relative border border-gray-100/60"
    >
      {/* 画像（上部） */}
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100/50 flex items-center justify-center overflow-hidden relative border-b border-gray-100/40">
        {imageError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-sm font-medium">No Image</span>
          </div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain mix-blend-multiply p-3"
            priority={isPriority}
            loading={isPriority ? undefined : 'lazy'}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
            aria-hidden="false"
          />
        )}
        {asin && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
            aria-label={isFavorite ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <Heart
              size={16}
              className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
            />
          </button>
        )}
      </div>

      {/* 情報エリア（下部） */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        {/* 商品名 */}
        <h3 className="text-sm md:text-base font-normal text-text-main line-clamp-2 leading-tight group-hover:text-trust transition-colors min-h-[2.25rem]">
          {product.name}
        </h3>

        {/* カテゴリバッジ（日本語ラベル） */}
        {categoryLabel && (
          <div className="mt-0.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* 価格ブロック */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            {isCheaper ? (
              <>
                <span className="text-base md:text-lg font-semibold text-gray-500 line-through font-sans">
                  ¥{prev.toLocaleString()}
                </span>
                <span className="text-2xl font-semibold text-gray-900 font-sans">
                  ¥{latest.toLocaleString()}
                </span>
                {diff !== 0 && (
                  <>
                    <span className="text-sm md:text-base font-semibold text-sale font-sans">
                      -{percentChange}%
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-sale font-sans">
                      -¥{Math.abs(diff).toLocaleString()}
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-xl font-semibold text-gray-900 font-sans">
                ¥{latest.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* ステータスブロック */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {dealScore > 0 && <DealScoreBadge score={dealScore} />}
          <div className="flex items-center gap-0.5">
            <Star size={12} className="fill-accent text-accent" />
            <span className="text-[11px] font-semibold text-gray-700 font-sans">4.5</span>
            <span className="text-[9px] text-gray-500 font-sans">(128)</span>
          </div>
          {isCheaper && diff !== 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white bg-cta border border-cta/20">
              <AlertCircle size={9} />
              在庫残りわずか
            </span>
          )}
          {isLowestPriceRecent && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
              🏆 過去最安値
            </span>
          )}
        </div>

        {/* 詳細情報（常時表示） */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          {diffFromLowest !== null && diffFromLowest > 0 && (
            <div className="text-xs text-gray-600">
              最安値との差: <span className="font-sans">+¥{diffFromLowest.toLocaleString()}</span>
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {(['7D', '30D', 'ALL'] as PeriodType[]).map((period) => (
                  <button
                    key={period}
                    type="button"
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
              <div className="h-16 md:h-20 w-full">
                <ProductCardChart product={product} selectedPeriod={selectedPeriod} />
              </div>
            </div>
          )}
        </div>

        {/* CTAボタン */}
        <div className="flex gap-1.5 mt-auto pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs md:text-sm font-bold text-white bg-cta hover:bg-cta/90 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span>Amazonで見る</span>
            <ExternalLink size={12} />
          </button>
          {onAlertClick && (
            <button
              type="button"
              onClick={handleAlertClick}
              className="flex items-center justify-center px-2 py-2 text-xs md:text-sm font-medium text-gray-600 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl transition-all duration-200 z-10 relative"
              aria-label="値下がり通知を受け取る"
            >
              <Bell size={14} />
            </button>
          )}
        </div>
      </div>
    </a>
  );
}
