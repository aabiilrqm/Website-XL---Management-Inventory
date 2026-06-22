// app/layout.tsx
import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          {" "}
          {/* ← HARUS ADA */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
