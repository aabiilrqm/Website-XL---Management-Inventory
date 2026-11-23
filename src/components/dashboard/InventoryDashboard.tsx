"use client";

import { Suspense } from "react";
import { Calendar, FileClock, RefreshCw, Sparkles, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { useData } from "@/context/DataContext";
import InventoryOverview from "./InventoryOverview";
import ProductStock from "./ProductStock";
import WarehouseSummary from "./WarehouseSummary";
import { fieldClass, panel } from "./inventory-ui";

const pageInfo = {
  overview: {
    title: "Dashboard Persediaan",
    description: "Ringkasan interaktif kondisi stok dan distribusi seluruh gudang XL.",
    badge: "Ikhtisar Eksekutif",
  },
  stock: {
    title: "Stok Produk",
    description: "Eksplorasi rincian stok, ambang minimum, valuasi, dan ekspor data produk.",
    badge: "Katalog & Inventaris",
  },
  warehouse: {
    title: "Performa Gudang",
    description: "Bandingkan kapasitas stok, rasio kesehatan, dan kebutuhan restok tiap lokasi.",
    badge: "Distribusi Lokasi",
  },
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Memuat laporan persediaan">
      <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="inventory-panel space-y-3">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-8 w-32" />
            <div className="skeleton h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
        <div className="inventory-panel h-80 space-y-4">
          <div className="skeleton h-5 w-44" />
          <div className="skeleton h-56 w-full" />
        </div>
        <div className="inventory-panel h-80 space-y-4">
          <div className="skeleton h-5 w-48" />
          <div className="skeleton h-56 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function InventoryDashboard({
  view = "overview",
}: {
  view?: keyof typeof pageInfo;
}) {
  const { data, loading, error, refresh, reports = [], selected, selectReport } = useData();
  const info = pageInfo[view];
  const month = reports.find((report) => report.id === selected)?.month;
  const months = [...new Set(reports.map((report) => report.month))];
  const versions = reports.filter((report) => report.month === month);

  return (
    <div className="space-y-6">
      {/* Page Hero Header & Report Selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-semibold text-[#0E33BC]">
              <Sparkles size={12} aria-hidden="true" />
              {info.badge}
            </span>
            {data && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-[#09A9A7]" aria-hidden="true" />
                Periode {data.reportMonth}
              </span>
            )}
          </div>
          <h1 className="font-extrabold text-slate-900">{info.title}</h1>
          <p className="text-sm text-slate-500">{info.description}</p>
        </div>

        {months.length > 0 && (
          <div className="flex flex-wrap items-end gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 shadow-sm backdrop-blur-sm">
            <label className="grid gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={12} aria-hidden="true" className="text-[#0E33BC]" />
                Bulan Laporan
              </span>
              <select
                className={fieldClass + " h-9 py-1 text-xs font-medium"}
                value={month ?? ""}
                onChange={(event) => {
                  const latest = reports.find((report) => report.month === event.target.value);
                  if (latest) void selectReport(latest.id);
                }}
              >
                {months.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>

            <label className="grid min-w-44 flex-1 gap-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FileClock size={12} aria-hidden="true" className="text-[#09A9A7]" />
                Versi Unggahan
              </span>
              <select
                className={fieldClass + " h-9 max-w-full py-1 text-xs font-medium"}
                value={selected}
                onChange={(event) => void selectReport(event.target.value)}
              >
                {versions.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.file} · {new Date(report.uploaded).toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </label>

            {loading && (
              <span
                role="status"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#EEF3FF] px-3 text-xs font-semibold text-[#0E33BC]"
              >
                <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
                Memuat…
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className={
            panel +
            " flex flex-wrap items-center justify-between gap-4 border-rose-200 bg-rose-50/70"
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle size={19} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-900">Gagal memuat data laporan</p>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      )}

      {/* Main Content */}
      {loading && !data ? (
        <LoadingSkeleton />
      ) : !data || data.schemaVersion !== 2 ? (
        <div className={panel + " flex flex-col items-center py-14 text-center"}>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#0E33BC]">
            <FileSpreadsheet size={28} aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Belum ada laporan yang dapat ditampilkan
          </h2>
          <p className="mt-1.5 max-w-md text-sm text-slate-500">
            {data
              ? "Unggah ulang laporan Excel untuk memperbarui ke format data terbaru."
              : "Klik tombol Upload Excel di bagian atas untuk mengimpor laporan stok dan mulai menjelajahi grafik interaktif."}
          </p>
        </div>
      ) : (
        <Suspense fallback={<LoadingSkeleton />}>
          {view === "overview" ? (
            <InventoryOverview data={data} />
          ) : view === "stock" ? (
            <ProductStock key={data.lastUpdated} data={data} />
          ) : (
            <WarehouseSummary key={data.lastUpdated} data={data} />
          )}
        </Suspense>
      )}
    </div>
  );
}
