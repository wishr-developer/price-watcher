import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: "#ffffff",
        surface: "#f8f9fa", // 非常に薄いグレー
        border: "#e9ecef",
        // 信頼性カラー（低彩度の青、ニュートラル）
        'trust': {
          DEFAULT: '#4A90E2', // 低彩度の青
          light: '#E8F4FD', // 薄い青
          dark: '#2C5F8F', // 濃い青
        },
        // 行動喚起カラー（高彩度の赤・オレンジ）
        'cta': {
          DEFAULT: '#FF4444', // 高彩度の赤
          orange: '#FF6B35', // 高彩度のオレンジ
          light: '#FFE5E5', // 薄い赤
        },
        primary: "#2563eb", // 鮮やかな青
        danger: "#ef4444",  // セール価格用の赤
        'price-drop': '#EF4444', // 値下がり（赤）
        'price-up': '#3B82F6', // 値上がり（青）
        'sale': '#FF6B35', // セール強調色（オレンジ）
        'sale-bg': '#FFF5F2', // セール背景色（薄いオレンジ）
        // AI Deal Score用メタリック配色
        'score-metallic': {
          gold: '#D4AF37', // 金色
          silver: '#C0C0C0', // 銀色
          bronze: '#CD7F32', // 銅色
          blue: '#4A90E2', // メタリックブルー
        },
        text: {
          main: "#111827", // ほぼ黒
          muted: "#6b7280", // グレー
        },
        // Deal Score用グラデーション
        score: {
          s: {
            from: "#a855f7", // 紫
            to: "#ec4899", // ピンク
          },
          a: {
            from: "#3b82f6", // 青
            to: "#06b6d4", // シアン
          },
        }
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      screens: {
        'xs': '475px',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
