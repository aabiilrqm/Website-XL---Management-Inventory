// components/dashboard/Topbar.tsx
"use client";

import { LogOut } from "lucide-react";
import UploadButton from "@/components/dashboard/UploadButton";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { usePathname, useRouter } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Ringkasan Inventory",
  "/dashboard": "Ringkasan Inventory",
  "/stok-produk": "Persediaan Produk",
  "/gudang": "Rekap Gudang",
  "/profil": "Profil Akun",
  "/pengaturan": "Pengaturan Tampilan",
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const { data } = useData();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-[#0E33BC]">
          Sistem Kelola Inventory
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          {pageTitles[pathname] ?? "Inventory XL"}
        </h2>
        {data && (pathname === "/" || pathname === "/dashboard" || pathname === "/stok-produk" || pathname === "/gudang") && (
          <p className="mt-0.5 text-xs text-slate-400">
            Periode laporan: {data.reportMonth}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Tombol Upload Excel */}
        <UploadButton />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-2xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition"
        >
          <LogOut size={16} />
          Logout
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          {user?.email?.charAt(0).toUpperCase() || "AD"}
        </div>
      </div>
    </header>
  );
}
