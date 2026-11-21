"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { ParsedData, StockItem } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import { fieldClass, fmt, needsAttention, panel, productKey, StatCards } from "./inventory-ui";

export default function WarehouseSummary({ data }: { data: ParsedData }) {
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const groups = new Map<string, StockItem[]>();
  for (const row of data.stockItems) {
    const group = groups.get(row.warehouse) ?? [];
    group.push(row);
    groups.set(row.warehouse, group);
  }
  const warehouses = [...groups].map(([name, rows]) => ({
    name,
    stock: rows.reduce((sum, row) => sum + (row.stock ?? 0), 0),
    products: new Set(rows.map(productKey)).size,
    empty: rows.filter(row => row.stock === 0).length,
    low: rows.filter(row => ["Menipis", "Kritis"].includes(stockStatus(row.stock, row.minStock))).length,
    unknown: rows.filter(row => row.stock === null).length,
    attention: rows.filter(needsAttention).length,
    hasPositive: rows.some(row => row.stock !== null && row.stock > 0),
  })).filter(warehouse => warehouse.name.toLowerCase().includes(search.trim().toLowerCase())
    && (!condition || (condition === "attention" ? warehouse.attention > 0 : !warehouse.hasPositive)))
    .sort((a, b) => b.stock - a.stock || a.name.localeCompare(b.name));

  return <>
    <section aria-label="Filter gudang" className={panel + " flex flex-wrap gap-3"}>
      <input aria-label="Cari gudang" placeholder="Cari nama gudang" className={fieldClass + " min-w-52 flex-1"} value={search} onChange={event => setSearch(event.target.value)} />
      <select aria-label="Filter kondisi gudang" className={fieldClass} value={condition} onChange={event => setCondition(event.target.value)}><option value="">Semua kondisi</option><option value="attention">Perlu perhatian</option><option value="empty">Tanpa stok positif tercatat</option></select>
      <button className={fieldClass} onClick={() => { setSearch(""); setCondition(""); }}>Reset filter</button>
    </section>
    <StatCards items={[
      { title: "Gudang sesuai filter", value: fmt(warehouses.length), description: "Lokasi gudang yang ditampilkan" },
      { title: "Memiliki stok positif", value: fmt(warehouses.filter(warehouse => warehouse.hasPositive).length), description: "Gudang dengan sedikitnya satu stok produk positif" },
      { title: "Gudang perlu perhatian", value: fmt(warehouses.filter(warehouse => warehouse.attention > 0).length), description: "Ada stok habis, menipis, kritis, atau perlu diperiksa" },
      { title: "Tanpa stok positif tercatat", value: fmt(warehouses.filter(warehouse => !warehouse.hasPositive).length), description: "Stok kosong atau belum dapat dipastikan" },
    ]} />
    <section className={panel}>
      <h2 className="font-bold text-slate-900">Perbandingan stok antar gudang</h2>
      <p className="mt-1 text-xs text-slate-500">Jumlah stok yang diketahui, termasuk koreksi negatif. Stok yang tidak diketahui tidak dihitung.</p>
      {warehouses.length ? <div className="mt-5 max-h-[480px] overflow-y-auto"><ResponsiveContainer width="100%" height={Math.max(260, warehouses.length * 42)}>
        <BarChart data={warehouses} layout="vertical" margin={{ left: 5, right: 25 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={125} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="stock" name="Stok tercatat" fill="#0E33BC" radius={[0, 5, 5, 0]} /></BarChart>
      </ResponsiveContainer></div> : <p className="py-8 text-center text-sm text-slate-500">Tidak ada gudang sesuai filter.</p>}
    </section>
    <section className={panel}>
      <h2 className="mb-4 font-bold text-slate-900">Rekap per gudang</h2>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead><tr>{["Gudang", "Jenis produk", "Total stok", "Stok habis", "Menipis / kritis", "Perlu perhatian", "Rincian"].map(heading => <th key={heading} className="whitespace-nowrap border-b border-slate-200 p-3 text-slate-500">{heading}</th>)}</tr></thead>
        <tbody>{warehouses.map(warehouse => <tr key={warehouse.name} className="border-b border-slate-100 text-slate-700">
          <td className="whitespace-nowrap p-3 font-semibold text-slate-900">{warehouse.name}</td><td className="p-3">{fmt(warehouse.products)}</td>
          <td className="p-3">{fmt(warehouse.stock)}{warehouse.unknown > 0 && <p className="mt-1 whitespace-nowrap text-xs text-amber-700">{warehouse.unknown} catatan belum diketahui</p>}</td>
          <td className="p-3">{fmt(warehouse.empty)}</td><td className="p-3">{fmt(warehouse.low)}</td><td className="p-3">{fmt(warehouse.attention)}</td>
          <td className="p-3"><Link href={{ pathname: "/stok-produk", query: { gudang: warehouse.name } }} className="whitespace-nowrap font-medium text-[#0E33BC] hover:underline">Lihat stok produk</Link></td>
        </tr>)}</tbody>
      </table></div>
      {!warehouses.length && <p className="py-8 text-center text-sm text-slate-500">Tidak ada gudang sesuai filter.</p>}
      <p className="mt-4 text-xs text-slate-500">Stok habis, menipis / kritis, dan perlu perhatian dihitung per catatan produk di setiap gudang.</p>
    </section>
  </>;
}
