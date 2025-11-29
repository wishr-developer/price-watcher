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
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: "#ffffff",
        surface: "#f8f9fa", // 非常に薄いグレー
        border: "#e9ecef",
        primary: "#2563eb", // 鮮やかな青
        danger: "#ef4444",  // セール価格用の赤
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
      }
    },
  },
  plugins: [],
};
export default config;
