'use client';

import { Search, ShoppingBag, X, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useCategory } from '@/contexts/CategoryContext';
import { usePathname } from 'next/navigation';
import categoryLabelsJson from '@/data/category_labels.json';

/**
 * お気に入りボタンコンポーネント（お気に入り数を表示）
 */
function FavoriteButton() {
  const [favoriteCount, setFavoriteCount] = useState(0);
  const pathname = usePathname();
  const locale = useLocale();

  // localStorageからお気に入り数を取得
  useEffect(() => {
    const updateFavoriteCount = () => {
      if (typeof window !== 'undefined') {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        setFavoriteCount(favorites.length);
      }
    };

    updateFavoriteCount();
    
    // localStorageの変更を監視
    const handleStorageChange = () => {
      updateFavoriteCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    // カスタムイベントでlocalStorageの変更を検知（同一タブ内）
    window.addEventListener('favoriteUpdated', updateFavoriteCount);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('favoriteUpdated', updateFavoriteCount);
    };
  }, []);

  // お気に入りページにいる場合はアクティブスタイルを適用
  const isActive = pathname === `/${locale}/favorites` || pathname === '/favorites';

  return (
    <Link
      href={`/${locale}/favorites`}
      className={`p-2 text-gray-600 hover:bg-gray-100 rounded-full relative transition-colors ${
        isActive ? 'bg-gray-100 text-gray-900' : ''
      }`}
      aria-label="お気に入り一覧"
    >
      <ShoppingBag size={20} />
      {/* お気に入り数のバッジ */}
      {favoriteCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {favoriteCount > 9 ? '9+' : favoriteCount}
        </span>
      )}
    </Link>
  );
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  onRankingClick?: () => void;
}

// デフォルトの空関数
const noop = () => {};

const categoryLabelMap = categoryLabelsJson as Record<string, string>;

export default function Header({ onSearch = noop, onRankingClick = noop }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const { selectedCategory, setSelectedCategory } = useCategory();
  const locale = useLocale();

  // カテゴリリスト（Tier1コード→日本語ラベル）
  const categories = useMemo(
    () => [
      { id: 'all', label: 'すべて' },
      ...Object.entries(categoryLabelMap).map(([id, label]) => ({
        id,
        label,
      })),
    ],
    [],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleMobileSearchOpen = () => {
    setIsMobileSearchOpen(true);
  };

  const handleMobileSearchClose = () => {
    setIsMobileSearchOpen(false);
  };

  // ESCキーでドロワーを閉じる
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleMobileSearchClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileSearchOpen]);

  // ドロワーが開いた時に検索入力にフォーカス
  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isMobileSearchOpen]);

  // フォーカストラップ: Tabキーでドロワー内のフォーカス可能な要素を循環させる
  useEffect(() => {
    if (!isMobileSearchOpen || !drawerRef.current) return;

    const drawer = drawerRef.current;
    const focusableElements = drawer.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isMobileSearchOpen]);

  // モバイル検索ドロワーが開いている時、背景のスクロールを無効化
  useEffect(() => {
    if (isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
      // 背景コンテンツをスクリーンリーダーから隠す
      const mainContent = document.querySelector('main');
      const header = document.querySelector('header');
      if (mainContent) {
        mainContent.setAttribute('aria-hidden', 'true');
      }
      if (header && !drawerRef.current?.contains(header)) {
        header.setAttribute('aria-hidden', 'true');
      }
    } else {
      document.body.style.overflow = 'unset';
      const mainContent = document.querySelector('main');
      const header = document.querySelector('header');
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }
      if (header) {
        header.removeAttribute('aria-hidden');
      }
    }
    return () => {
      document.body.style.overflow = 'unset';
      const mainContent = document.querySelector('main');
      const header = document.querySelector('header');
      if (mainContent) {
        mainContent.removeAttribute('aria-hidden');
      }
      if (header) {
        header.removeAttribute('aria-hidden');
      }
    };
  }, [isMobileSearchOpen]);

  // カテゴリメニューの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setIsCategoryMenuOpen(false);
      }
    };

    if (isCategoryMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryMenuOpen]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsCategoryMenuOpen(false);
  };

  const selectedCategoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'すべて';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-trust-light">
        <div className="container mx-auto px-3 h-16 flex items-center justify-between gap-4">
          {/* ロゴ */}
          <Link href={`/${locale}`} className="flex items-baseline gap-1" aria-label="TRENDIX ホームページに移動">
            <span className="text-2xl font-bold tracking-tight text-slate-900">TRENDIX</span>
          </Link>

          {/* 検索バー（PCのみ表示） */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input 
              type="text" 
              placeholder="何をお探しですか？（例: MacBook, スニーカー...）" 
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust transition-all"
              aria-label="商品を検索"
            />
            <button className="absolute right-3 top-2.5 text-gray-400 hover:text-trust transition-colors" aria-label="検索">
              <Search size={18} />
            </button>
          </div>

          {/* 右側メニュー */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* カテゴリドロップダウン */}
            <div className="relative" ref={categoryMenuRef}>
              <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black transition-colors"
                aria-expanded={isCategoryMenuOpen}
                aria-haspopup="true"
                aria-label={`カテゴリを選択: 現在は${selectedCategoryLabel}`}
              >
                <span>{selectedCategoryLabel}</span>
                <ChevronDown size={16} className={`transition-transform ${isCategoryMenuOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              
              {/* カテゴリメニュー */}
              {isCategoryMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category.id)}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-trust-light text-trust font-medium'
                            : 'text-gray-700'
                        }`}
                        aria-label={`${category.label}カテゴリを選択${selectedCategory === category.id ? '（選択中）' : ''}`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* ランキングリンク */}
            {onRankingClick ? (
              <button
                onClick={onRankingClick}
                className="text-sm font-medium text-gray-600 hover:text-black hidden sm:block transition-colors"
                aria-label="ランキングページに移動"
              >
                ランキング
              </button>
            ) : (
              <Link 
                href={`/${locale}`} 
                className="text-sm font-medium text-gray-600 hover:text-black hidden sm:block"
                aria-label="ランキングページに移動"
              >
                ランキング
              </Link>
            )}

            {/* お気に入りアイコン（ショッピングバッグ） */}
            <FavoriteButton />

            {/* モバイル: 検索アイコン */}
            <button 
              onClick={handleMobileSearchOpen}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              aria-label="検索"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* モバイル検索ドロワー */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* オーバーレイ */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleMobileSearchClose}
            aria-hidden="true"
          ></div>

          {/* ドロワー */}
          <div 
            ref={drawerRef}
            className="absolute top-0 left-0 right-0 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-drawer-title"
          >
            {/* ヘッダー */}
            <div className="flex items-center gap-4 px-4 py-4 border-b border-gray-200">
              <button
                ref={closeButtonRef}
                onClick={handleMobileSearchClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="検索ドロワーを閉じる"
              >
                <X size={20} />
              </button>
              <div className="flex-1">
                <h2 id="search-drawer-title" className="text-lg font-bold text-gray-900">検索</h2>
              </div>
            </div>

            {/* 検索入力フィールド */}
            <div className="p-4">
              <div className="relative">
                <label htmlFor="mobile-search-input" className="sr-only">
                  商品を検索
                </label>
                <input 
                  ref={searchInputRef}
                  id="mobile-search-input"
                  type="text" 
                  placeholder="何をお探しですか？（例: MacBook, スニーカー...）" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full h-12 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust transition-all"
                  aria-label="商品を検索"
                />
                <button className="absolute right-3 top-3 text-gray-400 hover:text-trust transition-colors" aria-label="検索">
                  <Search size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
