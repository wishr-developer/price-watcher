import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";
import { CategoryProvider } from "@/contexts/CategoryContext";
import WebVitals from "@/components/WebVitals";

const metadataBase = new URL('https://price-watcher-plum.vercel.app');

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "TRENDIX | Amazon価格トレンド分析・速報",
    template: "%s | TRENDIX"
  },
  description: "TRENDIXは、Amazonの価格変動をAIがリアルタイムで分析し、ガジェット、家電、日用品の「今買うべき」最安値トレンドやセール情報を、ニュースフィード形式で速報します。",
  keywords: ["Amazon", "最安値", "トレンド", "セール", "ガジェット", "値下げ", "速報", "価格監視", "お買い得", "値下がり"],
  authors: [{ name: "TRENDIX" }],
  creator: "TRENDIX",
  publisher: "TRENDIX",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: metadataBase.toString(),
    siteName: "TRENDIX",
    title: "TRENDIX | Amazon価格トレンド分析・速報",
    description: "TRENDIXは、Amazonの価格変動をAIがリアルタイムで分析し、ガジェット、家電、日用品の「今買うべき」最安値トレンドやセール情報を、ニュースフィード形式で速報します。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TRENDIX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRENDIX | Amazon価格トレンド分析・速報",
    description: "TRENDIXは、Amazonの価格変動をAIがリアルタイムで分析し、ガジェット、家電、日用品の「今買うべき」最安値トレンドやセール情報を、ニュースフィード形式で速報します。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Google Search Console用（必要に応じて追加）
    // google: 'your-verification-code',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="flex flex-col min-h-screen bg-white text-slate-900">
        <WebVitals />
        <CategoryProvider>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </CategoryProvider>
      </body>
    </html>
  );
}
