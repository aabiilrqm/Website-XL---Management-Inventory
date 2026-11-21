import Link from "next/link";
import { ArrowRight, Package, Store } from "lucide-react";
import type { ParsedData } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import { fmt, needsAttention, panel, productKey, StatCards } from "./inventory-ui";

export default function InventoryOverview({ data }: { data: ParsedData }) {
  const rows = data.stockItems;
  const statuses = ["Aman", "Menipis", "Kritis", "Habis", "Periksa", "Belum dinilai"];
  const counts = new Map<string, number>();
  for (const row of rows) {
    const status = stockStatus(row.stock, row.minStock);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
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
      <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">{statuses.map(status => <div key={status} className="rounded-2xl bg-slate-50 p-4">
        <p className="text-xs text-slate-500">{status}</p><p className="mt-2 text-xl font-bold text-slate-900">{fmt(counts.get(status) ?? 0)}</p>
      </div>)}</div>
    </section>
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
