import "./globals.css";
import Footer from "@/components/Footer";
import { CategoryProvider } from "@/contexts/CategoryContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="flex flex-col min-h-screen bg-white text-slate-900">
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
