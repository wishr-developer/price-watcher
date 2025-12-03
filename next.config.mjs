import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 画像最適化のパフォーマンス設定
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1年間キャッシュ（画像は変更されないため）
    // デバイスサイズの最適化（不要なサイズを削減）
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // 画像サイズの最適化（グリッド表示に最適化）
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // リモート画像のホスト名設定（重複を削除して最適化）
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ssl-images-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.co.jp',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.amazon-adsystem.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

