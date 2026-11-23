import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { stockStatus } from "@/lib/stock-status";
import type { StockItem, StockStatus } from "@/lib/excel-parser";

export const panel = "inventory-panel";
export const fieldClass =
  "rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 transition hover:border-slate-300 focus:border-[#0E33BC] focus:outline-none";

export const fmt = (value: number | null) =>
  value === null
    ? "Tidak diketahui"
    : value.toLocaleString("id-ID", { maximumFractionDigits: 2 });

export const fmtCompact = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} M`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} Jt`;
  if (abs >= 10_000) return `${(value / 1_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} rb`;
  return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
};

export const productKey = (item: StockItem) =>
  JSON.stringify([
    item.sku || item.product.toLowerCase(),
    item.brand.toLowerCase(),
    item.category.toLowerCase(),
  ]);

export const needsAttention = (item: StockItem) =>
  ["Habis", "Kritis", "Menipis", "Periksa"].includes(
    stockStatus(item.stock, item.minStock),
  );

export const STATUS_META: Record<
  StockStatus,
  { color: string; bg: string; text: string; dot: string; ring: string }
> = {
  Aman: {
    color: "#059669",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    ring: "ring-emerald-200/80",
  },
  Menipis: {
    color: "#D97706",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
    ring: "ring-amber-200/80",
  },
  Kritis: {
    color: "#EA580C",
    bg: "bg-orange-50",
    text: "text-orange-700",
    dot: "bg-orange-500",
    ring: "ring-orange-200/80",
  },
  Habis: {
    color: "#E11D48",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    ring: "ring-rose-200/80",
  },
  Periksa: {
    color: "#7C3AED",
    bg: "bg-violet-50",
    text: "text-violet-700",
    dot: "bg-violet-500",
    ring: "ring-violet-200/80",
  },
  "Belum dinilai": {
    color: "#64748B",
    bg: "bg-slate-100",
    text: "text-slate-600",
    dot: "bg-slate-400",
    ring: "ring-slate-200/80",
  },
};

export interface StatCardItem {
  title: string;
  value: string;
  description: string;
  icon?: ReactNode;
  accent?: "brand" | "teal" | "amber" | "rose" | "slate";
  badge?: string;
  href?: string;
}

const ACCENT_ICON_CLASSES: Record<NonNullable<StatCardItem["accent"]>, string> = {
  brand: "bg-[#EEF3FF] text-[#0E33BC]",
  teal: "bg-[#E6F8F7] text-[#0F766E]",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCards({ items }: { items: StatCardItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const isHero = index === 0;
        const inner = (
          <div
            className={`metric-card flex h-full flex-col justify-between p-5 ${
              isHero ? "metric-card-hero" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isHero ? "text-blue-100/90" : "text-slate-500"
                }`}
              >
                {item.title}
              </p>
              {item.icon && (
                <span
                  aria-hidden="true"
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isHero
                      ? "bg-white/15 text-white backdrop-blur-sm"
                      : ACCENT_ICON_CLASSES[item.accent ?? "brand"]
                  }`}
                >
                  {item.icon}
                </span>
              )}
            </div>

            <div className="my-3 flex items-baseline gap-2.5">
              <p
                className={`break-words text-[clamp(24px,2.1vw,32px)] font-extrabold leading-none tracking-tight tabular-nums ${
                  isHero ? "text-white" : "text-slate-900"
                }`}
              >
                {item.value}
              </p>
              {item.badge && (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    isHero
                      ? "bg-white/15 text-teal-100"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <div className="flex items-end justify-between gap-2">
              <p
                className={`text-xs leading-relaxed ${
                  isHero ? "text-blue-100/85" : "text-slate-500"
                }`}
              >
                {item.description}
              </p>
              {item.href && (
                <ArrowUpRight
                  size={16}
                  aria-hidden="true"
                  className={`shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                    isHero ? "text-blue-100" : "text-slate-400 group-hover:text-[#0E33BC]"
                  }`}
                />
              )}
            </div>
          </div>
        );

        return item.href ? (
          <Link key={item.title} href={item.href} className="group block no-underline">
            {inner}
          </Link>
        ) : (
          <div key={item.title}>{inner}</div>
        );
      })}
    </div>
  );
}

export function StatusBadge({ item }: { item: StockItem }) {
  const status = stockStatus(item.stock, item.minStock);
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.bg} ${meta.text} ${meta.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}

export type ChartValue = {
  key: string;
  label: string;
  value: number;
  secondaryValue?: number;
  count?: number;
  meta?: string;
};

export function stockBalances(
  rows: StockItem[],
  groupKey: (row: StockItem) => string,
  label: (row: StockItem) => string,
) {
  const balances = new Map<string, ChartValue>();
  for (const row of rows) {
    if (row.stock === null) continue;
    const key = groupKey(row);
    const balance = balances.get(key) ?? {
      key,
      label: label(row),
      value: 0,
      secondaryValue: 0,
      count: 0,
    };
    balance.value += row.stock;
    if (row.price !== null) {
      balance.secondaryValue = (balance.secondaryValue ?? 0) + row.stock * row.price;
    }
    balance.count = (balance.count ?? 0) + 1;
    balances.set(key, balance);
  }
  return [...balances.values()];
}
