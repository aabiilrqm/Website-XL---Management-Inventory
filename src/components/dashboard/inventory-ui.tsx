import { stockStatus } from "@/lib/stock-status";
import type { StockItem } from "@/lib/excel-parser";

export const panel = "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm";
export const fieldClass = "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
export const fmt = (value: number | null) => value === null ? "Tidak diketahui" : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });
export const productKey = (item: StockItem) => JSON.stringify([item.sku || item.product.toLowerCase(), item.brand.toLowerCase(), item.category.toLowerCase()]);
export const needsAttention = (item: StockItem) => ["Habis", "Kritis", "Menipis", "Periksa"].includes(stockStatus(item.stock, item.minStock));

export function StatCards({ items }: { items: { title: string; value: string; description: string }[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map(item => <div key={item.title} className={panel}>
    <p className="text-sm text-slate-500">{item.title}</p>
    <p className="my-2 break-words text-2xl font-bold text-slate-900">{item.value}</p>
    <p className="text-xs text-slate-500">{item.description}</p>
  </div>)}</div>;
}

export function StatusBadge({ item }: { item: StockItem }) {
  const status = stockStatus(item.stock, item.minStock);
  const color = ["Periksa", "Kritis", "Habis"].includes(status) ? "bg-red-50 text-red-700"
    : status === "Menipis" ? "bg-amber-50 text-amber-700"
    : status === "Aman" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600";
  return <span className={"whitespace-nowrap rounded-full px-2 py-1 text-xs " + color}>{status}</span>;
}
