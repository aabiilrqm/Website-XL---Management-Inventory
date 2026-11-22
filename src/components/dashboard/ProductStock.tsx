"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ParsedData } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import { fieldClass, fmt, panel, productKey, RankingChart, stockBalances, StatCards, StatusBadge } from "./inventory-ui";

export default function ProductStock({ data }: { data: ParsedData }) {
  const params = useSearchParams();
  const [warehouse, setWarehouse] = useState(params.get("gudang") ?? "");
  const [brand, setBrand] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [exportError, setExportError] = useState("");
  const all = data.stockItems;
  const warehouses = [...new Set(all.map(row => row.warehouse))].sort();
  const brands = [...new Set(all.map(row => row.brand))].sort();
  const rows = all.filter(row => (!warehouse || row.warehouse === warehouse)
    && (!brand || row.brand === brand)
    && (!search.trim() || `${row.product} ${row.sku}`.toLowerCase().includes(search.trim().toLowerCase()))
    && (!status || stockStatus(row.stock, row.minStock) === status));
  const pageCount = Math.max(1, Math.ceil(rows.length / 50));
  const currentPage = Math.min(page, pageCount - 1);
  const missingPrices = rows.filter(row => row.stock === null || row.price === null).length;

  async function exportRows() {
    setExportError("");
    try {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.json_to_sheet(rows.map(row => ({
        SKU: row.sku, Produk: row.product, Merek: row.brand, Kategori: row.category, Gudang: row.warehouse,
        Stok: row.stock, "Minimum Stok": row.minStock, "Harga Satuan": row.price, Status: stockStatus(row.stock, row.minStock),
        Sheet: row.sources[0]?.sheet, Baris: row.sources[0]?.row, Kolom: row.sources[0]?.column,
      })));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Stok produk");
      XLSX.writeFile(workbook, "stok-produk.xlsx");
    } catch { setExportError("Ekspor gagal. Silakan coba lagi."); }
  }

  return <>
    <section aria-label="Filter stok produk" className={panel + " flex flex-wrap gap-3"}>
      <input aria-label="Cari nama atau kode produk" placeholder="Cari nama / kode produk" className={fieldClass + " min-w-52 flex-1"} value={search} onChange={event => { setSearch(event.target.value); setPage(0); }} />
      <select aria-label="Filter gudang" className={fieldClass} value={warehouse} onChange={event => { setWarehouse(event.target.value); setPage(0); }}><option value="">Semua gudang</option>{!warehouses.includes(warehouse) && warehouse && <option value={warehouse}>{warehouse} (tidak tersedia)</option>}{warehouses.map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="Filter merek" className={fieldClass} value={brand} onChange={event => { setBrand(event.target.value); setPage(0); }}><option value="">Semua merek</option>{brands.map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="Filter status stok" className={fieldClass} value={status} onChange={event => { setStatus(event.target.value); setPage(0); }}><option value="">Semua status</option>{["Habis", "Kritis", "Menipis", "Aman", "Periksa", "Belum dinilai"].map(name => <option key={name}>{name}</option>)}</select>
      <button className={fieldClass} onClick={() => { setWarehouse(""); setBrand(""); setSearch(""); setStatus(""); setPage(0); }}>Reset filter</button>
    </section>
    <StatCards items={[
      { title: "Produk sesuai filter", value: fmt(new Set(rows.map(productKey)).size), description: `${fmt(rows.length)} catatan produk per gudang` },
      { title: "Stok habis", value: fmt(rows.filter(row => row.stock === 0).length), description: "Catatan produk per gudang dengan stok nol" },
      { title: "Menipis / kritis", value: fmt(rows.filter(row => ["Menipis", "Kritis"].includes(stockStatus(row.stock, row.minStock))).length), description: "Catatan stok di bawah minimum yang tersedia" },
      { title: "Nilai stok tercatat", value: "Rp " + fmt(rows.reduce((sum, row) => sum + (row.stock !== null && row.price !== null ? row.stock * row.price : 0), 0)), description: missingPrices ? `${fmt(missingPrices)} catatan belum memiliki stok atau harga lengkap` : "Stok × harga satuan sesuai filter" },
    ]} />
    <div className="grid gap-4 lg:grid-cols-2">
      <RankingChart title="Produk dengan stok terbesar" description="Lima produk dengan saldo positif terbesar setelah stok dijumlahkan di gudang sesuai filter."
        values={stockBalances(rows, productKey, row => [row.product, row.sku, row.brand].filter(Boolean).join(" / "))}
        unit="unit" color="#0E33BC" empty="Tidak ada produk dengan saldo positif sesuai filter." />
      <RankingChart title="Stok menurut merek" description="Lima merek dengan saldo positif terbesar dari seluruh produk sesuai filter. Stok kosong tanpa angka dilewati."
        values={stockBalances(rows, row => row.brand, row => row.brand || "Tanpa merek")}
        unit="unit" color="#0f766e" empty="Tidak ada merek dengan saldo positif sesuai filter." />
    </div>
    <section className={panel}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-bold text-slate-900">Rincian stok produk</h2><p className="mt-1 text-xs text-slate-500">Minimum dan status mengikuti masing-masing produk di gudangnya.</p></div>
        <button disabled={!rows.length} className={fieldClass + " disabled:opacity-40"} onClick={() => void exportRows()}>Ekspor hasil filter</button>
      </div>
      {exportError && <p role="alert" className="mb-3 text-sm text-red-700">{exportError}</p>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{["Produk / SKU", "Merek", "Kategori", "Gudang", "Stok", "Minimum", "Harga satuan", "Status"].map(heading => <th key={heading} className="whitespace-nowrap border-b border-slate-200 p-3 text-slate-500">{heading}</th>)}</tr></thead>
        <tbody>{rows.slice(currentPage * 50, currentPage * 50 + 50).map(row => <tr key={row.id} className="border-b border-slate-100 text-slate-700">
          <td className="min-w-52 p-3 font-medium text-slate-800">{row.product}<p className="mt-1 text-xs text-slate-400">{row.sku || "Kode tidak tersedia"}</p></td>
          <td className="p-3">{row.brand}</td><td className="p-3">{row.category}</td><td className="p-3">{row.warehouse}</td>
          <td className="whitespace-nowrap p-3">{fmt(row.stock)}</td><td className="p-3">{row.minStock === null ? "Belum tersedia" : fmt(row.minStock)}</td>
          <td className="whitespace-nowrap p-3">{row.price === null ? "Belum tersedia" : "Rp " + fmt(row.price)}</td><td className="p-3"><StatusBadge item={row} /></td>
        </tr>)}</tbody>
      </table></div>
      {!rows.length && <p className="py-8 text-center text-sm text-slate-500">Tidak ada stok sesuai filter.</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>{fmt(rows.length)} catatan · halaman {currentPage + 1} / {pageCount}</span>
        <nav aria-label="Navigasi halaman stok produk" className="flex flex-wrap items-center gap-2">
          <button className={fieldClass + " disabled:opacity-40"} disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Sebelumnya</button>
          {pageCount > 1 && <label className="flex items-center gap-2">
            Pilih halaman
            <select className={fieldClass} value={currentPage + 1} onChange={event => setPage(Number(event.target.value) - 1)}>
              {Array.from({ length: pageCount }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
            </select>
          </label>}
          <button className={fieldClass + " disabled:opacity-40"} disabled={currentPage + 1 >= pageCount} onClick={() => setPage(currentPage + 1)}>Berikutnya</button>
        </nav>
      </div>
    </section>
    <details className={panel}>
      <summary className="cursor-pointer font-semibold text-slate-900">Kualitas & sumber data · {data.preprocessing.issueCount} temuan</summary>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p className="break-all">File: {data.preprocessing.fileName}</p>
        <p>Sheet stok: {data.preprocessing.stockSource.sheet}, header baris {data.preprocessing.stockSource.headerRow}.</p>
        <p>{data.preprocessing.missingValues} stok kosong · {data.preprocessing.invalidValues} stok tidak valid · {data.preprocessing.negativeStocks} stok negatif · {data.preprocessing.duplicateRows} baris duplikat diabaikan · {data.preprocessing.totalMismatches} selisih total.</p>
        {data.preprocessing.warnings.map(warning => <p key={warning}>{warning}</p>)}
        <p>Sheet tidak diimpor: {data.preprocessing.ignoredSheets.join(", ") || "Tidak ada"}.</p>
        <div className="max-h-72 overflow-auto">{data.preprocessing.issues.map((issue, index) => <p key={index} className="border-b border-slate-100 py-2"><strong>{issue.sheet} · baris {issue.row}:</strong> {issue.message}</p>)}</div>
        {data.preprocessing.issueCount > 100 && <p>Menampilkan 100 temuan pertama dari {data.preprocessing.issueCount}.</p>}
      </div>
    </details>
  </>;
}
