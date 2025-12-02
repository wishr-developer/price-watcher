import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Poppins } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { CategoryProvider } from "@/contexts/CategoryContext";
import { GA_ID, isGAEnabled } from "@/lib/gtag";

// 非クリティカルなコンポーネントを動的インポート（遅延読み込み）
const WebVitals = dynamic(() => import("@/components/WebVitals"), {
  ssr: false,
});

const GATracker = dynamic(() => import("@/components/GATracker"), {
  ssr: false,
});

// Poppinsフォントの設定
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

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
    google: 'HFQX07XJ6AWIutOvFEhHI68n6ait4ei8nchO3fFK4qY',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className={poppins.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        {/* Google Analytics 4 */}
        {isGAEnabled && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${poppins.className} flex flex-col min-h-screen bg-white text-slate-900`} suppressHydrationWarning>
        <WebVitals />
        {isGAEnabled && <GATracker />}
        <CategoryProvider>
          {children}
        </CategoryProvider>
      </body>
    </html>
  );
}
