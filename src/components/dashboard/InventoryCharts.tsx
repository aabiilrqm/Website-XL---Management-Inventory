"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, BarChart3, Layers, PieChart as PieIcon, TrendingDown } from "lucide-react";
import type { StockStatus } from "@/lib/excel-parser";
import { fmt, fmtCompact, panel, STATUS_META, type ChartValue } from "./inventory-ui";

const XL_SERIES_PALETTE = [
  "#0E33BC",
  "#1D4ED8",
  "#0284C7",
  "#09A9A7",
  "#0F766E",
  "#64748B",
];

function truncateLabel(text: string, max = 20) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

/* -------------------------------------------------------------------------- */
/* 1. Stock Health Interactive Donut                                          */
/* -------------------------------------------------------------------------- */

export interface HealthStatusEntry {
  status: StockStatus;
  count: number;
  percent: number;
  color: string;
}

export function StockHealthDonut({
  entries,
  total,
}: {
  entries: HealthStatusEntry[];
  total: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const nonZeroEntries = useMemo(
    () => entries.filter((e) => e.count > 0),
    [entries],
  );

  const activeEntry =
    activeIndex !== null ? entries[activeIndex] ?? null : null;
  const safeEntry = entries.find((e) => e.status === "Aman");
  const safePercent = safeEntry ? Math.round(safeEntry.percent) : 0;

  return (
    <section className={panel + " flex flex-col justify-between"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Kondisi Persediaan
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Arahkan kursor untuk sorotan interaktif, atau klik status untuk memfilter produk.
          </p>
        </div>
        <Link
          href="/stok-produk"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#EEF3FF] px-3 py-1.5 text-xs font-semibold text-[#0E33BC] transition hover:bg-[#0E33BC] hover:text-white"
        >
          Lihat rincian
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid items-center gap-6 md:grid-cols-[220px_1fr]">
        {/* Interactive Donut Chart */}
        <div className="relative mx-auto h-[220px] w-[220px]">
          {nonZeroEntries.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={nonZeroEntries}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    cornerRadius={7}
                    stroke="none"
                    animationDuration={650}
                    onMouseEnter={(_, idx) => {
                      const target = nonZeroEntries[idx];
                      if (!target) return;
                      setActiveIndex(
                        entries.findIndex((e) => e.status === target.status),
                      );
                    }}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {nonZeroEntries.map((entry) => {
                      const isHovered = activeEntry?.status === entry.status;
                      const isDimmed = activeEntry !== null && !isHovered;
                      return (
                        <Cell
                          key={entry.status}
                          fill={entry.color}
                          fillOpacity={isDimmed ? 0.28 : 1}
                          style={{
                            cursor: "pointer",
                            transition: "fill-opacity 180ms ease, transform 180ms ease",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Dynamic Readout */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  style={activeEntry ? { color: activeEntry.color } : undefined}
                >
                  {activeEntry ? activeEntry.status : "Stok Aman"}
                </span>
                <span className="mt-0.5 text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
                  {activeEntry ? Math.round(activeEntry.percent) : safePercent}%
                </span>
                <span className="mt-0.5 text-[11px] font-medium tabular-nums text-slate-500">
                  {activeEntry
                    ? `${fmt(activeEntry.count)} catatan`
                    : `${fmt(total)} total`}
                </span>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center rounded-full border border-dashed border-slate-200 text-xs text-slate-400">
              Belum ada data
            </div>
          )}
        </div>

        {/* Interactive Legend Rows */}
        <ul className="space-y-2">
          {entries.map((entry, idx) => {
            const isHovered = activeIndex === idx;
            const meta = STATUS_META[entry.status];
            return (
              <li key={entry.status}>
                <Link
                  href={{ pathname: "/stok-produk", query: { status: entry.status } }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`group flex flex-col gap-1.5 rounded-xl px-3 py-2 transition ${
                    isHovered
                      ? "bg-[#EEF3FF]/70 ring-1 ring-[#0E33BC]/20"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${meta.dot}`}
                        aria-hidden="true"
                      />
                      {entry.status}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold tabular-nums text-slate-900">
                      {fmt(entry.count)}
                      <span className="font-normal text-slate-400">
                        ({Math.round(entry.percent)}%)
                      </span>
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(entry.percent, entry.count > 0 ? 2 : 0)}%`,
                        backgroundColor: entry.color,
                      }}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Interactive Gradient Bar Ranking Chart                                  */
/* -------------------------------------------------------------------------- */

interface BarTooltipPayloadItem {
  payload: ChartValue & { rank: number; share: number; metricValue: number };
}

function BarCustomTooltip({
  active,
  payload,
  unit,
  isCurrency,
}: {
  active?: boolean;
  payload?: BarTooltipPayloadItem[];
  unit: string;
  isCurrency?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="max-w-xs rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-[#EEF3FF] px-1.5 font-mono text-[10px] font-bold text-[#0E33BC]">
          #{item.rank}
        </span>
        <p className="font-bold text-slate-900">{item.label}</p>
      </div>
      <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">
            {isCurrency ? "Nilai stok" : "Jumlah"}
          </span>
          <span className="font-bold tabular-nums text-slate-900">
            {isCurrency ? `Rp ${fmt(item.metricValue)}` : `${fmt(item.metricValue)} ${unit}`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500">Proporsi</span>
          <span className="font-semibold tabular-nums text-[#0E33BC]">
            {item.share.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
          </span>
        </div>
        {item.count !== undefined && item.count > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-500">Catatan data</span>
            <span className="tabular-nums text-slate-700">{fmt(item.count)} baris</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function InteractiveBarChartCard({
  title,
  description,
  values,
  unit,
  colorStart = "#0E33BC",
  colorEnd = "#09A9A7",
  empty,
  enableValueToggle = false,
  onSelect,
  selectHint,
}: {
  title: string;
  description: string;
  values: ChartValue[];
  unit: string;
  colorStart?: string;
  colorEnd?: string;
  empty: string;
  enableValueToggle?: boolean;
  onSelect?: (item: ChartValue) => void;
  selectHint?: string;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [limit, setLimit] = useState<5 | 8>(5);
  const [metric, setMetric] = useState<"unit" | "value">("unit");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hasCurrencyData =
    enableValueToggle && values.some((v) => (v.secondaryValue ?? 0) > 0);
  const activeMetric = hasCurrencyData ? metric : "unit";

  const { chartData, positiveCount } = useMemo(() => {
    const mapped = values
      .map((entry) => ({
        ...entry,
        metricValue:
          activeMetric === "value" ? (entry.secondaryValue ?? 0) : entry.value,
      }))
      .filter((entry) => entry.metricValue > 0)
      .sort(
        (a, b) =>
          b.metricValue - a.metricValue || a.label.localeCompare(b.label, "id"),
      );

    const totalSum = mapped.reduce((sum, item) => sum + item.metricValue, 0);
    const sliced = mapped.slice(0, limit).map((item, idx) => ({
      ...item,
      rank: idx + 1,
      shortLabel: truncateLabel(item.label, 22),
      share: totalSum > 0 ? (100 * item.metricValue) / totalSum : 0,
    }));
    return { chartData: sliced, positiveCount: mapped.length };
  }, [values, activeMetric, limit]);

  const chartHeight = Math.max(220, chartData.length * 44);

  return (
    <section className={panel + " flex min-w-0 flex-col justify-between"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {hasCurrencyData && (
            <div
              role="group"
              aria-label="Pilih metrik grafik"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold"
            >
              <button
                type="button"
                onClick={() => setMetric("unit")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeMetric === "unit"
                    ? "bg-white text-[#0E33BC] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Unit
              </button>
              <button
                type="button"
                onClick={() => setMetric("value")}
                className={`rounded-lg px-2.5 py-1 transition ${
                  activeMetric === "value"
                    ? "bg-white text-[#0E33BC] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Nilai Rp
              </button>
            </div>
          )}

          {positiveCount > 5 && (
            <div
              role="group"
              aria-label="Jumlah item ditampilkan"
              className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold"
            >
              {([5, 8] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLimit(n)}
                  className={`rounded-lg px-2 py-1 transition ${
                    limit === n
                      ? "bg-white text-[#0E33BC] shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 18, left: 4, bottom: 4 }}
              barCategoryGap="24%"
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={colorStart} />
                  <stop offset="100%" stopColor={colorEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                horizontal={false}
                stroke="#E2E8F0"
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748B" }}
                tickFormatter={(v: number) =>
                  activeMetric === "value" ? fmtCompact(v) : fmtCompact(v)
                }
              />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={132}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11.5, fill: "#334155", fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(14, 51, 188, 0.05)", radius: 8 }}
                content={
                  <BarCustomTooltip
                    unit={unit}
                    isCurrency={activeMetric === "value"}
                  />
                }
              />
              <Bar
                dataKey="metricValue"
                fill={`url(#${gradientId})`}
                radius={[0, 8, 8, 0]}
                maxBarSize={26}
                animationDuration={650}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={(entry) => {
                  if (onSelect && entry?.payload) {
                    onSelect(entry.payload as ChartValue);
                  }
                }}
              >
                {chartData.map((entry, idx) => (
                  <Cell
                    key={entry.key}
                    fill={`url(#${gradientId})`}
                    fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.36}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    style={{
                      cursor: onSelect ? "pointer" : "default",
                      transition: "fill-opacity 160ms ease",
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {selectHint && onSelect && (
            <p className="mt-2 text-right text-[11px] font-medium text-slate-400">
              {selectHint}
            </p>
          )}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Interactive Brand / Share Donut Chart                                   */
/* -------------------------------------------------------------------------- */

export function ShareDonutChartCard({
  title,
  description,
  values,
  unit,
  empty,
  selectedKey,
  onSelect,
}: {
  title: string;
  description: string;
  values: ChartValue[];
  unit: string;
  empty: string;
  selectedKey?: string;
  onSelect?: (key: string) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const { slices, total } = useMemo(() => {
    const positive = values
      .filter((v) => v.value > 0)
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label, "id"));
    const sum = positive.reduce((acc, item) => acc + item.value, 0);
    const top = positive.slice(0, 5);
    const rest = positive.slice(5);
    const restSum = rest.reduce((acc, item) => acc + item.value, 0);
    const combined = [
      ...top.map((item, idx) => ({
        ...item,
        color: XL_SERIES_PALETTE[idx % XL_SERIES_PALETTE.length],
        share: sum > 0 ? (100 * item.value) / sum : 0,
        isOther: false,
      })),
      ...(restSum > 0
        ? [
            {
              key: "__other__",
              label: `Lainnya (${rest.length})`,
              value: restSum,
              color: "#94A3B8",
              share: sum > 0 ? (100 * restSum) / sum : 0,
              isOther: true,
            },
          ]
        : []),
    ];
    return { slices: combined, total: sum };
  }, [values]);

  const activeSlice =
    hoveredIdx !== null
      ? slices[hoveredIdx]
      : selectedKey
        ? slices.find((s) => s.key === selectedKey) ?? null
        : null;

  return (
    <section className={panel + " flex min-w-0 flex-col justify-between"}>
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            <PieIcon size={12} aria-hidden="true" />
            Proporsi
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      {slices.length > 0 ? (
        <div className="mt-4 grid items-center gap-5 sm:grid-cols-[200px_1fr]">
          <div className="relative mx-auto h-[200px] w-[200px]">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  animationDuration={650}
                  onMouseEnter={(_, idx) => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={(_, idx) => {
                    const target = slices[idx];
                    if (onSelect && target && !target.isOther) {
                      onSelect(selectedKey === target.key ? "" : target.key);
                    }
                  }}
                >
                  {slices.map((slice) => {
                    const highlighted =
                      activeSlice === null || activeSlice.key === slice.key;
                    return (
                      <Cell
                        key={slice.key}
                        fill={slice.color}
                        fillOpacity={highlighted ? 1 : 0.3}
                        style={{
                          cursor: onSelect && !slice.isOther ? "pointer" : "default",
                          transition: "fill-opacity 160ms ease",
                        }}
                      />
                    );
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <span className="max-w-[100px] truncate text-[11px] font-semibold text-slate-400">
                {activeSlice ? activeSlice.label : "Total"}
              </span>
              <span className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900">
                {activeSlice
                  ? `${activeSlice.share.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`
                  : fmtCompact(total)}
              </span>
              <span className="text-[11px] tabular-nums text-slate-500">
                {activeSlice
                  ? `${fmtCompact(activeSlice.value)} ${unit}`
                  : unit}
              </span>
            </div>
          </div>

          <ul className="space-y-1.5">
            {slices.map((slice, idx) => {
              const isSelected = selectedKey === slice.key;
              const isHovered = hoveredIdx === idx;
              return (
                <li key={slice.key}>
                  <button
                    type="button"
                    disabled={slice.isOther || !onSelect}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => {
                      if (onSelect && !slice.isOther) {
                        onSelect(isSelected ? "" : slice.key);
                      }
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs transition ${
                      isSelected
                        ? "bg-[#EEF3FF] ring-1 ring-[#0E33BC]/40"
                        : isHovered
                          ? "bg-slate-50"
                          : ""
                    } disabled:cursor-default`}
                  >
                    <span className="flex min-w-0 items-center gap-2 font-semibold text-slate-700">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: slice.color }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{slice.label}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                      {fmt(slice.value)}
                      <span className="ml-1 font-normal text-slate-400">
                        ({Math.round(slice.share)}%)
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">{empty}</p>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Multi-Mode Warehouse Comparison Chart                                   */
/* -------------------------------------------------------------------------- */

export interface WarehouseChartDatum {
  name: string;
  stock: number;
  shortage: number;
  products: number;
  safe: number;
  low: number;
  empty: number;
  check: number;
  attention: number;
}

type WarehouseMode = "stock" | "status" | "shortage";

interface WarehouseTooltipPayloadItem {
  payload: WarehouseChartDatum;
}

function WarehouseCustomTooltip({
  active,
  payload,
  mode,
}: {
  active?: boolean;
  payload?: WarehouseTooltipPayloadItem[];
  mode: WarehouseMode;
}) {
  if (!active || !payload?.length) return null;
  const wh = payload[0].payload;
  return (
    <div className="min-w-56 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 text-xs shadow-xl backdrop-blur-md">
      <p className="font-bold text-slate-900">{wh.name}</p>
      <p className="text-[11px] text-slate-500">{fmt(wh.products)} jenis produk unik</p>
      <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Total stok tercatat</span>
          <span className="font-bold tabular-nums text-[#0E33BC]">
            {fmt(wh.stock)} unit
          </span>
        </div>
        {mode === "shortage" && (
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Kebutuhan restok</span>
            <span className="font-bold tabular-nums text-amber-700">
              {fmt(wh.shortage)} unit
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-slate-100 pt-1.5 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Aman: <strong className="tabular-nums">{fmt(wh.safe)}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Menipis: <strong className="tabular-nums">{fmt(wh.low)}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Habis: <strong className="tabular-nums">{fmt(wh.empty)}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-violet-700">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Periksa: <strong className="tabular-nums">{fmt(wh.check)}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export function WarehouseInteractiveChart({
  title,
  description,
  warehouses,
  showShortageMode = false,
  maxItems,
  onSelectWarehouse,
}: {
  title: string;
  description: string;
  warehouses: WarehouseChartDatum[];
  showShortageMode?: boolean;
  maxItems?: number;
  onSelectWarehouse?: (name: string) => void;
}) {
  const gradBlue = useId().replace(/:/g, "");
  const gradAmber = useId().replace(/:/g, "");
  const [mode, setMode] = useState<WarehouseMode>("stock");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [visibleSeries, setVisibleSeries] = useState({
    safe: true,
    low: true,
    empty: true,
    check: true,
  });

  const displayed = useMemo(() => {
    const list = [...warehouses];
    if (mode === "shortage") {
      list.sort((a, b) => b.shortage - a.shortage || a.name.localeCompare(b.name));
    } else if (mode === "status") {
      list.sort((a, b) => b.attention - a.attention || b.stock - a.stock);
    }
    return maxItems ? list.slice(0, maxItems) : list;
  }, [warehouses, mode, maxItems]);

  const avgStock = useMemo(() => {
    if (!displayed.length) return 0;
    return Math.round(
      displayed.reduce((sum, w) => sum + w.stock, 0) / displayed.length,
    );
  }, [displayed]);

  const useVerticalLayout = displayed.length > 7;
  const chartHeight = useVerticalLayout
    ? Math.max(300, displayed.length * 42)
    : 300;

  return (
    <section className={panel}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div
          role="group"
          aria-label="Mode tampilan grafik gudang"
          className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold"
        >
          <button
            type="button"
            onClick={() => setMode("stock")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              mode === "stock"
                ? "bg-white text-[#0E33BC] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={13} aria-hidden="true" />
            Total Stok
          </button>
          <button
            type="button"
            onClick={() => setMode("status")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
              mode === "status"
                ? "bg-white text-[#0E33BC] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers size={13} aria-hidden="true" />
            Komposisi Status
          </button>
          {showShortageMode && (
            <button
              type="button"
              onClick={() => setMode("shortage")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                mode === "shortage"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <TrendingDown size={13} aria-hidden="true" />
              Kebutuhan Restok
            </button>
          )}
        </div>
      </div>

      {/* Interactive Series Filter Pills when in Status Mode */}
      {mode === "status" && displayed.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(
            [
              { key: "safe", label: "Aman", color: "#059669" },
              { key: "low", label: "Menipis / Kritis", color: "#D97706" },
              { key: "empty", label: "Habis", color: "#E11D48" },
              { key: "check", label: "Periksa", color: "#7C3AED" },
            ] as const
          ).map((item) => {
            const active = visibleSeries[item.key];
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setVisibleSeries((prev) => ({
                    ...prev,
                    [item.key]: !prev[item.key],
                  }))
                }
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  active
                    ? "border-slate-200 bg-white text-slate-700 shadow-2xs"
                    : "border-transparent bg-slate-100 text-slate-400 line-through"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: item.color,
                    opacity: active ? 1 : 0.35,
                  }}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {displayed.length > 0 ? (
        <div className={`mt-5 ${useVerticalLayout ? "max-h-[460px] overflow-y-auto pr-1" : ""}`}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={displayed}
              layout={useVerticalLayout ? "vertical" : "horizontal"}
              margin={
                useVerticalLayout
                  ? { top: 8, right: 24, left: 6, bottom: 8 }
                  : { top: 14, right: 16, left: 4, bottom: 12 }
              }
              barCategoryGap="24%"
            >
              <defs>
                <linearGradient
                  id={gradBlue}
                  x1="0"
                  y1={useVerticalLayout ? "0" : "1"}
                  x2={useVerticalLayout ? "1" : "0"}
                  y2="0"
                >
                  <stop offset="0%" stopColor="#0E33BC" />
                  <stop offset="100%" stopColor="#09A9A7" />
                </linearGradient>
                <linearGradient
                  id={gradAmber}
                  x1="0"
                  y1={useVerticalLayout ? "0" : "1"}
                  x2={useVerticalLayout ? "1" : "0"}
                  y2="0"
                >
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="100%" stopColor="#F59E0B" />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 4"
                vertical={useVerticalLayout}
                horizontal={!useVerticalLayout}
                stroke="#E2E8F0"
              />

              {useVerticalLayout ? (
                <>
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v: number) => fmtCompact(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={126}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11.5, fill: "#334155", fontWeight: 500 }}
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11.5, fill: "#334155", fontWeight: 500 }}
                    tickFormatter={(v: string) => truncateLabel(v, 13)}
                  />
                  <YAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    tickFormatter={(v: number) => fmtCompact(v)}
                  />
                </>
              )}

              <Tooltip
                cursor={{ fill: "rgba(14, 51, 188, 0.05)", radius: 8 }}
                content={<WarehouseCustomTooltip mode={mode} />}
              />

              {mode === "stock" && avgStock > 0 && (
                <ReferenceLine
                  {...(useVerticalLayout ? { x: avgStock } : { y: avgStock })}
                  stroke="#09A9A7"
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata ${fmtCompact(avgStock)}`,
                    position: useVerticalLayout ? "insideTopRight" : "insideTopRight",
                    fill: "#0F766E",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
              )}

              {mode === "stock" && (
                <Bar
                  dataKey="stock"
                  name="Total stok"
                  fill={`url(#${gradBlue})`}
                  radius={useVerticalLayout ? [0, 8, 8, 0] : [8, 8, 0, 0]}
                  maxBarSize={40}
                  animationDuration={650}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={(entry) => {
                    if (onSelectWarehouse && entry?.payload) {
                      onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                    }
                  }}
                >
                  {displayed.map((w, idx) => (
                    <Cell
                      key={w.name}
                      fill={`url(#${gradBlue})`}
                      fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.38}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      style={{
                        cursor: onSelectWarehouse ? "pointer" : "default",
                        transition: "fill-opacity 160ms ease",
                      }}
                    />
                  ))}
                </Bar>
              )}

              {mode === "shortage" && (
                <Bar
                  dataKey="shortage"
                  name="Kebutuhan restok"
                  fill={`url(#${gradAmber})`}
                  radius={useVerticalLayout ? [0, 8, 8, 0] : [8, 8, 0, 0]}
                  maxBarSize={40}
                  animationDuration={650}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={(entry) => {
                    if (onSelectWarehouse && entry?.payload) {
                      onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                    }
                  }}
                >
                  {displayed.map((w, idx) => (
                    <Cell
                      key={w.name}
                      fill={`url(#${gradAmber})`}
                      fillOpacity={hoveredIdx === null || hoveredIdx === idx ? 1 : 0.38}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      style={{
                        cursor: onSelectWarehouse ? "pointer" : "default",
                        transition: "fill-opacity 160ms ease",
                      }}
                    />
                  ))}
                </Bar>
              )}

              {mode === "status" && (
                <>
                  {visibleSeries.safe && (
                    <Bar
                      dataKey="safe"
                      stackId="status"
                      name="Aman"
                      fill="#059669"
                      maxBarSize={40}
                      animationDuration={550}
                      onClick={(entry) => {
                        if (onSelectWarehouse && entry?.payload) {
                          onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                        }
                      }}
                      style={{ cursor: onSelectWarehouse ? "pointer" : "default" }}
                    />
                  )}
                  {visibleSeries.low && (
                    <Bar
                      dataKey="low"
                      stackId="status"
                      name="Menipis / Kritis"
                      fill="#D97706"
                      maxBarSize={40}
                      animationDuration={550}
                      onClick={(entry) => {
                        if (onSelectWarehouse && entry?.payload) {
                          onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                        }
                      }}
                      style={{ cursor: onSelectWarehouse ? "pointer" : "default" }}
                    />
                  )}
                  {visibleSeries.empty && (
                    <Bar
                      dataKey="empty"
                      stackId="status"
                      name="Habis"
                      fill="#E11D48"
                      maxBarSize={40}
                      animationDuration={550}
                      onClick={(entry) => {
                        if (onSelectWarehouse && entry?.payload) {
                          onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                        }
                      }}
                      style={{ cursor: onSelectWarehouse ? "pointer" : "default" }}
                    />
                  )}
                  {visibleSeries.check && (
                    <Bar
                      dataKey="check"
                      stackId="status"
                      name="Periksa"
                      fill="#7C3AED"
                      radius={useVerticalLayout ? [0, 6, 6, 0] : [6, 6, 0, 0]}
                      maxBarSize={40}
                      animationDuration={550}
                      onClick={(entry) => {
                        if (onSelectWarehouse && entry?.payload) {
                          onSelectWarehouse((entry.payload as WarehouseChartDatum).name);
                        }
                      }}
                      style={{ cursor: onSelectWarehouse ? "pointer" : "default" }}
                    />
                  )}
                </>
              )}
            </BarChart>
          </ResponsiveContainer>

          {onSelectWarehouse && (
            <p className="mt-2 text-right text-[11px] font-medium text-slate-400">
              Klik batang gudang untuk langsung membuka rincian produknya
            </p>
          )}
        </div>
      ) : (
        <p className="py-10 text-center text-sm text-slate-500">
          Tidak ada gudang sesuai filter.
        </p>
      )}
    </section>
  );
}
