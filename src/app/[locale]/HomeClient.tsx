"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import ProductCard, { getRecommendationLevel } from "@/components/ProductCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";
import AlertModal from "@/components/AlertModal";
import { Product } from "@/types/product";
import { Crown, AlertCircle, RefreshCw, Search, X, ChevronDown } from "lucide-react";
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

  // 検索クエリの変更をハンドル（useCallbackでメモ化）
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 検索クエリのデバウンス（150msに短縮）
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);

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
        // STEP 6: おすすめ商品のみをフィルタリング
        result = result.filter((p: Product) => {
          return getRecommendationLevel(p) === 'recommended';
        });
        // おすすめ商品をDeal Score順にソート
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

  // カテゴリラベルの事前計算（メモ化）で再レンダリング時の計算を削減
  const productsWithCategoryLabels = useMemo(() => {
    return filteredProducts.map((p) => {
      const categoryCode = p.category || "OTHERS";
      const categoryLabel =
        categoryLabelMap[categoryCode] ||
        categoryCode ||
        categoryLabelMap.OTHERS;
      return {
        product: p,
        categoryLabel,
      };
    });
  }, [filteredProducts]);

  // トレンドTOP3（スコア順）
  const trendProducts = useMemo(() => {
    const sorted = [...uniqueProducts].sort((a, b) => {
      const scoreA = calculateDealScore(a);
      const scoreB = calculateDealScore(b);
      return scoreB - scoreA;
    });
    return sorted.filter((p) => calculateDealScore(p) > 0).slice(0, 3);
  }, [uniqueProducts]);

  // DAISO型：タブUI（買い物サイトらしい名称）
  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'drops', label: 'お得な商品' },
    { id: 'new', label: '新着' },
    { id: 'ranking', label: 'おすすめ' },
    { id: 'all', label: 'すべて' },
  ];

  // useCallbackでメモ化して再レンダリングを防止
  const handleAlertClick = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  }, []);

  // お気に入りトグルハンドラもメモ化
  const handleFavoriteToggle = useCallback((asin: string, isFavorite: boolean) => {
    // お気に入り状態変更時の処理（必要に応じて実装）
  }, []);

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
      <div className="pb-16 min-h-screen bg-gray-50">
        {/* DAISO型：ヒーローセクション */}
        <section className="bg-gray-50 border-b border-gray-200 py-8 md:py-12 px-4">
          <div className="w-full">
            {/* ファーストビュー：3つのことを確実に伝える構成（行間広め・フェードイン） */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-normal text-gray-900 mb-4 leading-relaxed hero-fade-in">
                今買っていいか、代わりに判断します
              </h1>
              {/* STEP 3: 刺さる1行（少し目立つ程度） */}
              <p className="text-base md:text-lg font-medium text-calm-navy mb-3 leading-relaxed hero-fade-in-delay-1">
                迷う買い物だけ、TRENDIXが決めます
              </p>
              <p className="text-sm md:text-base text-gray-600 mb-3 leading-relaxed hero-fade-in-delay-2">
                値下がりの理由が分かるから、安心して買える
              </p>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed hero-fade-in-delay-2">
                比較も分析も不要。判断はTRENDIXが代わりにします
              </p>
            </div>

            {/* DAISO型：太めの検索バー（ヒーロー直下） */}
            <div className="w-full max-w-3xl mx-auto mb-8">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="商品名・ブランド名で探す" 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-12 md:h-14 pl-5 pr-12 bg-white border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-calm-navy/20 focus:border-calm-navy transition-all shadow-sm hover:shadow-md"
                  aria-label="商品を検索"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Search size={20} />
                </div>
              </div>
            </div>

            {/* DAISO型：カテゴリナビ（横スクロール） */}
            <div className="w-full mb-6">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 text-sm whitespace-nowrap border border-gray-300 rounded-lg transition-all shadow-sm hover:shadow-md ${
                      selectedCategory === category.id
                        ? 'bg-calm-navy text-white border-calm-navy shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-calm-blue-gray'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* スクロールヒント（静かな誘導） */}
            <div className="flex justify-center mt-8 mb-4">
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <span className="text-xs">商品を見る</span>
                <ChevronDown size={20} className="scroll-hint" />
              </div>
            </div>
          </div>
        </section>

        {/* DAISO型：タブ切り替えUI */}
        <div className="bg-gray-50 border-b border-gray-200 sticky top-16 z-40 shadow-sm">
          <div className="w-full px-4">
            <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-calm-navy font-medium border-calm-navy'
                      : 'text-gray-500 border-transparent hover:text-calm-blue-gray'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* STEP 6: 「おすすめ」タブの意味を明示する説明文 */}
            {activeTab === 'ranking' && (
              <div className="px-4 pb-3 pt-1">
                <p className="text-sm text-gray-500 leading-relaxed">
                  今の価格・値動き・評価を見て、
                  <br className="md:hidden" />
                  TRENDIXが「無難」と判断した商品
                </p>
              </div>
            )}
          </div>
        </div>

        {/* DAISO型：商品グリッド */}
        <div className="w-full px-4 md:px-6 py-8 md:py-10">
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

          {/* DAISO型：フィルター＆ソートUI */}
          {!isLoading && !error && (
            <div className="mb-6 flex flex-wrap items-center gap-3 py-4 border-b border-gray-200">
              {/* 価格帯フィルター */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">価格帯:</span>
                <div className="flex gap-1">
                  {(['all', 'under3k', '3kto10k', 'over10k'] as PriceBand[]).map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setPriceBand(band)}
                      className={`px-3 py-1 text-sm border border-gray-300 rounded-lg transition-all shadow-sm hover:shadow-md ${
                        priceBand === band
                          ? 'bg-calm-navy text-white border-calm-navy shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50 hover:border-calm-blue-gray'
                      }`}
                    >
                      {PRICE_BANDS[band].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 並び替え */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-600">並び替え:</span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="h-8 px-3 border border-gray-300 bg-white text-sm text-gray-700 rounded-lg shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-calm-navy/20 focus:border-calm-navy transition-all"
                >
                  <option value="default">おすすめ</option>
                  <option value="dealScore">お得順</option>
                  <option value="discountPercent">割引率が高い順</option>
                  <option value="discountAmount">価格が安い順</option>
                </select>
              </div>
            </div>
          )}

          {/* ローディング状態 */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
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
                  {/* マルチデバイス対応：スマホ1列、タブレット2列、PC3〜4列 */}
                  <div 
                    className="grid-responsive grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 md:gap-x-5 lg:gap-x-6 gap-y-6 md:gap-y-7 lg:gap-y-8"
                  >
                    {productsWithCategoryLabels.map(({ product: p, categoryLabel }, index) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        isPriority={index < 6}
                        onAlertClick={handleAlertClick}
                        onFavoriteToggle={handleFavoriteToggle}
                        categoryLabel={categoryLabel}
                      />
                    ))}
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


