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

type ChartValue = { key: string; label: string; value: number };

export function stockBalances(rows: StockItem[], groupKey: (row: StockItem) => string, label: (row: StockItem) => string) {
  const balances = new Map<string, ChartValue>();
  for (const row of rows) {
    if (row.stock === null) continue;
    const key = groupKey(row);
    const balance = balances.get(key) ?? { key, label: label(row), value: 0 };
    balance.value += row.stock;
    balances.set(key, balance);
  }
  return [...balances.values()];
}

export function RankingChart({ title, description, values, unit, color, empty }: {
  title: string; description: string; values: ChartValue[]; unit: string; color: string; empty: string;
}) {
  const top = values.filter(entry => entry.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id")).slice(0, 5);
  return <section className={panel + " min-w-0"}>
    <h2 className="font-bold text-slate-900">{title}</h2>
    <p className="mt-1 text-xs text-slate-500">{description}</p>
    {top.length ? <ol className="mt-5 space-y-4">{top.map(entry => <li key={entry.key}>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words text-slate-700">{entry.label}</span>
        <span className="shrink-0 font-semibold tabular-nums text-slate-900">{fmt(entry.value)} {unit}</span>
      </div>
      <div aria-hidden="true" className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: (100 * entry.value / top[0].value) + "%", backgroundColor: color }} /></div>
    </li>)}</ol> : <p className="py-6 text-sm text-slate-500">{empty}</p>}
  </section>;
}
