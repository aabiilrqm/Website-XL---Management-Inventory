import Link from "next/link";
import { ArrowRight, Package, Store } from "lucide-react";
import type { ParsedData } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import { fmt, needsAttention, panel, productKey, RankingChart, stockBalances, StatCards } from "./inventory-ui";

export default function InventoryOverview({ data }: { data: ParsedData }) {
  const rows = data.stockItems;
  const statuses = ["Aman", "Menipis", "Kritis", "Habis", "Periksa", "Belum dinilai"];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const status = stockStatus(row.stock, row.minStock);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const palette = ["#047857", "#b45309", "#c2410c", "#b91c1c", "#6d28d9", "#64748b"];
  const missing = rows.filter(row => row.stock === null).length;
  return <>
    <StatCards items={[
      { title: "Total stok tercatat", value: fmt(rows.reduce((sum, row) => sum + (row.stock ?? 0), 0)), description: missing ? `${missing} catatan stok belum diketahui; total belum lengkap` : "Saldo seluruh gudang, termasuk koreksi negatif" },
      { title: "Total produk", value: fmt(new Set(rows.map(productKey)).size), description: "Jenis produk unik dalam laporan" },
      { title: "Total gudang", value: fmt(new Set(rows.map(row => row.warehouse)).size), description: "Lokasi gudang dalam laporan" },
      { title: "Perlu perhatian", value: fmt(rows.filter(needsAttention).length), description: "Catatan stok habis, menipis, kritis, atau perlu diperiksa" },
    ]} />
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-slate-900">Kondisi persediaan</h2><p className="mt-1 text-xs text-slate-500">Jumlah catatan produk per gudang menurut status stok.</p></div>
        <Link href="/stok-produk" className="flex items-center gap-2 text-sm font-semibold text-[#0E33BC]">Lihat rincian stok <ArrowRight size={16} /></Link>
      </div>
      <div className="mt-5 space-y-3">{statuses.map((status, index) => {
        const count = counts.get(status) ?? 0;
        const percent = rows.length ? 100 * count / rows.length : 0;
        return <div key={status} className="grid grid-cols-[6rem_1fr_6rem] items-center gap-3 text-sm text-slate-700">
          <span>{status}</span>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{width: percent + "%", backgroundColor: palette[index]}} /></div>
          <span className="text-right tabular-nums">{fmt(count)} ({Math.round(percent)}%)</span>
        </div>;
      })}</div>
    </section>
    <RankingChart title="Kategori dengan stok terbesar" description="Lima kategori dengan saldo positif terbesar di seluruh gudang. Saldo mencakup koreksi negatif dan hanya memakai stok yang diketahui."
      values={stockBalances(rows, row => row.category, row => row.category || "Tanpa kategori")} unit="unit" color="#0E33BC" empty="Belum ada kategori dengan saldo positif tercatat." />
    <div className="grid gap-4 md:grid-cols-2">
      <Link href="/stok-produk" className={panel + " flex items-center gap-4 transition hover:border-blue-300"}>
        <Package className="shrink-0 text-[#0E33BC]" size={26} /><div className="flex-1"><h2 className="font-bold text-slate-900">Stok Produk</h2><p className="mt-1 text-sm text-slate-500">Cari produk, cek minimum dan harga, lalu ekspor rincian stok.</p></div><ArrowRight className="shrink-0 text-slate-400" size={20} />
      </Link>
      <Link href="/gudang" className={panel + " flex items-center gap-4 transition hover:border-blue-300"}>
        <Store className="shrink-0 text-[#0E33BC]" size={26} /><div className="flex-1"><h2 className="font-bold text-slate-900">Gudang</h2><p className="mt-1 text-sm text-slate-500">Bandingkan total stok dan kondisi persediaan antar lokasi.</p></div><ArrowRight className="shrink-0 text-slate-400" size={20} />
      </Link>
    </div>
  </>;
}
