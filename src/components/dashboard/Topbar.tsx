// components/dashboard/Topbar.tsx
"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

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
          Dashboard Gudang Makassar
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#1ACAA2]" />
        </button>

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
