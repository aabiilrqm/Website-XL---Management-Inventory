"use client";

import { Bell } from "lucide-react";
import UploadButton from "@/components/dashboard/UploadButton";
import { useData } from "@/context/DataContext";

export default function Topbar() {
  const { data } = useData();

  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-[#0E33BC]">
          Sistem Kelola Inventory
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Dashboard Gudang Makassar
        </h2>
        {data && (
          <p className="mt-0.5 text-xs text-slate-400">
            Data: {data.reportMonth} · {data.totalProducts} produk ·{" "}
            {data.totalDepos} depo
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Tombol Upload Excel */}
        <UploadButton />

        <button className="relative rounded-2xl border border-slate-200 p-3 text-slate-600 hover:bg-slate-50">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#1ACAA2]" />
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          AD
        </div>
      </div>
    </header>
  );
}
