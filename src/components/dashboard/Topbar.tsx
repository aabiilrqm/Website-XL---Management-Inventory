import { Bell, Search } from "lucide-react";

export default function Topbar() {
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
        <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 md:flex">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Cari kartu, toko, distribusi..."
            className="w-64 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>

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
