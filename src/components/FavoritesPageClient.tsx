'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import FavoritesList from '@/components/FavoritesList';
import AlertModal from '@/components/AlertModal';
import { Product } from '@/types/product';

interface FavoritesPageClientProps {
  allProducts: Product[];
}

/**
 * お気に入りページのクライアントコンポーネント
 * アラートモーダルの状態管理を行う
 */
/**
 * 検索クエリを使用する内部コンポーネント
 */
function FavoritesPageContent({ allProducts }: FavoritesPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const handleAlertClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSearch = (query: string) => {
    // 検索クエリをURLパラメータに反映
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (query) {
        url.searchParams.set('q', query);
      } else {
        url.searchParams.delete('q');
      }
      window.history.pushState({}, '', url.toString());
    }
  };

  return (
    <>
      <Header searchQuery={searchQuery} onSearch={handleSearch} />
      <FavoritesList 
        allProducts={allProducts} 
        onAlertClick={handleAlertClick}
        searchQuery={searchQuery}
      />
      <AlertModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        product={selectedProduct} 
      />
    </>
  );
}

/**
 * お気に入りページのクライアントコンポーネント
 * アラートモーダルの状態管理を行う
 */
export default function FavoritesPageClient({ allProducts }: FavoritesPageClientProps) {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <FavoritesPageContent allProducts={allProducts} />
    </Suspense>
  );
}

