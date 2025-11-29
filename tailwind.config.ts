import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F8F9FA",
        border: "#E5E7EB",
        primary: "#FF9900", // Amazonオレンジ
        accent: "#FF6B35", // アクセントオレンジ
        text: {
          main: "#1F2937", // 濃いグレー
          muted: "#6B7280", // ミディアムグレー
          dim: "#9CA3AF", // 薄いグレー
        },
        success: "#10B981", // 緑（価格下落）
        danger: "#EF4444", // 赤（価格上昇）
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        "card-hover": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
