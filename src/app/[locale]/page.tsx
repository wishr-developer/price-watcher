import { Product } from '@/types/product';
import fs from 'fs';
import path from 'path';
import HomeClient from './HomeClient';

/**
 * サーバーサイドで商品データを取得（高速化のため直接ファイルから読み込み）
 */
async function getProducts(): Promise<Product[]> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'products.json');
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      console.error(`商品データファイルが見つかりません: ${filePath}`);
      return [];
    }

    // メモリキャッシュをチェック（グローバル変数）
    const cache = (global as any).__productsCache;
    if (cache) {
      const stats = fs.statSync(filePath);
      if (cache.mtime === stats.mtimeMs) {
        return cache.products;
      }
    }

    // ファイルを読み込んでパース
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const products: Product[] = JSON.parse(fileContents);

    // キャッシュを更新
    const stats = fs.statSync(filePath);
    (global as any).__productsCache = {
      products,
      mtime: stats.mtimeMs,
      timestamp: Date.now(),
    };

    return products;
  } catch (error) {
    console.error('商品データの読み込みに失敗しました:', error);
    return [];
  }
}

/**
 * ホームページ（サーバーコンポーネント）
 * 初期データをサーバーで取得して、クライアントコンポーネントに渡す
 */
export default async function Home() {
  // サーバーサイドで商品データを取得（API経由ではなく直接ファイルから）
  const initialProducts = await getProducts();
  
  // HomeClientに初期データを渡す
  return <HomeClient initialProducts={initialProducts} />;
}
