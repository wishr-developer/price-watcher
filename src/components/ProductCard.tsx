"use client";

import { useState, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import { Bell, ExternalLink, Heart, Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/product';
import DealScoreBadge from './DealScoreBadge';
const ProductCardChart = dynamic(() => import('./ProductCardChart'), {
  ssr: false,
  loading: () => <div className="h-16 md:h-20 w-full bg-gray-50" />,
});
import { calculateDealScore } from '@/lib/dealScore';

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAlertClick?: (product: Product) => void;
  onFavoriteToggle?: (asin: string, isFavorite: boolean) => void;
  isPriority?: boolean;
  categoryLabel?: string;
}

type PeriodType = '7D' | '30D' | 'ALL';

// 「なぜお得か」表示用の閾値・設定（将来他の場所でも再利用可能）
const DEAL_REASON_CONFIG = {
  avgWindowDays: 30,
  minAvgDiscountPercent: 3, // 過去平均より何%以上安いと「お得」とみなすか
  minPrevDiscountPercent: 3, // 直近価格からの下落が何%以上であれば表示するか
};

/** URLからASINを抽出 */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

/** 過去N日間の平均価格を取得（データが少ない場合は全期間で計算） */
function getAveragePriceInDays(product: Product, days: number): number | null {
  const history = product.priceHistory || [];
  if (history.length === 0) return null;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history.filter((h) => {
    const historyDate = new Date(h.date);
    return historyDate >= cutoffDate;
  });

  const target = recentHistory.length > 0 ? recentHistory : history;
  if (target.length === 0) return null;

  const sum = target.reduce((acc, h) => acc + h.price, 0);
  return sum / target.length;
}

/** DAISO型：「なぜお得か」を控えめなトーンで表示（そっと背中を押す） */
function getDealReason(product: Product): string | null {
  const history = product.priceHistory || [];
  if (history.length < 2) return null;

  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diffFromPrev = latest - prev;

  const avg30 = getAveragePriceInDays(product, DEAL_REASON_CONFIG.avgWindowDays);

  // 1. 過去30日平均より十分安い場合を優先して表示
  if (avg30 && latest < avg30) {
    const diffFromAvg = avg30 - latest;
    const discountPercentFromAvg =
      avg30 > 0 ? Math.round((diffFromAvg / avg30) * 100 * 10) / 10 : 0;

    // 平均より一定以上安い場合のみ表示
    if (discountPercentFromAvg >= DEAL_REASON_CONFIG.minAvgDiscountPercent) {
      return `最近では安い価格です`;
    }
  }

  // 2. 直近価格からの値下がりが大きい場合
  if (diffFromPrev < 0) {
    const discountPercentFromPrev =
      prev > 0 ? Math.round((Math.abs(diffFromPrev) / prev) * 100 * 10) / 10 : 0;

    // 直近からの値下がりが一定以上なら説明を表示
    if (discountPercentFromPrev >= DEAL_REASON_CONFIG.minPrevDiscountPercent) {
      return `直近で値下がりしました`;
    }
  }

  // 3. データはあるが特筆すべき差がない場合は表示なし
  return null;
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


function ProductCard({
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
  const dealReason = getDealReason(product);

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
      className="group bg-white border border-gray-300 overflow-hidden flex flex-col h-full relative hover:border-gray-400 transition-colors"
    >
      {/* DAISO型：画像（正方形・余白あり） */}
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

      {/* DAISO型：情報エリア（下部） */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* 商品名（2〜3行まで、太字禁止） */}
        <h3 className="text-sm text-gray-900 line-clamp-3 leading-relaxed">
          {product.name}
        </h3>

        {/* DAISO型：価格（最も視認性高く、落ち着いたトーン） */}
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            {isCheaper ? (
              <>
                <span className="text-lg font-normal text-gray-500 line-through font-sans">
                  ¥{prev.toLocaleString()}
                </span>
                <span className="text-2xl font-normal text-gray-900 font-sans">
                  ¥{latest.toLocaleString()}
                </span>
                {diff !== 0 && (
                  <span className="text-sm font-normal text-gray-600 font-sans">
                    -{percentChange}%
                  </span>
                )}
              </>
            ) : (
              <span className="text-xl font-normal text-gray-900 font-sans">
                ¥{latest.toLocaleString()}
              </span>
            )}
          </div>

          {/* 「なぜお得か」表示（条件を満たす商品のみ、落ち着いたトーン） */}
          {dealReason && (
            <p className="text-xs text-gray-600 leading-relaxed mt-1">
              {dealReason}
            </p>
          )}
        </div>

        {/* DAISO型：補足情報（AI Deal Score、レビューなど） */}
        <div className="flex items-center gap-2 flex-wrap mt-auto">
          {/* AI Deal Score：40点未満は非表示 */}
          {dealScore >= 40 && <DealScoreBadge score={dealScore} />}
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-gray-400 text-gray-400" />
            <span className="text-xs text-gray-600 font-sans">4.5</span>
            <span className="text-xs text-gray-500 font-sans">(128)</span>
          </div>
        </div>

        {/* DAISO型：CTAボタン（シンプル） */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
            }}
            className="w-full flex items-center justify-center gap-1 px-4 py-2 text-sm font-normal text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <span>商品を見る</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </a>
  );
}

// React.memoでラップして、propsが変更されない限り再レンダリングを防止
// カスタム比較関数: trueを返すと再レンダリングをスキップ、falseを返すと再レンダリング
const areEqual = (prevProps: ProductCardProps, nextProps: ProductCardProps) => {
  // 商品IDが同じで、その他の重要なpropsが変更されていない場合は再レンダリングをスキップ
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.currentPrice === nextProps.product.currentPrice &&
    prevProps.isPriority === nextProps.isPriority &&
    prevProps.categoryLabel === nextProps.categoryLabel &&
    prevProps.product.priceHistory?.length === nextProps.product.priceHistory?.length &&
    JSON.stringify(prevProps.product.priceHistory) === JSON.stringify(nextProps.product.priceHistory)
  );
};

export default memo(ProductCard, areEqual);
