"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Package,
  Store,
  Warehouse,
} from "lucide-react";
import type { ParsedData, StockItem, StockStatus } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import {
  fmt,
  needsAttention,
  panel,
  productKey,
  STATUS_META,
  stockBalances,
  StatCards,
} from "./inventory-ui";
import {
  InteractiveBarChartCard,
  StockHealthDonut,
  WarehouseInteractiveChart,
  type WarehouseChartDatum,
} from "./InventoryCharts";

const STATUS_ORDER: StockStatus[] = [
  "Aman",
  "Menipis",
  "Kritis",
  "Habis",
  "Periksa",
  "Belum dinilai",
];

export default function InventoryOverview({ data }: { data: ParsedData }) {
  const router = useRouter();
  const rows = data.stockItems;

  const {
    totalStock,
    uniqueProducts,
    uniqueWarehouses,
    attentionCount,
    missingCount,
    healthEntries,
    categoryBalances,
    warehouseSummary,
  } = useMemo(() => {
    const counts = new Map<StockStatus, number>();
    const whGroups = new Map<string, StockItem[]>();
    const prodSet = new Set<string>();
    let sumStock = 0;
    let attention = 0;
    let missing = 0;

    for (const row of rows) {
      const status = stockStatus(row.stock, row.minStock);
      counts.set(status, (counts.get(status) ?? 0) + 1);
      prodSet.add(productKey(row));
      if (row.stock === null) missing++;
      else sumStock += row.stock;
      if (needsAttention(row)) attention++;

      const list = whGroups.get(row.warehouse) ?? [];
      list.push(row);
      whGroups.set(row.warehouse, list);
    }

    const entries = STATUS_ORDER.map((status) => {
      const count = counts.get(status) ?? 0;
      return {
        status,
        count,
        percent: rows.length ? (100 * count) / rows.length : 0,
        color: STATUS_META[status].color,
      };
    });

    const whData: WarehouseChartDatum[] = [...whGroups]
      .map(([name, group]) => ({
        name,
        stock: group.reduce((s, r) => s + (r.stock ?? 0), 0),
        shortage: group.reduce((s, r) => {
          if (r.stock === null || r.stock < 0 || r.minStock === null) return s;
          return s + Math.max(0, r.minStock - r.stock);
        }, 0),
        products: new Set(group.map(productKey)).size,
        safe: group.filter((r) => stockStatus(r.stock, r.minStock) === "Aman").length,
        low: group.filter((r) =>
          ["Menipis", "Kritis"].includes(stockStatus(r.stock, r.minStock)),
        ).length,
        empty: group.filter((r) => r.stock === 0).length,
        check: group.filter((r) => stockStatus(r.stock, r.minStock) === "Periksa").length,
        attention: group.filter(needsAttention).length,
      }))
      .sort((a, b) => b.stock - a.stock || a.name.localeCompare(b.name));

    return {
      totalStock: sumStock,
      uniqueProducts: prodSet.size,
      uniqueWarehouses: whGroups.size,
      attentionCount: attention,
      missingCount: missing,
      healthEntries: entries,
      categoryBalances: stockBalances(
        rows,
        (row) => row.category || "Tanpa kategori",
        (row) => row.category || "Tanpa kategori",
      ),
      warehouseSummary: whData,
    };
  }, [rows]);

  const attentionRatio = rows.length
    ? `${Math.round((100 * attentionCount) / rows.length)}%`
    : undefined;

  return (
    <div className="space-y-6">
      <StatCards
        items={[
          {
            title: "Total Stok Tercatat",
            value: fmt(totalStock),
            description: missingCount
              ? `${fmt(missingCount)} catatan belum diketahui; total belum lengkap`
              : "Saldo gabungan seluruh gudang termasuk koreksi",
            icon: <Boxes size={19} />,
            badge: "Unit",
          },
          {
            title: "Total Produk Unik",
            value: fmt(uniqueProducts),
            description: `${fmt(rows.length)} total catatan stok di seluruh lokasi`,
            icon: <Package size={19} />,
            accent: "brand",
            href: "/stok-produk",
          },
          {
            title: "Lokasi Gudang",
            value: fmt(uniqueWarehouses),
            description: "Gudang & depo aktif yang tercatat pada periode ini",
            icon: <Warehouse size={19} />,
            accent: "teal",
            href: "/gudang",
          },
          {
            title: "Perlu Perhatian",
            value: fmt(attentionCount),
            description: "Stok habis, kritis, menipis, atau perlu diperiksa",
            icon: <AlertTriangle size={19} />,
            accent: attentionCount > 0 ? "rose" : "teal",
            badge: attentionRatio,
            href: "/stok-produk?status=Habis",
          },
        ]}
      />

      {/* Primary Interactive Charts Row */}
      <div className="grid items-stretch gap-5 xl:grid-cols-[1.08fr_1fr]">
        <StockHealthDonut entries={healthEntries} total={rows.length} />
        <InteractiveBarChartCard
          title="Distribusi Stok per Kategori"
          description="Kategori dengan saldo stok positif terbesar di seluruh gudang."
          values={categoryBalances}
          unit="unit"
          colorStart="#0E33BC"
          colorEnd="#09A9A7"
          enableValueToggle
          empty="Belum ada kategori dengan saldo positif tercatat."
          selectHint="Klik kategori untuk melihat rincian produknya"
          onSelect={(item) =>
            router.push(`/stok-produk?kategori=${encodeURIComponent(item.key)}`)
          }
        />
      </div>

      {/* Interactive Warehouse Snapshot Chart */}
      <WarehouseInteractiveChart
        title="Ringkasan Stok & Risiko Antar Gudang"
        description="Bandingkan volume stok atau komposisi kesehatan persediaan di gudang teratas."
        warehouses={warehouseSummary}
        maxItems={8}
        onSelectWarehouse={(name) =>
          router.push(`/stok-produk?gudang=${encodeURIComponent(name)}`)
        }
      />

      {/* Minimalist Quick Navigation Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/stok-produk"
          className={
            panel +
            " inventory-panel-interactive group flex items-center gap-4 no-underline"
          }
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#0E33BC] transition group-hover:bg-[#0E33BC] group-hover:text-white">
            <Package size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Jelajahi Stok Produk</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Filter cepat berdasarkan status, urutkan kolom, lihat detail SKU, dan ekspor Excel.
            </p>
          </div>
          <ArrowRight
            size={18}
            aria-hidden="true"
            className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#0E33BC]"
          />
        </Link>

        <Link
          href="/gudang"
          className={
            panel +
            " inventory-panel-interactive group flex items-center gap-4 no-underline"
          }
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F8F7] text-[#0F766E] transition group-hover:bg-[#09A9A7] group-hover:text-white">
            <Store size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Analisis Performa Gudang</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pantau perbandingan stok penuh, kebutuhan restok, dan daftar produk habis per lokasi.
            </p>
          </div>
          <ArrowRight
            size={18}
            aria-hidden="true"
            className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-[#0F766E]"
          />
        </Link>
      </div>
    </div>
  );
}
