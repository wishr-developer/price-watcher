import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, isValidLocale } from '@/i18n';
import Footer from '@/components/Footer';

/**
 * ロケールレイアウト
 * next-intlを使用して国際化を提供
 * Footerを全ページで共通表示
 * Headerは各ページで個別に実装（検索機能のため）
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // ロケールが有効でない場合は404を返す
  if (!isValidLocale(locale)) {
    notFound();
  }

  // メッセージを取得
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}

/**
 * 動的パラメータを生成（静的生成を無効化）
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

