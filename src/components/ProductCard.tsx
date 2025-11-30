"use client";

import { useState, useEffect } from 'react';
import { Bell, ExternalLink, Heart } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import DealScoreTooltip from './DealScoreTooltip';

interface ProductCardProps {
  product: Product;
  rank?: number;
  onAlertClick?: (product: Product) => void;
  onFavoriteToggle?: (asin: string, isFavorite: boolean) => void;
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
 * グラフの色を決定（値下がり=赤、値上がり=青、変動なし=グレー）
 */
function getChartColor(product: Product): string {
  const history = product.priceHistory || [];
  if (history.length < 2) return '#9ca3af'; // グレー
  
  const latest = product.currentPrice;
  const prev = history[history.length - 2].price;
  const diff = latest - prev;
  
  if (diff < 0) return '#EF4444'; // 赤（値下がり）
  if (diff > 0) return '#3B82F6'; // 青（値上がり）
  return '#9ca3af'; // グレー（変動なし）
}

export default function ProductCard({ product, onAlertClick, onFavoriteToggle }: ProductCardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('ALL');
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const diff = latest - prev;
  const isCheaper = diff < 0;
  const isExpensive = diff > 0;
  
  // ASINを取得
  const asin = extractASIN(product.affiliateUrl);
  
  // お気に入り状態をローカルストレージから読み込み
  useEffect(() => {
    if (!asin) return;
    
    const updateFavoriteState = () => {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(favorites.includes(asin));
    };
    
    // 初回読み込み
    updateFavoriteState();
    
    // storageイベントをリッスン（他のタブでの変更を検知）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'favorites') {
        updateFavoriteState();
      }
    };
    
    // カスタムイベントをリッスン（同一タブ内での変更を検知）
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
  
  // 価格変動のパーセンテージ（小数点第1位まで）
  const percentChange = prev > 0 ? Math.round((Math.abs(diff) / prev) * 100 * 10) / 10 : 0;
  
  // 過去最安値
  const lowestPrice = getLowestPrice(product);
  const diffFromLowest = lowestPrice !== null ? latest - lowestPrice : null;
  const isLowestPrice = lowestPrice !== null && latest === lowestPrice;
  
  // Deal Score
  const dealScore = calculateDealScore(product);
  
  // 商品データに埋め込まれたカテゴリを使用（なければ「その他」）
  const category = product.category || "その他";
  const chartData = prepareChartData(product, selectedPeriod);
  const chartColor = getChartColor(product);

  // アラートボタンのクリックハンドラ（外部リンクへの遷移を防ぐ）
  const handleAlertClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // イベント伝播を完全に停止（ネイティブイベントも停止）
    if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
      (e.nativeEvent as any).stopImmediatePropagation();
    }
    // 親コンポーネントに商品データを渡す
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
      // お気に入りに追加
      if (!favorites.includes(asin)) {
        favorites.push(asin);
      }
    } else {
      // お気に入りから削除
      const index = favorites.indexOf(asin);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    setIsFavorite(newIsFavorite);
    
    // カスタムイベントを発火して、他のコンポーネントに通知
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('favoriteUpdated'));
    }
    
    if (onFavoriteToggle) {
      onFavoriteToggle(asin, newIsFavorite);
    }
  };

  // カード全体のクリックハンドラ（ボタンがクリックされた場合はリンク遷移を防ぐ）
  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const target = e.target as HTMLElement;
    // ボタンがクリックされた場合はリンク遷移を防ぐ
    if (target.closest('button[type="button"]')) {
      e.preventDefault();
    }
  };

  return (
    <a
      href={product.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleCardClick}
      className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 flex flex-col h-full relative"
    >
      {/* モバイル: 横並びレイアウト */}
      <div className="md:hidden flex gap-4 p-4 flex-1">
        {/* 左: 大きな正方形画像 */}
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
                loading="lazy"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        </div>

        {/* 右: 情報エリア */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* カテゴリバッジ */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
            {category}
          </span>
          
          {/* 商品名（2行制限） */}
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>

          {/* AI Deal Score（ツールチップ付き） */}
          {dealScore > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-purple-600">
                AI Deal Score: {dealScore}/100
              </span>
              <DealScoreTooltip />
            </div>
          )}

          {/* 価格変動情報（最終化：▼ 5.1%（−¥55）形式） */}
          {diff !== 0 && (
            <div className={`text-xs font-semibold ${
              isCheaper ? 'text-price-drop' : 'text-price-up'
            }`}>
              {isCheaper ? '▼' : '▲'} {percentChange}%（{isCheaper ? '−' : '+'}¥{Math.abs(diff).toLocaleString()}）
            </div>
          )}

          {/* 最安値との差（明瞭化：最安値との差: +¥1,131） */}
          {diffFromLowest !== null && !isLowestPrice && (
            <div className="text-xs text-gray-600">
              最安値との差: {diffFromLowest > 0 ? '+' : ''}¥{diffFromLowest.toLocaleString()}
            </div>
          )}
          {isLowestPrice && (
            <div className="text-xs font-bold text-yellow-600">
              🏆 過去最安値
            </div>
          )}

          {/* 期間選択ボタンと価格推移グラフ（スパークライン） */}
          <div className="space-y-1">
            {/* 期間選択ボタン */}
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

            {/* 価格推移グラフ（スパークライン） */}
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

          {/* 価格とボタン */}
          <div className="flex flex-col gap-2 mt-auto">
            <div className="flex items-baseline gap-2">
              {isCheaper && (
                <span className="text-xs text-gray-400 line-through">
                  ¥{prev.toLocaleString()}
                </span>
              )}
              <span className="text-lg font-bold text-gray-900">
                ¥{latest.toLocaleString()}
              </span>
            </div>
            {/* CTAボタン */}
            <div className="flex gap-2">
              {onAlertClick && (
                <button 
                  type="button"
                  onClick={handleAlertClick}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-10 relative"
                >
                  <Bell size={14} />
                  <span>値下がり通知を受け取る</span>
                </button>
              )}
              <div className="flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors">
                <span>今の価格を確認</span>
                <ExternalLink size={12} className="ml-1" />
              </div>
            </div>
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
              loading="lazy"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
          )}
          {/* PC用のお気に入りボタン（画像上） */}
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
          {/* カテゴリバッジ */}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 w-fit">
            {category}
          </span>
          
          {/* 商品名（2行制限） */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors min-h-[3rem]">
            {product.name}
          </h3>

          {/* AI Deal Score（ツールチップ付き） */}
          {dealScore > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-purple-600">
                AI Deal Score: {dealScore}/100
              </span>
              <DealScoreTooltip />
            </div>
          )}

          {/* 価格変動情報（最終化：▼ 5.1%（−¥55）形式） */}
          {diff !== 0 && (
            <div className={`text-sm font-semibold ${
              isCheaper ? 'text-price-drop' : 'text-price-up'
            }`}>
              {isCheaper ? '▼' : '▲'} {percentChange}%（{isCheaper ? '−' : '+'}¥{Math.abs(diff).toLocaleString()}）
            </div>
          )}

          {/* 最安値との差（明瞭化：最安値との差: +¥1,131） */}
          {diffFromLowest !== null && !isLowestPrice && (
            <div className="text-xs text-gray-600">
              最安値との差: {diffFromLowest > 0 ? '+' : ''}¥{diffFromLowest.toLocaleString()}
            </div>
          )}
          {isLowestPrice && (
            <div className="text-xs font-bold text-yellow-600">
              🏆 過去最安値
            </div>
          )}

          {/* 期間選択ボタンと価格推移グラフ（スパークライン） */}
          <div className="space-y-1">
            {/* 期間選択ボタン */}
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

            {/* 価格推移グラフ（スパークライン） */}
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

          {/* 価格とボタン */}
          <div className="flex flex-col gap-2 mt-auto">
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
            {/* CTAボタン */}
            <div className="flex gap-2">
              {onAlertClick && (
                <button 
                  type="button"
                  onClick={handleAlertClick}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors z-10 relative"
                >
                  <Bell size={14} />
                  <span>値下がり通知を受け取る</span>
                </button>
              )}
              <div className="flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg transition-colors">
                <span>今の価格を確認</span>
                <ExternalLink size={12} className="ml-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
