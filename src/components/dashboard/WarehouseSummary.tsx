"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  CheckCircle2,
  PackageX,
  RotateCcw,
  Search,
  Warehouse,
  X,
} from "lucide-react";
import type { ParsedData, StockItem } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import {
  fieldClass,
  fmt,
  needsAttention,
  panel,
  productKey,
  StatCards,
} from "./inventory-ui";
import {
  InteractiveBarChartCard,
  WarehouseInteractiveChart,
} from "./InventoryCharts";

type SortKey = "name" | "products" | "stock" | "empty" | "low" | "attention";

export default function WarehouseSummary({ data }: { data: ParsedData }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState<"" | "attention" | "empty">("");
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const allWarehouses = useMemo(() => {
    const groups = new Map<string, StockItem[]>();
    for (const row of data.stockItems) {
      const group = groups.get(row.warehouse) ?? [];
      group.push(row);
      groups.set(row.warehouse, group);
    }

    return [...groups].map(([name, rows]) => {
      const safe = rows.filter((r) => stockStatus(r.stock, r.minStock) === "Aman").length;
      const low = rows.filter((r) =>
        ["Menipis", "Kritis"].includes(stockStatus(r.stock, r.minStock)),
      ).length;
      const empty = rows.filter((r) => r.stock === 0).length;
      const check = rows.filter((r) => stockStatus(r.stock, r.minStock) === "Periksa").length;
      const attention = rows.filter(needsAttention).length;

      return {
        name,
        totalRows: rows.length,
        stock: rows.reduce((sum, row) => sum + (row.stock ?? 0), 0),
        shortage: rows.reduce((sum, row) => {
          if (row.stock === null || row.stock < 0 || row.minStock === null) return sum;
          return sum + Math.max(0, row.minStock - row.stock);
        }, 0),
        products: new Set(rows.map(productKey)).size,
        safe,
        empty,
        low,
        check,
        unknown: rows.filter((row) => row.stock === null).length,
        attention,
        hasPositive: rows.some((row) => row.stock !== null && row.stock > 0),
      };
    });
  }, [data.stockItems]);

  const searchFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? allWarehouses.filter((w) => w.name.toLowerCase().includes(q))
      : allWarehouses;
  }, [allWarehouses, search]);

  const warehouses = useMemo(() => {
    const filtered = searchFiltered.filter(
      (warehouse) =>
        !condition ||
        (condition === "attention" ? warehouse.attention > 0 : !warehouse.hasPositive),
    );
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "id") * dir;
      return (a[sortKey] - b[sortKey]) * dir || a.name.localeCompare(b.name, "id");
    });
  }, [searchFiltered, condition, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const attentionCount = searchFiltered.filter((w) => w.attention > 0).length;
  const emptyCount = searchFiltered.filter((w) => !w.hasPositive).length;

  return (
    <div className="space-y-6">
      {/* Interactive Filter & Condition Pills */}
      <search aria-label="Filter gudang" className={panel + " space-y-3"}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-56 flex-1">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              aria-label="Cari gudang"
              placeholder="Cari nama gudang atau depo…"
              className={fieldClass + " w-full pl-9 pr-9"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && (
              <button
                type="button"
                aria-label="Hapus pencarian gudang"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <div
            role="group"
            aria-label="Filter kondisi gudang"
            className="flex flex-wrap items-center gap-1.5"
          >
            {(
              [
                { key: "", label: "Semua", count: searchFiltered.length },
                { key: "attention", label: "Perlu perhatian", count: attentionCount },
                { key: "empty", label: "Tanpa stok positif", count: emptyCount },
              ] as const
            ).map((opt) => {
              const active = condition === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCondition(opt.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#0E33BC] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                  }`}
                >
                  {opt.label}
                  <span className="tabular-nums opacity-80">{fmt(opt.count)}</span>
                </button>
              );
            })}
          </div>

          {(search || condition) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCondition("");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset
            </button>
          )}
        </div>
      </search>

      {/* KPI Summary Cards */}
      <StatCards
        items={[
          {
            title: "Gudang Sesuai Filter",
            value: fmt(warehouses.length),
            description: "Total lokasi gudang yang dianalisis",
            icon: <Warehouse size={19} />,
          },
          {
            title: "Memiliki Stok Positif",
            value: fmt(warehouses.filter((w) => w.hasPositive).length),
            description: "Gudang dengan minimal satu SKU berstok positif",
            icon: <CheckCircle2 size={19} />,
            accent: "teal",
          },
          {
            title: "Gudang Perlu Perhatian",
            value: fmt(warehouses.filter((w) => w.attention > 0).length),
            description: "Terdapat stok habis, menipis, kritis, atau periksa",
            icon: <AlertTriangle size={19} />,
            accent: "amber",
          },
          {
            title: "Tanpa Stok Positif",
            value: fmt(warehouses.filter((w) => !w.hasPositive).length),
            description: "Stok kosong atau belum dapat dipastikan",
            icon: <PackageX size={19} />,
            accent: "rose",
          },
        ]}
      />

      {/* Multi-Mode Interactive Warehouse Comparison Chart */}
      <WarehouseInteractiveChart
        title="Perbandingan Stok & Kesehatan Antar Gudang"
        description="Ganti mode untuk melihat total stok dengan garis rata-rata, komposisi status, atau kebutuhan restok."
        warehouses={warehouses}
        showShortageMode
        onSelectWarehouse={(name) =>
          router.push(`/stok-produk?gudang=${encodeURIComponent(name)}`)
        }
      />

      {/* Secondary Risk Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        <InteractiveBarChartCard
          title="Kekurangan Stok per Gudang"
          description="Kebutuhan pengisian unit di bawah ambang minimum stok yang diketahui."
          values={warehouses.map((row) => ({
            key: row.name,
            label: row.name,
            value: row.shortage,
            count: row.low + row.empty,
          }))}
          unit="unit"
          colorStart="#B45309"
          colorEnd="#F59E0B"
          empty="Tidak ada kekurangan stok yang terukur untuk gudang sesuai filter."
          selectHint="Klik gudang untuk membuka rincian stoknya"
          onSelect={(item) =>
            router.push(`/stok-produk?gudang=${encodeURIComponent(item.key)}`)
          }
        />
        <InteractiveBarChartCard
          title="Produk Habis per Gudang"
          description="Lokasi gudang dengan jumlah catatan produk berstok nol terbanyak."
          values={warehouses.map((row) => ({
            key: row.name,
            label: row.name,
            value: row.empty,
            count: row.products,
          }))}
          unit="catatan"
          colorStart="#BE123C"
          colorEnd="#FB7185"
          empty="Tidak ada catatan stok nol untuk gudang sesuai filter."
          selectHint="Klik gudang untuk melihat produk yang habis"
          onSelect={(item) =>
            router.push(
              `/stok-produk?gudang=${encodeURIComponent(item.key)}&status=Habis`,
            )
          }
        />
      </div>

      {/* Sortable Warehouse Recap Table */}
      <section className={panel + " data-panel-contain"}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Rekap per Gudang</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Stok habis, menipis/kritis, dan perlu perhatian dihitung per catatan produk di setiap lokasi.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Gudang
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("products")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Jenis Produk
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("stock")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Total Stok
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  Rasio Kesehatan
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("empty")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Habis
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("low")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Menipis / Kritis
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("attention")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Perlu Perhatian
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 text-right font-semibold">
                  Rincian
                </th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse) => {
                const denom = Math.max(1, warehouse.totalRows);
                const safePct = (100 * warehouse.safe) / denom;
                const lowPct = (100 * warehouse.low) / denom;
                const emptyPct = (100 * warehouse.empty) / denom;
                return (
                  <tr
                    key={warehouse.name}
                    className="border-b border-slate-100 text-slate-700 last:border-b-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">
                      {warehouse.name}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{fmt(warehouse.products)}</td>
                    <td className="px-3 py-3">
                      <span className="font-bold tabular-nums text-slate-900">
                        {fmt(warehouse.stock)}
                      </span>
                      {warehouse.unknown > 0 && (
                        <p className="mt-0.5 whitespace-nowrap text-[11px] text-amber-700">
                          {warehouse.unknown} belum diketahui
                        </p>
                      )}
                    </td>
                    <td className="min-w-36 px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          aria-label={`Aman ${Math.round(safePct)}%, Menipis ${Math.round(lowPct)}%, Habis ${Math.round(emptyPct)}%`}
                          className="flex h-2 w-24 overflow-hidden rounded-full bg-slate-100"
                        >
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${safePct}%` }}
                          />
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${lowPct}%` }}
                          />
                          <div
                            className="h-full bg-rose-500"
                            style={{ width: `${emptyPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-slate-600">
                          {Math.round(safePct)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span
                        className={
                          warehouse.empty > 0 ? "font-semibold text-rose-700" : "text-slate-500"
                        }
                      >
                        {fmt(warehouse.empty)}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums">
                      <span
                        className={
                          warehouse.low > 0 ? "font-semibold text-amber-700" : "text-slate-500"
                        }
                      >
                        {fmt(warehouse.low)}
                      </span>
                    </td>
                    <td className="px-3 py-3 tabular-nums font-semibold">
                      {fmt(warehouse.attention)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={{ pathname: "/stok-produk", query: { gudang: warehouse.name } }}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#EEF3FF] px-3 py-1.5 text-xs font-semibold text-[#0E33BC] transition hover:bg-[#0E33BC] hover:text-white"
                      >
                        Lihat stok
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!warehouses.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            Tidak ada gudang sesuai filter.
          </p>
        )}
      </section>
    </div>
  );
}
