// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventory XL — Dashboard Manajemen Persediaan",
  description:
    "Pantau persediaan produk, kondisi stok, dan distribusi antar gudang XL secara interaktif dan real-time.",
};

const themeInitScript = `
(function(){
  try {
    var saved = localStorage.getItem("xl-inventory-ui-prefs");
    if (!saved) return;
    var prefs = JSON.parse(saved);
    if (prefs.darkMode) document.documentElement.setAttribute("data-theme", "dark");
    if (prefs.compact) document.documentElement.setAttribute("data-compact", "true");
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
