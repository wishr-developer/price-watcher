import Link from "next/link";
import Header from "@/components/Header";

/**
 * 特定商取引法に基づく表記ページ
 */
export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          特定商取引法に基づく表記
        </h1>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              事業者名
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TRENDIX
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              運営責任者
            </h2>
            <p className="text-gray-700 leading-relaxed">
              TRENDIX運営チーム
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              お問い合わせ先
            </h2>
            <p className="text-gray-700 leading-relaxed">
              <Link href="/" className="text-primary-600 hover:text-primary-700 underline">
                ホームページ
              </Link>
              からお問い合わせください。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              販売価格
            </h2>
            <p className="text-gray-700 leading-relaxed">
              当サイトは、商品の販売を行っておりません。
              商品の価格は、各販売元（Amazon.co.jp等）が決定し、表示しています。
              価格は予告なく変更される場合があります。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              商品の販売について
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、Amazonアソシエイトプログラムに参加しており、
              商品の紹介を行っています。商品の購入は、Amazon.co.jpのサイトで行われます。
            </p>
            <p className="text-gray-700 leading-relaxed">
              商品の販売、配送、返品・交換、保証等に関するお問い合わせは、
              各販売元（Amazon.co.jp等）にお問い合わせください。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              支払い方法
            </h2>
            <p className="text-gray-700 leading-relaxed">
              商品の購入時の支払い方法は、各販売元（Amazon.co.jp等）が指定する方法に従います。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              商品の引き渡し時期
            </h2>
            <p className="text-gray-700 leading-relaxed">
              商品の引き渡し時期は、各販売元（Amazon.co.jp等）が指定する時期に従います。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              返品・交換について
            </h2>
            <p className="text-gray-700 leading-relaxed">
              商品の返品・交換については、各販売元（Amazon.co.jp等）の返品・交換ポリシーに従います。
              当サイトでは、商品の返品・交換の手続きは行っておりません。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              免責事項
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              当サイトは、商品の価格情報を提供していますが、
              価格の正確性、商品の在庫状況、商品の品質等について保証するものではありません。
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              商品の購入に関する決定は、ユーザー自身の責任において行ってください。
            </p>
            <p className="text-gray-700 leading-relaxed">
              当サイトの利用により生じた損害について、当サイトは一切の責任を負いません。
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

