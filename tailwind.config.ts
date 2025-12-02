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
        serif: ['var(--font-serif)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        background: "#F8F6F0", // 暖かみのあるアイボリー/クリーム色（キャンバス背景）
        surface: "#FFFFFF", // 純白（カード/浮上）
        border: "#E8E6E0", // 柔らかいボーダー
        // プライマリ（信頼）- 深いネイビーブルー
        'trust': {
          DEFAULT: '#1a3455', // 深いネイビーブルー（伝統的なエレガンス）
          light: '#E8F0F5', // 薄いネイビー
          dark: '#1a3455', // 深いネイビー
        },
        // アクセント - 真鍮ゴールド
        'accent': {
          DEFAULT: '#B8860B', // 真鍮ゴールド（控えめな高級感）
          light: '#F5E6D3', // 薄いゴールド
          dark: '#8B6914', // 濃いゴールド
        },
        // 行動喚起カラー（高彩度のホットピンク/マゼンタ）
        'cta': {
          DEFAULT: '#FF0080', // 高彩度のホットピンク/マゼンタ
          orange: '#FF0080', // 高彩度のホットピンク/マゼンタ
          light: '#FFE5F5', // 薄いピンク
        },
        primary: "#1a3455", // 深いネイビーブルー
        danger: "#FF0080",  // 高彩度のホットピンク/マゼンタ
        'price-drop': '#FF0080', // 値下がり（高彩度のホットピンク/マゼンタ）
        'price-up': '#1a3455', // 値上がり（ネイビー）
        'sale': '#FF0080', // セール強調色（高彩度のホットピンク/マゼンタ）
        'sale-bg': '#FFE5F5', // セール背景色（薄いピンク）
        // AI Deal Score用メタリック配色
        'score-metallic': {
          gold: '#B8860B', // 真鍮ゴールド
          silver: '#C0C0C0', // 銀色
          bronze: '#CD7F32', // 銅色
          blue: '#1a3455', // ネイビーブルー
        },
        text: {
          main: "#1a3455", // ネイビー（ほぼ黒の代わり）
          muted: "#6b7280", // グレー
        },
        // Deal Score用グラデーション
        score: {
          s: {
            from: "#1a3455", // ネイビー
            to: "#B8860B", // ゴールド
          },
          a: {
            from: "#1a3455", // ネイビー
            to: "#4A90E2", // 青
          },
        }
      },
      boxShadow: {
        'soft': '0 4px 30px -8px rgba(0, 0, 0, 0.12), 0 8px 40px -12px rgba(0, 0, 0, 0.08)',
        'card': '0 3px 20px -4px rgba(0, 0, 0, 0.1), 0 6px 30px -8px rgba(0, 0, 0, 0.06)',
        'artistic': '0 2px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 25px -6px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.75rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
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
