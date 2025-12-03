"use client";

import { useState, useEffect, memo } from 'react';
import { Bell, ExternalLink, Heart, Star, AlertCircle, Clock, TrendingDown, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/product';
import DealScoreBadge from './DealScoreBadge';
import { calculateDealScore } from '@/lib/dealScore';

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAlertClick?: (product: Product) => void;
  onFavoriteToggle?: (asin: string, isFavorite: boolean) => void;
  isPriority?: boolean;
  categoryLabel?: string;
}


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

interface PriceDiff {
  currentPrice: number;
  prevPrice: number | null;
  discountAmount: number;
  discountPercent: number;
  isCheaper: boolean;
}

/** 価格差分を算出する共通関数（Before / After / 差分 / 割合） */
function getPriceDiff(product: Product): PriceDiff {
  const history = product.priceHistory || [];
  const currentPrice = product.currentPrice;
  const prevPrice = history.length > 1 ? history[history.length - 2].price : null;

  if (prevPrice === null || prevPrice <= 0 || currentPrice >= prevPrice) {
    return {
      currentPrice,
      prevPrice,
      discountAmount: 0,
      discountPercent: 0,
      isCheaper: false,
    };
  }

  const diff = currentPrice - prevPrice;
  const discountAmount = Math.abs(diff);
  const discountPercent =
    prevPrice > 0 ? Math.round((discountAmount / prevPrice) * 100 * 10) / 10 : 0;

  return {
    currentPrice,
    prevPrice,
    discountAmount,
    discountPercent,
    isCheaper: diff < 0,
  };
}

/** DAISO型：「なぜお得か」を控えめなトーンで表示（そっと背中を押す） */
function getDealReason(product: Product): string | null {
  const history = product.priceHistory || [];
  if (history.length < 2) return null;

  // 価格表示の信頼性確保：product.currentPriceを直接使用（別名変数禁止）
  const currentPrice = product.currentPrice;
  const prevPrice = history[history.length - 2].price;
  const diffFromPrev = currentPrice - prevPrice;

  const avg30 = getAveragePriceInDays(product, DEAL_REASON_CONFIG.avgWindowDays);

  // 1. 過去30日平均より十分安い場合を優先して表示
  if (avg30 && currentPrice < avg30) {
    const diffFromAvg = avg30 - currentPrice;
    const discountPercentFromAvg =
      avg30 > 0 ? Math.round((diffFromAvg / avg30) * 100 * 10) / 10 : 0;

    // 平均より一定以上安い場合のみ表示
    if (discountPercentFromAvg >= DEAL_REASON_CONFIG.minAvgDiscountPercent) {
      return `今の価格は過去より安めです`;
    }
  }

  // 2. 直近価格からの値下がりが大きい場合
  if (diffFromPrev < 0) {
    const discountPercentFromPrev =
      prevPrice > 0 ? Math.round((Math.abs(diffFromPrev) / prevPrice) * 100 * 10) / 10 : 0;

    // 直近からの値下がりが一定以上なら説明を表示
    if (discountPercentFromPrev >= DEAL_REASON_CONFIG.minPrevDiscountPercent) {
      return `直近で値下がりしています`;
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

  // 価格表示の信頼性確保：product.currentPriceを直接使用
  const currentPrice = product.currentPrice;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentHistory = history.filter((h) => {
    const historyDate = new Date(h.date);
    return historyDate >= cutoffDate;
  });

  if (recentHistory.length === 0) return false;

  const recentPrices = recentHistory.map((h) => h.price);
  const recentLowest = Math.min(...recentPrices, currentPrice);

  const allTimeLowest = getLowestPrice(product);
  return currentPrice === recentLowest && currentPrice === allTimeLowest;
}

/**
 * STEP 6: おすすめレベルを判定する関数
 * 「安い × 怪しくない × 今買っても後悔しにくい」商品を「おすすめ」とする
 * 
 * STEP 8 実装③: おすすめの一貫性を守る
 * - 小さな価格変動では評価を揺らさない
 * - ドラスティックな変更のみ判断を更新
 */
export function getRecommendationLevel(product: Product): 'recommended' | 'normal' {
  // 1. スポンサー広告ではない
  if (product.isSponsored === true) {
    return 'normal';
  }

  // 2. 価格が妥当
  const currentPrice = product.currentPrice;
  if (currentPrice <= 0 || currentPrice >= 10000000) {
    return 'normal';
  }

  // STEP 8 実装③: 前回のおすすめ状態を確認（localStorageから）
  let wasPreviouslyRecommended = false;
  if (typeof window !== 'undefined') {
    try {
      const key = 'trendix_recommended_products';
      const stored = localStorage.getItem(key);
      if (stored) {
        const recommendedIds = JSON.parse(stored);
        wasPreviouslyRecommended = recommendedIds.includes(product.id);
      }
    } catch (error) {
      // localStorageエラーは無視
    }
  }

  // 3. 割引率 or 割引額が一定以上（¥500 or 5%）
  const priceDiff = getPriceDiff(product);
  const hasSignificantDiscount =
    priceDiff.discountAmount >= 500 || priceDiff.discountPercent >= 5;

  // STEP 8 実装③: 前回おすすめだった場合、小さな価格変動（±3%）では維持
  if (wasPreviouslyRecommended && hasSignificantDiscount) {
    const history = product.priceHistory || [];
    if (history.length >= 2) {
      const prevPrice = history[history.length - 2].price;
      const priceChangePercent = prevPrice > 0 
        ? Math.abs((currentPrice - prevPrice) / prevPrice) * 100 
        : 0;
      
      // 価格変動が±3%以内ならおすすめを維持
      if (priceChangePercent <= 3) {
        return 'recommended';
      }
    }
  }

  if (!hasSignificantDiscount) {
    return 'normal';
  }

  // 4. 直近価格が安定 or 下落傾向
  const history = product.priceHistory || [];
  if (history.length < 2) {
    return 'normal';
  }

  // 直近3件の価格を確認（下落 or 安定）
  const recentPrices = history.slice(-3).map((h) => h.price);
  const isStableOrDropping =
    recentPrices.every((price, index) => {
      if (index === 0) return true;
      return price <= recentPrices[index - 1];
    }) || currentPrice <= recentPrices[recentPrices.length - 1];

  if (!isStableOrDropping) {
    return 'normal';
  }

  // 5. 評価スコアが極端に低くない（★4.0以上）
  // 現状は固定値4.5を想定（将来的にProduct型に追加されることを想定）
  const ratingScore = 4.5; // TODO: product.rating が追加されたら使用
  if (ratingScore < 4.0) {
    return 'normal';
  }

  // すべての条件を満たす場合のみ「おすすめ」
  // STEP 8 実装③: おすすめ商品IDをlocalStorageに保存
  if (typeof window !== 'undefined') {
    try {
      const key = 'trendix_recommended_products';
      const stored = localStorage.getItem(key);
      const recommendedIds = stored ? JSON.parse(stored) : [];
      if (!recommendedIds.includes(product.id)) {
        recommendedIds.push(product.id);
        // 最大100件まで保存（古い順に削除）
        const trimmed = recommendedIds.slice(-100);
        localStorage.setItem(key, JSON.stringify(trimmed));
      }
    } catch (error) {
      // localStorageエラーは無視
    }
  }

  return 'recommended';
}


function ProductCard({
  product,
  onAlertClick,
  onFavoriteToggle,
  isPriority = false,
  categoryLabel,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // ============================================
  // 価格表示の信頼性確保（設計ルール固定）
  // ============================================
  // 【絶対ルール】
  // 1. 価格表示の唯一のソース: product.currentPrice（Amazon価格そのもの）
  // 2. 別名変数（latest, current, displayPrice等）は禁止
  // 3. 現在価格は1商品につき1回だけ描画
  // 4. 計算と表示の責務分離: getPriceDiff()で計算、JSXで表示
  const currentPrice = product.currentPrice;
  const { prevPrice, discountAmount, discountPercent, isCheaper } =
    getPriceDiff(product);

  const history = product.priceHistory || [];

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

  const lowestPrice = getLowestPrice(product);
  const diffFromLowest = lowestPrice !== null ? currentPrice - lowestPrice : null;

  const isLowestPriceRecent = isLowestPriceInRecentDays(product, 7);

  const dealScore = calculateDealScore(product);
  const dealReason = getDealReason(product);

  // STEP 2: スポンサー広告の視覚的分離
  const isSponsored = product.isSponsored ?? false;

  // STEP 4: 価格ズレ検知の内部対策（UI非表示）
  // currentPriceが0以下や異常値の場合は判断バッジ・理由文を表示しない
  const isPriceValid = currentPrice > 0 && currentPrice < 10000000; // 妥当な価格範囲

  // STEP 1: 判断バッジの表示条件
  // 値下げが発生 && 割引率5%以上 && スポンサー広告ではない && 価格が妥当
  const shouldShowJudgmentBadge =
    isCheaper &&
    discountPercent >= 5 &&
    !isSponsored &&
    isPriceValid;

  // STEP 6: おすすめレベルを判定
  const recommendationLevel = getRecommendationLevel(product);
  const isRecommended = recommendationLevel === 'recommended';

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
    // STEP 8 実装①: カードクリック時も閲覧履歴を保存
    saveToRecentProducts(product);
  };

  // STEP 8 実装①: 最近見た商品をlocalStorageに保存
  const saveToRecentProducts = (product: Product) => {
    if (typeof window === 'undefined') return;

    try {
      const key = 'trendix_recent_products';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      // 既に同じ商品が存在する場合は削除
      const filtered = existing.filter((item: any) => item.productId !== product.id);
      
      // 新しい商品を先頭に追加
      const newItem = {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        currentPrice: product.currentPrice,
        affiliateUrl: product.affiliateUrl,
        viewedAt: new Date().toISOString(),
      };
      
      const updated = [newItem, ...filtered].slice(0, 5); // 最大5件まで
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      // localStorageエラーは無視（プライベートモードなど）
      // 開発環境のみエラーログを出力
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to save recent products:', error);
      }
    }
  };

  // STEP 2: 価格エリアクリックハンドラー（Amazonへ遷移）
  const handlePriceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // STEP 8 実装①: 閲覧履歴を保存
    saveToRecentProducts(product);
    window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
      className={`group overflow-hidden flex flex-col h-full relative transition-all duration-200 ease-out rounded-lg will-change-transform ${
        isSponsored
          ? 'bg-gray-50/50 border border-gray-300/50 shadow-sm hover:shadow-md hover:-translate-y-0.5' // スポンサー広告：わずかに異なる背景
          : isRecommended
          ? 'bg-white border border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5' // おすすめ商品：影をほんの少しだけ強化
          : 'bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5' // 通常カード
      }`}
    >
      {/* DAISO型：画像（正方形・余白あり） - カード全体がクリック可能なため、画像もクリック可能 */}
      <div className="w-full aspect-square bg-gray-50 flex items-center justify-center overflow-hidden relative">
        {imageError ? (
          <div className="w-full h-full aspect-square flex flex-col items-center justify-center text-gray-400">
            <span className="text-sm font-medium">No Image</span>
          </div>
        ) : (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain mix-blend-multiply p-3 transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            priority={isPriority}
            loading={isPriority ? undefined : 'lazy'}
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            quality={90}
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+"
            onLoad={() => {
              setImageLoaded(true);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(false);
            }}
            aria-hidden="false"
            unoptimized={false}
          />
        )}
        {/* STEP 6: おすすめラベル（商品画像の左下） - 質感統一 */}
        {isRecommended && (
          <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-white/95 backdrop-blur-sm border border-calm-navy/20 rounded-lg z-10">
            <span className="text-xs font-medium text-calm-navy flex items-center gap-1">
              <CheckCircle2 size={12} className="text-calm-navy" />
              TRENDIXおすすめ
            </span>
          </div>
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

      {/* DAISO型：情報エリア（下部） - 情報順序固定：バッジ→価格→差額→判断コメント→商品名→CTA */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* STEP 2: スポンサー広告表記（小さくグレー寄り） */}
        {isSponsored && (
          <div className="mb-1">
            <span className="text-xs text-gray-400 font-normal">スポンサー広告</span>
          </div>
        )}

        {/* 
          ============================================
          価格表示エリア（設計ルール固定）
          ============================================
          
          【絶対ルール】
          1. 価格表示の唯一のソース: product.currentPrice（別名変数禁止）
          2. 現在価格は1商品につき1回だけ描画
          3. Before価格は条件を満たすときのみDOM生成（display:none禁止）
          4. 価格周りで計算・分岐・条件表示を混在させない
          
          【JSX構造（固定）】
          [価格ボックス]
           ├ 現在価格（After）※1回のみ
           ├ 旧価格（Before）※条件付き
           ├ 差額（-¥◯◯ / %）
           └ 「Amazon.co.jp の現在価格」表記
        */}
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-300/30 relative pb-4 border-b border-gray-200/60">
          {/* 判断バッジ（価格エリアの上部、価格とは別レイヤー） */}
          {shouldShowJudgmentBadge && (
            <div className="mb-2 flex justify-start">
              <div className="px-2.5 py-1 bg-calm-blue-gray/20 rounded-full">
                <span className="text-xs font-medium text-calm-navy">
                  今の価格は安心
                </span>
              </div>
            </div>
          )}
          {/* 価格エリアをクリック可能にする（Amazon由来を視覚的に接続） */}
          <div
            onClick={handlePriceClick}
            className="cursor-pointer hover:bg-gray-50/50 rounded-md p-1 transition-colors"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePriceClick(e as any);
              }
            }}
            aria-label="Amazon.co.jpの商品ページで価格を確認"
          >
            {/* 
              【現在価格（After）】
              - 必ず1回だけ描画
              - product.currentPriceを直接使用（Amazon価格そのもの）
              - 別名変数（latest, current等）は使用禁止
            */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-3xl font-semibold text-gray-900 font-sans">
                  ¥{currentPrice.toLocaleString()}
                </span>
              </div>
              {/* 
                【値下げ情報（Before）】
                - 条件を満たすときのみDOM生成（display:none禁止）
                - isCheaper && prevPrice !== null && prevPrice > 0 の場合のみ表示
                - 条件を満たさない場合はDOM自体を出力しない
              */}
              {isCheaper && prevPrice !== null && prevPrice > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-normal text-gray-400 line-through font-sans">
                    ¥{prevPrice.toLocaleString()}
                  </span>
                  <span className="text-sm font-medium text-calm-navy font-sans">
                    -¥{discountAmount.toLocaleString()}
                  </span>
                  <span className="text-xs font-normal text-calm-blue-gray font-sans">
                    (-{discountPercent}%)
                  </span>
                </div>
              )}
            </div>
            {/* Amazon由来を示す（価格のすぐ下） */}
            <div className="mt-2">
              <span className="text-[11px] text-gray-400/90 font-normal">
                Amazon.co.jp の現在価格
              </span>
            </div>
            {/* スポンサー広告の場合のみ追加表示 */}
            {isSponsored && (
              <div className="mt-0.5">
                <span className="text-[10px] text-gray-400 font-normal">
                  ※ スポンサー広告
                </span>
              </div>
            )}
          </div>

          {/* 判断コメント（アイコン付き） - 最大2行、タブレット: text-xs - スポンサー広告・価格ズレの場合は表示しない */}
          {dealReason && isCheaper && discountAmount > 0 && !isSponsored && isPriceValid && (
            <div className="flex items-start gap-1.5 mt-3 pt-3 border-t border-gray-200/60">
              {dealReason.includes('値下がり') ? (
                <Clock size={12} className="text-calm-blue-gray mt-0.5 flex-shrink-0" />
              ) : dealReason.includes('安め') ? (
                <TrendingDown size={12} className="text-calm-blue-gray mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 size={12} className="text-calm-blue-gray mt-0.5 flex-shrink-0" />
              )}
              <p className="text-xs md:text-xs lg:text-xs text-gray-600 leading-relaxed flex-1 line-clamp-2">
                {dealReason}
              </p>
            </div>
          )}
          {/* STEP 7 実装②: 「比較しなくていい」補足メッセージ（おすすめ商品のみ） */}
          {isRecommended && !isSponsored && (
            <div className="mt-3 pt-3 border-t border-gray-200/60">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                今の条件なら、無理に待つ必要はなさそうです
              </p>
            </div>
          )}
        </div>

        {/* レビュー評価（価格エリアの下） */}
        <div className="flex items-center gap-1 mt-3">
          <Star size={12} className="fill-gray-400 text-gray-400" />
          <span className="text-xs text-gray-600 font-sans">4.5</span>
          <span className="text-xs text-gray-500 font-sans">(128)</span>
        </div>

        {/* 商品名（価格の後、CTAの前） - タブレット: 2行固定、モバイル: 2行、PC: 3行 */}
        <h3 className="text-sm text-gray-900 line-clamp-2 md:line-clamp-2 lg:line-clamp-3 leading-relaxed mt-2">
          {product.name}
        </h3>

        {/* DAISO型：CTAボタン（シンプル・上品） - 常にカード下部 */}
        <div className="mt-2 pt-2 border-t border-gray-200">
          {/* STEP 7 実装①: 購入直前の安心テキスト（おすすめ商品のみ） */}
          {isRecommended && !isSponsored && (
            <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">
              ※ 価格は変動します。気になる場合はAmazonで最終確認できます。
            </p>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // STEP 7 実装③: 新しいタブで開く（既に実装済み）
              // スクロール位置はブラウザが自動的に保持する
              window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
            }}
            className="w-full flex items-center justify-center gap-1 px-4 py-3 md:py-3 lg:py-2 text-sm font-normal text-calm-navy bg-white border border-calm-blue-gray/30 hover:bg-calm-light hover:border-calm-navy transition-all rounded-md shadow-sm hover:shadow-md min-h-[44px]"
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
  if (prevProps.product.id !== nextProps.product.id) return false;
  if (prevProps.product.currentPrice !== nextProps.product.currentPrice) return false;
  if (prevProps.isPriority !== nextProps.isPriority) return false;
  if (prevProps.categoryLabel !== nextProps.categoryLabel) return false;
  
  // priceHistoryの比較（JSON.stringifyを避けて高速化）
  const prevHistory = prevProps.product.priceHistory || [];
  const nextHistory = nextProps.product.priceHistory || [];
  if (prevHistory.length !== nextHistory.length) return false;
  
  // 最後の価格履歴のみ比較（完全な比較は不要）
  if (prevHistory.length > 0 && nextHistory.length > 0) {
    const prevLast = prevHistory[prevHistory.length - 1];
    const nextLast = nextHistory[nextHistory.length - 1];
    if (prevLast.price !== nextLast.price || prevLast.date !== nextLast.date) {
      return false;
    }
  }
  
  return true;
};

export default memo(ProductCard, areEqual);
