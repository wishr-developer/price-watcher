import Link from "next/link";

/**
 * フッターコンポーネント（ECメディア風）
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* ロゴと説明 */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-text-main">Price Watcher</span>
            </div>
            <p className="text-sm text-text-muted mb-4">
              Amazon商品の価格変動を監視・比較し、お得な買い物をサポートします。
            </p>
            <p className="text-xs text-text-dim">
              Amazonのアソシエイトとして、Price Watcherは適格販売により収入を得ています。
            </p>
          </div>

          {/* ナビゲーション */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-4">ナビゲーション</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-sm text-text-muted hover:text-primary transition-colors"
                >
                  ホーム
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-text-muted hover:text-primary transition-colors"
                >
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link
                  href="/legal"
                  className="text-sm text-text-muted hover:text-primary transition-colors"
                >
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>

          {/* お問い合わせ */}
          <div>
            <h3 className="text-sm font-semibold text-text-main mb-4">お問い合わせ</h3>
            <p className="text-sm text-text-muted">
              ご不明な点がございましたら、お気軽にお問い合わせください。
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-text-dim">
            © {currentYear} Price Watcher. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
