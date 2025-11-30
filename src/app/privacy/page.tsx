import Link from "next/link";

/**
 * プライバシーポリシーページ
 */
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/"
            className="flex items-baseline gap-1"
          >
            <span className="text-2xl font-bold tracking-tight text-slate-900">XIORA</span>
            <span className="text-xl font-light text-slate-500 ml-1">TREND</span>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. はじめに
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              XIORA TREND（以下「当サイト」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めています。
              本プライバシーポリシーは、当サイトがどのような情報を収集し、どのように使用するかについて説明します。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. 収集する情報
            </h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              2.1 自動的に収集される情報
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトでは、Google Analyticsなどのアクセス解析ツールを使用しており、
              以下のような情報が自動的に収集される場合があります：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>IPアドレス</li>
              <li>ブラウザの種類とバージョン</li>
              <li>使用しているデバイスの種類</li>
              <li>アクセスしたページとアクセス時刻</li>
              <li>参照元のURL</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              2.2 クッキー（Cookie）
            </h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトでは、サービス向上のため、クッキーを使用する場合があります。
              クッキーは、ブラウザに保存される小さなテキストファイルで、
              ユーザーの設定やアクセス履歴を記録します。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. 情報の使用目的
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              収集した情報は、以下の目的で使用します：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>サービスの提供と改善</li>
              <li>サイトの利用状況の分析</li>
              <li>ユーザー体験の向上</li>
              <li>不正アクセスの防止</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. 第三者への情報提供
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません：
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>Google Analyticsなどのアクセス解析ツールへの提供（匿名化された情報）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Amazonアソシエイトプログラム
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、Amazonアソシエイトプログラムに参加しており、
              Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に運営されています。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              ユーザーがAmazonの商品ページにアクセスする際、Amazonのクッキーが設定される場合があります。
              これにより、Amazonは当サイトからの紹介であることを認識し、
              適切な報酬を当サイトに提供します。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Amazonのプライバシーポリシーについては、
              <a
                href="https://www.amazon.co.jp/gp/help/customer/display.html?nodeId=GX7NJQ4V8SFRBHRD"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Amazon.co.jpプライバシー規約
              </a>
              をご確認ください。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. セキュリティ
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、収集した情報の安全性を確保するため、
              適切な技術的・組織的な対策を講じています。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. プライバシーポリシーの変更
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、必要に応じて本プライバシーポリシーを変更する場合があります。
              変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. お問い合わせ
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              本プライバシーポリシーに関するお問い合わせは、
              <Link href="/" className="text-primary-600 hover:text-primary-700 underline">
                ホームページ
              </Link>
              からご連絡ください。
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              最終更新日: {new Date().toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

