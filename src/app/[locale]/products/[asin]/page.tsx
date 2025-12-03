import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import { Product } from '@/types/product';

/**
 * URLからASINを抽出
 */
function extractASIN(url: string): string | null {
  const match = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
  return match ? (match[1] || match[2]) : null;
}

/**
 * 商品データを取得（サーバーサイド）
 */
async function getProduct(asin: string): Promise<Product | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json');

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const products: Product[] = JSON.parse(fileContents);

    // ASINで商品を検索
    const product = products.find((p) => {
      // product.asinフィールドを確認
      if (p.asin && p.asin === asin) {
        return true;
      }
      // affiliateUrlからASINを抽出して比較
      const urlASIN = extractASIN(p.affiliateUrl);
      return urlASIN === asin;
    });

    return product || null;
  } catch (error) {
    console.error('商品データの取得に失敗しました:', error);
    return null;
  }
}

/**
 * メタデータを生成
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ asin: string; locale: string }>;
}): Promise<Metadata> {
  const { asin } = await params;
  const product = await getProduct(asin);

  if (!product) {
    return {
      title: '商品が見つかりません | TRENDIX',
    };
  }

  return {
    title: `${product.name} | TRENDIX`,
    description: `現在価格: ¥${product.currentPrice.toLocaleString()}。価格推移グラフで買い時をチェック。`,
    openGraph: {
      title: product.name,
      description: `現在価格: ¥${product.currentPrice.toLocaleString()}`,
      images: [product.imageUrl],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: `現在価格: ¥${product.currentPrice.toLocaleString()}`,
      images: [product.imageUrl],
    },
  };
}

/**
 * PriceChartコンポーネントを動的インポート（rechartsライブラリの遅延読み込み）
 */
const PriceChart = dynamic(() => import('@/components/PriceChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 md:h-96 flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-gray-400">グラフを読み込み中...</div>
    </div>
  ),
});

/**
 * 商品詳細ページ
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ asin: string; locale: string }>;
}) {
  const { asin } = await params;
  const product = await getProduct(asin);

  if (!product) {
    notFound();
  }

  const history = product.priceHistory || [];
  const latest = product.currentPrice;
  const prev = history.length > 1 ? history[history.length - 2].price : latest;
  const priceDiff = latest - prev;

  // グラフ用データを準備
  const chartData = history.map((h, index) => ({
    date: new Date(h.date).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    }),
    price: h.price,
    index,
  }));

  // 最新の価格も追加
  if (chartData.length === 0 || chartData[chartData.length - 1].price !== latest) {
    chartData.push({
      date: '現在',
      price: latest,
      index: chartData.length,
    });
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          {/* 商品情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* 商品画像 */}
            <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* 商品詳細 */}
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {product.name}
              </h1>

              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-gray-900">
                    ¥{latest.toLocaleString()}
                  </span>
                  {prev !== latest && (
                    <span
                      className={`text-lg font-semibold ${
                        priceDiff < 0 ? 'text-red-600' : 'text-blue-600'
                      }`}
                    >
                      {priceDiff < 0 ? '↓' : '↑'}
                      {Math.abs(priceDiff).toLocaleString()}円
                    </span>
                  )}
                </div>

                {history.length > 0 && (
                  <div className="text-sm text-gray-600">
                    過去最安値: ¥
                    {Math.min(...history.map((h) => h.price), latest).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="pt-4">
                <a
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block w-full md:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors text-center"
                >
                  Amazonで購入
                </a>
              </div>
            </div>
          </div>

          {/* 価格推移グラフ */}
          {chartData.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">価格推移</h2>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <PriceChart data={chartData} priceDiff={priceDiff} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

