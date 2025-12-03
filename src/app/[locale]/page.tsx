'use client';

import HomeClient from './HomeClient';
import { Product } from '@/types/product';
import { useState, useEffect } from 'react';

/**
 * ホームページ（クライアントコンポーネント）
 * API経由で商品データを取得して、HomeClientに渡す
 * これにより、HTMLに全商品データが埋め込まれず、Vercelのサイズ制限を回避
 */
export default function Home() {
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { 
    // AbortControllerでメモリリークを防止
    const abortController = new AbortController();
    
    // API経由で商品データを取得
    fetch('/api/products', { signal: abortController.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Product[] | { error: string }) => {
        // コンポーネントがアンマウントされていたら処理を中断
        if (abortController.signal.aborted) return;
        
        // エラーレスポンスのチェック
        if (Array.isArray(data)) {
          setInitialProducts(data);
          setIsLoading(false);
        } else if (data && typeof data === 'object' && 'error' in data) {
          // APIがエラーを返した場合（開発環境のみ詳細ログ）
          if (process.env.NODE_ENV === 'development') {
            console.error('APIエラー:', data.error);
          }
          setInitialProducts([]);
          setIsLoading(false);
        } else {
          // 予期しない形式のレスポンス（開発環境のみ詳細ログ）
          if (process.env.NODE_ENV === 'development') {
            console.error('予期しないレスポンス形式:', data);
          }
          setInitialProducts([]);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // AbortErrorは無視（コンポーネントのアンマウント時）
        if (error.name === 'AbortError') return;
        
        // 開発環境のみ詳細ログ
        if (process.env.NODE_ENV === 'development') {
          console.error('商品データの取得に失敗しました:', error);
        }
        
        if (!abortController.signal.aborted) {
          setInitialProducts([]);
          setIsLoading(false);
        }
      });
    
    // クリーンアップ関数
    return () => {
      abortController.abort();
    };
  }, []);

  // ローディング状態とデータを渡す
  return <HomeClient initialProducts={initialProducts} isLoading={isLoading} />;
}
