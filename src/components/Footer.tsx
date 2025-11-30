export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
          <span className="text-xl font-bold text-slate-900 tracking-tight">XIORA</span>
          <span className="text-lg font-light text-slate-500 ml-1">TREND</span>
        </div>
        <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
          当サイトはAmazonアソシエイト・プログラムの参加者です。
          価格情報は定期的に更新されますが、購入時のAmazon.co.jpの表示価格が優先されます。
        </p>
        <div className="text-xs text-gray-500">
          &copy; 2024 XIORA TREND. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
