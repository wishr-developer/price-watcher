"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import ProductCard from "@/components/ProductCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";
import { Product } from "@/types/product";
import { Crown, AlertCircle, RefreshCw, Search, X } from "lucide-react";
import { useCategory } from "@/contexts/CategoryContext";
import categoryLabelsJson from "@/data/category_labels.json";
import { calculateDealScore } from "@/lib/dealScore";
import { buildSearchTokens, matchesTokens } from "@/lib/search";

/** URLからASINを抽出（重複防止用） */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

type TabType = "drops" | "new" | "ranking" | "all";
type PriceBand = "all" | "under3k" | "3kto10k" | "over10k";
type SortKey = "default" | "dealScore" | "discountPercent" | "discountAmount";

const PRICE_BANDS: Record<
  PriceBand,
  { label: string; min: number; max: number | null }
> = {
  all: { label: "すべて", min: 0, max: null },
  under3k: { label: "〜3,000円", min: 0, max: 2999 },
  "3kto10k": { label: "3,000〜10,000円", min: 3000, max: 9999 },
  over10k: { label: "10,000円〜", min: 10000, max: null },
};

const categoryLabelMap = categoryLabelsJson as Record<string, string>;

// ヒーローセクション用の背景画像リスト（フランス/イタリアの街並み）
const heroBackgroundImages = [
  "/images/paris_street_blurred.jpg",
  "/images/street1.jpg",
  "/images/street2.jpg",
  "/images/street3.jpg",
];

interface HomeClientProps {
  initialProducts: Product[];
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  const [products] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const { selectedCategory, setSelectedCategory } = useCategory();
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [sortKey, setSortKey] = useState<SortKey>("default");

  // ヒーロー背景画像の状態管理
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  // 検索クエリの変更をハンドル
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // 検索クエリのデバウンス（300ms）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // カテゴリリスト（Header.tsxと同期/Tier1コード→日本語ラベル）
  const categories = useMemo(
    () => [
      { id: "all", label: "すべて" },
      ...Object.entries(categoryLabelMap).map(([id, label]) => ({
        id,
        label,
      })),
    ],
    []
  );

  // ヒーロー背景画像の自動切り替え（30秒ごと）
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);

      // フェードアウト完了後に画像を切り替え
      setTimeout(() => {
        setCurrentImageIndex(
          (prevIndex) => (prevIndex + 1) % heroBackgroundImages.length
        );
        setIsFading(false);
      }, 500); // フェードアウトの時間（500ms）
    }, 30000); // 30秒ごとに切り替え

    return () => clearInterval(interval);
  }, []);

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
        if (!unique.find((p) => p.id === product.id)) {
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
      const prices = history.map((h) => h.price);
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
        const category = p.category || "OTHERS";
        categoryDrops[category] = (categoryDrops[category] || 0) + 1;
      }
    });

    // 最も値下がりが多いカテゴリ
    const topCategory = Object.entries(categoryDrops).sort(
      (a, b) => b[1] - a[1]
    )[0];

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
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter((p: Product) => {
        const category = p.category || "OTHERS";
        return category === selectedCategory;
      });
    }

    // 価格帯フィルター
    const band = PRICE_BANDS[priceBand];
    result = result.filter((p: Product) => {
      const price = p.currentPrice;
      if (price <= 0) return false;
      if (price < band.min) return false;
      if (band.max !== null && price > band.max) return false;
      return true;
    });

    // 検索フィルター（デバウンス済みのクエリを使用）
    if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
      const tokens = buildSearchTokens(debouncedSearchQuery);

      if (tokens.length > 0) {
        result = result.filter((p: Product) => {
          const target = `${p.name} ${p.brand ?? ""}`;
          // すべてのトークンをAND条件で含むか
          return matchesTokens(target, tokens);
        });
      }
    }

    // デフォルトフィルター：Deal Score 10点未満の商品を非表示（「すべて」タブ以外）
    if (activeTab !== "all") {
      result = result.filter((p: Product) => {
        const score = calculateDealScore(p);
        return score >= 10;
      });
    }

    // タブフィルター
    switch (activeTab) {
      case "drops":
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

      case "new":
        // 新着（登録が新しい順）
        result.sort((a, b) => {
          const dateA =
            a.priceHistory && a.priceHistory.length > 0
              ? new Date(
                  a.priceHistory[a.priceHistory.length - 1].date
                ).getTime()
              : 0;
          const dateB =
            b.priceHistory && b.priceHistory.length > 0
              ? new Date(
                  b.priceHistory[b.priceHistory.length - 1].date
                ).getTime()
              : 0;
          return dateB - dateA;
        });
        break;

      case "ranking":
        // ランキング（Deal Score順）
        result.sort((a, b) => {
          const scoreA = calculateDealScore(a);
          const scoreB = calculateDealScore(b);
          return scoreB - scoreA;
        });
        break;

      case "all":
      default:
        // すべて（新着順）
        result.sort((a, b) => {
          const dateA =
            a.priceHistory && a.priceHistory.length > 0
              ? new Date(
                  a.priceHistory[a.priceHistory.length - 1].date
                ).getTime()
              : 0;
          const dateB =
            b.priceHistory && b.priceHistory.length > 0
              ? new Date(
                  b.priceHistory[b.priceHistory.length - 1].date
                ).getTime()
              : 0;
          return dateB - dateA;
        });
        break;
    }

    // 追加ソート（ユーザー指定）
    if (sortKey !== "default") {
      result.sort((a, b) => {
        const historyA = a.priceHistory || [];
        const historyB = b.priceHistory || [];
        const prevA =
          historyA.length > 1
            ? historyA[historyA.length - 2].price
            : a.currentPrice;
        const prevB =
          historyB.length > 1
            ? historyB[historyB.length - 2].price
            : b.currentPrice;
        const diffA = prevA - a.currentPrice; // 値下がり額（円）
        const diffB = prevB - b.currentPrice;

        const discountPercentA = prevA > 0 ? (diffA / prevA) * 100 : 0;
        const discountPercentB = prevB > 0 ? (diffB / prevB) * 100 : 0;

        switch (sortKey) {
          case "dealScore": {
            const scoreA = calculateDealScore(a);
            const scoreB = calculateDealScore(b);
            return scoreB - scoreA;
          }
          case "discountPercent":
            return discountPercentB - discountPercentA;
          case "discountAmount":
            return diffB - diffA;
          default:
            return 0;
        }
      });
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
  }, [
    uniqueProducts,
    debouncedSearchQuery,
    activeTab,
    selectedCategory,
    priceBand,
    sortKey,
  ]);

  // トレンドTOP3（スコア順）
  const trendProducts = useMemo(() => {
    const sorted = [...uniqueProducts].sort((a, b) => {
      const scoreA = calculateDealScore(a);
      const scoreB = calculateDealScore(b);
      return scoreB - scoreA;
    });
    return sorted.filter((p) => calculateDealScore(p) > 0).slice(0, 3);
  }, [uniqueProducts]);

  const tabs: Array<{ id: TabType; label: string; emoji: string }> = [
    { id: "drops", label: "値下がり速報", emoji: "🔥" },
    { id: "new", label: "新着", emoji: "✨" },
    { id: "ranking", label: "ランキング", emoji: "👑" },
    { id: "all", label: "すべて", emoji: "" },
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
    // 表示中商品のうち、上位N件のみ構造化データを生成してページ重量を抑える
    const MAX_STRUCTURED_PRODUCTS = 30;
    const productStructuredData = filteredProducts
      .filter((product) => {
        const asin = extractASIN(product.affiliateUrl);
        return asin !== null;
      })
      .slice(0, MAX_STRUCTURED_PRODUCTS)
      .map((product) => {
        const asin = extractASIN(product.affiliateUrl);
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          sku: asin,
          image: product.imageUrl,
          offers: {
            "@type": "Offer",
            price: product.currentPrice,
            priceCurrency: "JPY",
            availability: "https://schema.org/InStock",
            url: product.affiliateUrl,
          },
        };
      });

    // 動的なBreadcrumbList（カテゴリフィルターに応じて変更）
    const baseUrl = "https://trendixx.vercel.app";
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ];

    if (selectedCategory && selectedCategory !== "all") {
      const categoryLabel =
        categories.find((c) => c.id === selectedCategory)?.label ||
        selectedCategory;
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: categoryLabel,
        item: `${baseUrl}?category=${encodeURIComponent(selectedCategory)}`,
      });
    } else {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: "All Products",
        item: baseUrl,
      });
    }

    const breadcrumbStructuredData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbItems,
    };

    return {
      products: productStructuredData,
      breadcrumb: breadcrumbStructuredData,
    };
  }, [filteredProducts, selectedCategory, categories]);

  // 動的なページタイトルを生成
  const pageTitle = useMemo(() => {
    const baseTitle = "TRENDIX | Amazon価格トレンド分析・速報";
    if (selectedCategory && selectedCategory !== "all") {
      const categoryLabel =
        categories.find((c) => c.id === selectedCategory)?.label ||
        selectedCategory;
      return `${categoryLabel} | ${baseTitle}`;
    }
    if (debouncedSearchQuery) {
      return `「${debouncedSearchQuery}」の検索結果 | ${baseTitle}`;
    }
    return baseTitle;
  }, [selectedCategory, debouncedSearchQuery, categories]);

  // ページタイトルを動的に更新
  useEffect(() => {
    document.title = pageTitle;

    // OGPメタタグを更新
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", pageTitle);
    }

    // Twitter Cardメタタグを更新
    const twitterTitle = document.querySelector(
      'meta[name="twitter:title"]'
    );
    if (twitterTitle) {
      twitterTitle.setAttribute("content", pageTitle);
    }
  }, [pageTitle]);

  return (
    <>
      {/* ヘッダー（検索機能付き） */}
      <Header searchQuery={searchQuery} onSearch={handleSearch} />

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

      {isModalOpen && (
        <AlertModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          product={selectedProduct}
        />
      )}
      <div className="pb-16 min-h-screen">
        {/* 統計サマリーエリア（ヘッダー直下） */}
        <section className="relative bg-white/80 backdrop-blur-sm border-b border-gray-200/50 py-8 md:py-12 px-3 overflow-hidden">
          {/* 背景画像（動的切り替え） */}
          <div
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 transition-opacity duration-500 ${
              isFading ? "opacity-0" : "opacity-20"
            }`}
            style={{
              backgroundImage: `url('${heroBackgroundImages[currentImageIndex]}')`,
            }}
            aria-hidden="true"
          ></div>
          {/* オーバーレイ（グラデーション） */}
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80"
            aria-hidden="true"
          ></div>
          {/* コンテンツ */}
          <div className="container mx-auto max-w-[1920px] relative z-10">
            {/* メインメッセージ */}
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-2 leading-tight">
                買い時の商品が、<span className="text-trust">一瞬でわかる。</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mb-2">
                Amazonの価格変動を24時間365日監視中
              </p>
              <p className="text-gray-500 text-xs md:text-sm max-w-2xl mx-auto">
                TRENDIXは、Amazonの価格変動をAIがリアルタイムで分析し、本当に安くなった商品のみを自動で抽出・表示します。
              </p>
              <div className="mt-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 text-[11px] md:text-xs text-gray-700">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 border border-gray-200">
                  AIが「本当にお得な値下がり」だけを自動抽出
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 border border-gray-200">
                  過去価格と下落率からデータで買い時を判定
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/80 border border-gray-200">
                  価格グラフを見なくても「なぜお得か」が一瞬で分かる
                </span>
              </div>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {/* 監視商品数（信頼性カラー） */}
              <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl p-6 border border-blue-100/50 shadow-soft">
                <div className="text-sm text-trust font-medium mb-2">
                  監視商品数
                </div>
                <div className="text-4xl font-bold text-trust font-sans">
                  {stats.totalProducts}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  商品をリアルタイム監視中
                </div>
              </div>

              {/* 本日値下がり件数（価格アンカリング強調） */}
              <div className="bg-gradient-to-br from-rose-50/60 to-pink-50/40 rounded-2xl p-6 border border-rose-100/50 shadow-soft relative overflow-hidden animate-pulse-slow">
                <div className="absolute top-2 right-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white bg-cta/90 shadow-sm">
                    🔥 お得
                  </span>
                </div>
                <div className="text-sm text-rose-700 font-medium mb-2">
                  本日値下がり件数
                </div>
                <div className="text-4xl font-bold text-rose-800 font-sans">
                  {stats.dropsToday}
                </div>
                <div className="text-xs text-rose-600 mt-1">
                  件の商品が値下がり
                </div>
              </div>

              {/* 最安値更新件数 */}
              <div className="bg-gradient-to-br from-amber-50/60 to-yellow-50/40 rounded-2xl p-6 border border-amber-100/50 shadow-soft">
                <div className="text-sm text-amber-700 font-medium mb-2">
                  最安値更新件数
                </div>
                <div className="text-4xl font-bold text-amber-800 font-sans">
                  {stats.lowestPriceUpdates}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  件が過去最安値を更新
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 本日のトレンド（TOP3カルーセル） */}
        {trendProducts.length > 0 && !debouncedSearchQuery && (
          <section className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 py-6 md:py-8 px-4 md:px-6">
            <div className="container mx-auto max-w-[1920px]">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-slate-900">
                  本日のトレンド
                </h2>
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
                          <span className="text-xs font-bold text-purple-600">
                            No.{index + 1}
                          </span>
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
                              ¥
                              {product.priceHistory[
                                product.priceHistory.length - 2
                              ].price.toLocaleString()}
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
          <div className="bg-gradient-to-r from-rose-50/60 to-pink-50/40 border-b border-rose-100/50 py-4 px-4 md:px-6">
            <div className="container mx-auto max-w-[1920px]">
              <p className="text-sm text-gray-700 text-center">
                今日は
                <strong className="text-rose-700 font-bold font-sans">
                  {stats.dropsToday}
                </strong>
                商品が値下がりしています。
                {stats.topCategory && stats.topCategoryCount > 0 && (
                  <span>
                    {" "}
                    特に
                    <strong className="text-rose-800 font-bold">
                      {categoryLabelMap[stats.topCategory] ||
                        stats.topCategory}
                    </strong>
                    カテゴリが狙い目です。
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* エレガントな区切り */}
        <div className="border-t border-gray-200/50 my-10 md:my-12"></div>

        {/* タブ切り替えUI */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
          <div className="container mx-auto max-w-[1920px] px-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
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
        <div className="container mx-auto max-w-[1920px] px-4 md:px-6 py-8 md:py-10">
          {/* 検索結果・カテゴリフィルター情報 */}
          {(debouncedSearchQuery ||
            (selectedCategory && selectedCategory !== "all")) &&
            !isLoading &&
            !error && (
              <div className="mb-6">
                {debouncedSearchQuery && (
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    「{debouncedSearchQuery}」の検索結果
                  </h2>
                )}
                {selectedCategory && selectedCategory !== "all" && !debouncedSearchQuery && (
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    {categories.find((c) => c.id === selectedCategory)?.label ||
                      selectedCategory}
                    カテゴリ
                  </h2>
                )}
                {debouncedSearchQuery &&
                  selectedCategory &&
                  selectedCategory !== "all" && (
                    <h2 className="text-lg font-bold text-slate-900 mb-1">
                      「{debouncedSearchQuery}
                      」の検索結果（
                      {categories.find((c) => c.id === selectedCategory)
                        ?.label || selectedCategory}
                      カテゴリ）
                    </h2>
                  )}
                <span className="text-sm text-gray-500">
                  {filteredProducts.length}件 / 全{uniqueProducts.length}件
                </span>
              </div>
            )}

          {/* シンプルなフィルター＆ソート（スマホ優先レイアウト） */}
          {!isLoading && !error && (
            <div className="mb-5 flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-gray-500">価格帯:</span>
                {(["all", "under3k", "3kto10k", "over10k"] as PriceBand[]).map(
                  (bandKey) => {
                    const band = PRICE_BANDS[bandKey];
                    return (
                      <button
                        key={bandKey}
                        type="button"
                        onClick={() => setPriceBand(bandKey)}
                        className={`px-2 py-1 rounded-full border text-[11px] ${
                          priceBand === bandKey
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-200"
                        }`}
                      >
                        {band.label}
                      </button>
                    );
                  }
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">並び替え:</span>
                  <select
                    value={sortKey}
                    onChange={(e) =>
                      setSortKey(e.target.value as SortKey)
                    }
                    className="h-8 px-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700"
                  >
                    <option value="default">おすすめ順</option>
                    <option value="dealScore">
                      AI Deal Scoreが高い順
                    </option>
                    <option value="discountPercent">
                      割引率が高い順
                    </option>
                    <option value="discountAmount">
                      値下げ額が大きい順
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ローディング状態 */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6">
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  データの取得に失敗しました
                </h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={18} />
                  <span>再読み込み</span>
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
                      {debouncedSearchQuery ? (
                        <>
                          「
                          <span className="font-semibold text-gray-900">
                            {debouncedSearchQuery}
                          </span>
                          」に一致する商品は見つかりませんでした。
                          <br />
                          別のキーワードで検索するか、フィルターを変更してお試しください。
                        </>
                      ) : selectedCategory && selectedCategory !== "all" ? (
                        <>
                          選択したカテゴリ「
                          <span className="font-semibold text-gray-900">
                            {categories.find(
                              (c) => c.id === selectedCategory
                            )?.label || selectedCategory}
                          </span>
                          」に該当する商品は現在ありません。
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
                      {(debouncedSearchQuery ||
                        (selectedCategory && selectedCategory !== "all")) && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("all");
                            setActiveTab("all");
                          }}
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <X size={18} />
                          <span>検索条件をクリア</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                          setActiveTab("all");
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
                  {/* 高密度グリッド表示（垂直カード） */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-5 lg:gap-6">
                    {filteredProducts.map((p, index) => {
                      const categoryCode = p.category || "OTHERS";
                      const categoryLabel =
                        categoryLabelMap[categoryCode] ||
                        categoryCode ||
                        categoryLabelMap.OTHERS;

                      return (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isPriority={index < 6}
                          onAlertClick={handleAlertClick}
                          onFavoriteToggle={(asin, isFavorite) => {
                            // お気に入り状態変更時の処理（必要に応じて実装）
                          }}
                          categoryLabel={categoryLabel}
                        />
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}


