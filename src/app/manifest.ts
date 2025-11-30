import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'XIORA TREND',
    short_name: 'XIORA',
    description: 'Amazonの価格変動を24時間監視。ガジェット、家電、日用品の「今買うべき」最安値トレンドやセール情報を、ニュースフィード形式でリアルタイム速報します。',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

