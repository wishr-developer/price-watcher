import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Product } from "@/types/product";

/**
 * メモリキャッシュ（サーバー再起動まで有効）
 * ファイルの変更時刻とパース済みデータを保持
 */
interface CacheEntry {
  products: Product[];
  mtime: number; // ファイルの最終更新時刻（ミリ秒）
  timestamp: number; // キャッシュ作成時刻（ミリ秒）
}

// グローバル変数としてキャッシュを保持（Next.jsのサーバーインスタンス間で共有）
declare global {
  // eslint-disable-next-line no-var
  var __productsCache: CacheEntry | undefined;
}

/**
 * 商品データを取得するAPI
 * メモリキャッシュ + ファイル変更検知で高速化
 * キャッシュ設定: 60秒間はCDNにキャッシュし、その後5分間は古いデータを見せながら再検証
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "data", "products.json");
    
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      console.error(`商品データファイルが見つかりません: ${filePath}`);
      return NextResponse.json(
        { error: "商品データファイルが見つかりません" },
        { 
          status: 404,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // ファイルの変更時刻を取得
    const stats = fs.statSync(filePath);
    const currentMtime = stats.mtimeMs;

    // キャッシュが存在し、ファイルが変更されていない場合はキャッシュを返す
    const cache = global.__productsCache;
    if (cache && cache.mtime === currentMtime) {
      // キャッシュヒット（ログは本番環境では出力しない）
      if (process.env.NODE_ENV === 'development') {
        console.log('[API] メモリキャッシュから商品データを返却');
      }
      return NextResponse.json(cache.products, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      });
    }

    // ファイルを読み込んでパース
    const fileContents = fs.readFileSync(filePath, "utf8");
    
    // JSONのパースエラーハンドリング
    let products: Product[];
    try {
      products = JSON.parse(fileContents);
    } catch (parseError) {
      console.error("商品データのJSONパースに失敗しました:", parseError);
      return NextResponse.json(
        { error: "商品データの形式が不正です" },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    // キャッシュを更新
    global.__productsCache = {
      products,
      mtime: currentMtime,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[API] 商品データを読み込み、キャッシュを更新');
    }

    // 成功レスポンス（キャッシュヘッダー付き）
    return NextResponse.json(products, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // 詳細なエラーメッセージを生成
    const errorMessage = error instanceof Error 
      ? error.message 
      : '不明なエラーが発生しました';
    
    console.error("商品データの読み込みに失敗しました:", {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        error: "商品データの読み込みに失敗しました",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}

