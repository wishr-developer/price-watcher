'use client';

import { Search, ShoppingBag, Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* ロゴ */}
        <Link href="/" className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900">XIORA</span>
          <span className="text-xl font-light text-slate-500 ml-1">TREND</span>
        </Link>

        {/* 検索バー（PCでは中央、スマホでは非表示等の制御も可だが今回はシンプルに） */}
        <div className="hidden md:flex flex-1 max-w-xl relative">
          <input 
            type="text" 
            placeholder="何をお探しですか？（例: MacBook, スニーカー...）" 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-10 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <button className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600">
            <Search size={18} />
          </button>
        </div>

        {/* 右側メニュー */}
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-gray-600 hover:text-black hidden sm:block">カテゴリ</button>
          <button className="text-sm font-medium text-gray-600 hover:text-black hidden sm:block">ランキング</button>
          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <ShoppingBag size={20} />
          </button>
          <button className="md:hidden p-2 text-gray-600">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
