"use client";

import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Package,
  PackageX,
  RotateCcw,
  Search,
  Wallet,
  X,
} from "lucide-react";
import type { ParsedData, StockItem, StockStatus } from "@/lib/excel-parser";
import { stockStatus } from "@/lib/stock-status";
import {
  fieldClass,
  fmt,
  panel,
  productKey,
  STATUS_META,
  stockBalances,
  StatCards,
  StatusBadge,
} from "./inventory-ui";
import { InteractiveBarChartCard, ShareDonutChartCard } from "./InventoryCharts";

type SortKey = "product" | "stock" | "minStock" | "price" | "status";

const ALL_STATUSES: StockStatus[] = [
  "Aman",
  "Menipis",
  "Kritis",
  "Habis",
  "Periksa",
  "Belum dinilai",
];

const STATUS_SEVERITY: Record<StockStatus, number> = {
  Habis: 0,
  Kritis: 1,
  Menipis: 2,
  Periksa: 3,
  "Belum dinilai": 4,
  Aman: 5,
};

export default function ProductStock({ data }: { data: ParsedData }) {
  const params = useSearchParams();
  const [warehouse, setWarehouse] = useState(params.get("gudang") ?? "");
  const [brand, setBrand] = useState(params.get("merek") ?? "");
  const [category, setCategory] = useState(params.get("kategori") ?? "");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [sortKey, setSortKey] = useState<SortKey>("stock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);
  const [exportError, setExportError] = useState("");
  const [detailItem, setDetailItem] = useState<StockItem | null>(null);
  const detailDialogRef = useRef<HTMLDialogElement>(null);

  const all = data.stockItems;

  const { warehouses, brands, categories } = useMemo(() => {
    const wh = [...new Set(all.map((row) => row.warehouse))].sort();
    const br = [...new Set(all.map((row) => row.brand).filter(Boolean))].sort();
    const cat = [...new Set(all.map((row) => row.category || "Tanpa kategori"))].sort();
    return { warehouses: wh, brands: br, categories: cat };
  }, [all]);

  // Base filtered rows (excluding status so status chips show accurate live counts)
  const baseRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((row) => {
      if (warehouse && row.warehouse !== warehouse) return false;
      if (brand && (row.brand || "Tanpa merek") !== brand) return false;
      if (category && (row.category || "Tanpa kategori") !== category) return false;
      if (q && !`${row.product} ${row.sku} ${row.brand} ${row.category}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [all, warehouse, brand, category, search]);

  const statusCounts = useMemo(() => {
    const map = new Map<StockStatus, number>();
    for (const row of baseRows) {
      const s = stockStatus(row.stock, row.minStock);
      map.set(s, (map.get(s) ?? 0) + 1);
    }
    return map;
  }, [baseRows]);

  const rows = useMemo(() => {
    const filtered = status
      ? baseRows.filter((row) => stockStatus(row.stock, row.minStock) === status)
      : baseRows;

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "product":
          return a.product.localeCompare(b.product, "id") * dir;
        case "stock":
          return ((a.stock ?? -Infinity) - (b.stock ?? -Infinity)) * dir;
        case "minStock":
          return ((a.minStock ?? -Infinity) - (b.minStock ?? -Infinity)) * dir;
        case "price":
          return ((a.price ?? -Infinity) - (b.price ?? -Infinity)) * dir;
        case "status":
          return (
            (STATUS_SEVERITY[stockStatus(a.stock, a.minStock)] -
              STATUS_SEVERITY[stockStatus(b.stock, b.minStock)]) *
            dir
          );
      }
    });
  }, [baseRows, status, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / 50));
  const currentPage = Math.min(page, pageCount - 1);
  const hasActiveFilters = Boolean(warehouse || brand || category || search.trim() || status);

  const { uniqueCount, emptyCount, lowCritCount, totalValue, missingPrices } = useMemo(() => {
    const keys = new Set<string>();
    let empty = 0;
    let lowCrit = 0;
    let value = 0;
    let missing = 0;
    for (const row of rows) {
      keys.add(productKey(row));
      if (row.stock === 0) empty++;
      if (["Menipis", "Kritis"].includes(stockStatus(row.stock, row.minStock))) lowCrit++;
      if (row.stock !== null && row.price !== null) value += row.stock * row.price;
      else missing++;
    }
    return {
      uniqueCount: keys.size,
      emptyCount: empty,
      lowCritCount: lowCrit,
      totalValue: value,
      missingPrices: missing,
    };
  }, [rows]);

  const productChartValues = useMemo(
    () =>
      stockBalances(
        rows,
        productKey,
        (row) => [row.product, row.sku].filter(Boolean).join(" · "),
      ),
    [rows],
  );

  const brandChartValues = useMemo(
    () =>
      stockBalances(
        baseRows,
        (row) => row.brand || "Tanpa merek",
        (row) => row.brand || "Tanpa merek",
      ),
    [baseRows],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "product" ? "asc" : "desc");
    }
    setPage(0);
  }

  function resetFilters() {
    setWarehouse("");
    setBrand("");
    setCategory("");
    setSearch("");
    setStatus("");
    setPage(0);
  }

  function openDetail(item: StockItem) {
    setDetailItem(item);
    detailDialogRef.current?.showModal();
  }

  async function exportRows() {
    setExportError("");
    try {
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.json_to_sheet(
        rows.map((row) => ({
          SKU: row.sku,
          Produk: row.product,
          Merek: row.brand,
          Kategori: row.category,
          Gudang: row.warehouse,
          Stok: row.stock,
          "Minimum Stok": row.minStock,
          "Harga Satuan": row.price,
          Status: stockStatus(row.stock, row.minStock),
          Sheet: row.sources[0]?.sheet,
          Baris: row.sources[0]?.row,
          Kolom: row.sources[0]?.column,
        })),
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Stok produk");
      XLSX.writeFile(workbook, "stok-produk.xlsx");
    } catch {
      setExportError("Ekspor gagal. Silakan coba lagi.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Interactive Search & Filter Bar */}
      <search aria-label="Filter stok produk" className={panel + " space-y-4"}>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-56 flex-1">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              aria-label="Cari nama atau kode produk"
              placeholder="Cari nama produk, SKU, merek, atau kategori…"
              className={fieldClass + " w-full pl-9 pr-9"}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(0);
              }}
            />
            {search && (
              <button
                type="button"
                aria-label="Hapus pencarian"
                onClick={() => {
                  setSearch("");
                  setPage(0);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <select
            aria-label="Filter gudang"
            className={fieldClass}
            value={warehouse}
            onChange={(event) => {
              setWarehouse(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Semua gudang</option>
            {!warehouses.includes(warehouse) && warehouse && (
              <option value={warehouse}>{warehouse} (tidak tersedia)</option>
            )}
            {warehouses.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <select
            aria-label="Filter kategori"
            className={fieldClass}
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Semua kategori</option>
            {categories.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <select
            aria-label="Filter merek"
            className={fieldClass}
            value={brand}
            onChange={(event) => {
              setBrand(event.target.value);
              setPage(0);
            }}
          >
            <option value="">Semua merek</option>
            {brands.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset
            </button>
          )}
        </div>

        {/* One-Click Interactive Status Filter Pills */}
        <div
          role="group"
          aria-label="Filter cepat berdasarkan status stok"
          className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3"
        >
          <button
            type="button"
            aria-pressed={status === ""}
            onClick={() => {
              setStatus("");
              setPage(0);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              status === ""
                ? "bg-[#0E33BC] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
            }`}
          >
            Semua
            <span className="tabular-nums opacity-80">{fmt(baseRows.length)}</span>
          </button>

          {ALL_STATUSES.map((s) => {
            const count = statusCounts.get(s) ?? 0;
            const active = status === s;
            const meta = STATUS_META[s];
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setStatus(active ? "" : s);
                  setPage(0);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : `${meta.bg} ${meta.text} hover:brightness-95`
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : meta.dot}`}
                  aria-hidden="true"
                />
                {s}
                <span className="tabular-nums opacity-75">{fmt(count)}</span>
              </button>
            );
          })}
        </div>
      </search>

      {/* KPI Summary Cards */}
      <StatCards
        items={[
          {
            title: "Produk Sesuai Filter",
            value: fmt(uniqueCount),
            description: `${fmt(rows.length)} catatan produk per gudang`,
            icon: <Package size={19} />,
          },
          {
            title: "Stok Habis",
            value: fmt(emptyCount),
            description: "Catatan produk dengan stok tepat nol",
            icon: <PackageX size={19} />,
            accent: emptyCount > 0 ? "rose" : "teal",
          },
          {
            title: "Menipis / Kritis",
            value: fmt(lowCritCount),
            description: "Catatan di bawah ambang minimum stok",
            icon: <AlertCircle size={19} />,
            accent: lowCritCount > 0 ? "amber" : "teal",
          },
          {
            title: "Nilai Stok Tercatat",
            value: "Rp " + fmt(totalValue),
            description: missingPrices
              ? `${fmt(missingPrices)} catatan belum memiliki stok/harga lengkap`
              : "Total valuasi stok × harga satuan sesuai filter",
            icon: <Wallet size={19} />,
            accent: "teal",
          },
        ]}
      />

      {/* Interactive Analytics Charts Row */}
      <div className="grid gap-5 xl:grid-cols-2">
        <InteractiveBarChartCard
          title="Produk dengan Stok Terbesar"
          description="Peringkat produk dengan saldo positif tertinggi sesuai filter aktif."
          values={productChartValues}
          unit="unit"
          colorStart="#0E33BC"
          colorEnd="#3B82F6"
          enableValueToggle
          empty="Tidak ada produk dengan saldo positif sesuai filter."
          selectHint="Klik batang produk untuk memfilter di tabel"
          onSelect={(item) => {
            const nameOnly = item.label.split(" · ")[0] ?? item.label;
            setSearch(nameOnly);
            setPage(0);
          }}
        />
        <ShareDonutChartCard
          title="Komposisi Stok menurut Merek"
          description="Proporsi saldo positif per merek. Klik potongan grafik atau legenda untuk memfilter."
          values={brandChartValues}
          unit="unit"
          empty="Tidak ada merek dengan saldo positif sesuai filter."
          selectedKey={brand}
          onSelect={(nextBrand) => {
            setBrand(nextBrand);
            setPage(0);
          }}
        />
      </div>

      {/* Product Stock Table */}
      <section className={panel + " data-panel-contain"}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Rincian Stok Produk
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Klik judul kolom untuk mengurutkan atau klik baris untuk melihat detail sumber data.
            </p>
          </div>
          <button
            type="button"
            disabled={!rows.length}
            onClick={() => void exportRows()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#0E33BC]/25 bg-[#EEF3FF] px-4 py-2 text-xs font-semibold text-[#0E33BC] transition hover:bg-[#0E33BC] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download size={14} aria-hidden="true" />
            Ekspor Excel ({fmt(rows.length)})
          </button>
        </div>

        {exportError && (
          <p role="alert" className="mb-3 text-sm text-rose-700">
            {exportError}
          </p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="whitespace-nowrap border-b border-slate-200 px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("product")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Produk / SKU
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  Merek
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  Kategori
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  Gudang
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("stock")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Stok
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("minStock")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Minimum
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("price")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Harga Satuan
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="whitespace-nowrap border-b border-slate-200 px-3 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 hover:text-[#0E33BC]"
                  >
                    Status
                    <ArrowUpDown size={12} aria-hidden="true" />
                  </button>
                </th>
                <th className="border-b border-slate-200 px-3 py-3 text-right font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(currentPage * 50, currentPage * 50 + 50).map((row) => {
                const st = stockStatus(row.stock, row.minStock);
                const ratio =
                  row.stock !== null && row.minStock && row.minStock > 0
                    ? Math.min(100, Math.max(0, (100 * row.stock) / row.minStock))
                    : null;
                return (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 text-slate-700 last:border-b-0"
                  >
                    <td className="min-w-52 px-4 py-3">
                      <p className="font-semibold text-slate-900">{row.product}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {row.sku || "SKU tidak tersedia"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs font-medium">{row.brand || "—"}</td>
                    <td className="px-3 py-3 text-xs">{row.category || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-slate-700">
                      {row.warehouse}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="font-bold tabular-nums text-slate-900">
                        {fmt(row.stock)}
                      </span>
                      {ratio !== null && (
                        <div
                          aria-hidden="true"
                          className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-slate-100"
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${ratio}%`,
                              backgroundColor: STATUS_META[st].color,
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-500">
                      {row.minStock === null ? "Belum tersedia" : fmt(row.minStock)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs font-medium tabular-nums">
                      {row.price === null ? "Belum tersedia" : "Rp " + fmt(row.price)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge item={row} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(row)}
                        aria-label={`Lihat detail ${row.product}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-[#EEF3FF] hover:text-[#0E33BC]"
                      >
                        <Eye size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!rows.length && (
          <p className="py-10 text-center text-sm text-slate-500">
            Tidak ada stok produk yang cocok dengan filter saat ini.
          </p>
        )}

        {/* Pagination */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span className="tabular-nums">
            Menampilkan <strong>{fmt(rows.length)}</strong> catatan · Halaman{" "}
            <strong>{currentPage + 1}</strong> dari <strong>{pageCount}</strong>
          </span>
          <nav
            aria-label="Navigasi halaman stok produk"
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              className={
                fieldClass +
                " inline-flex items-center gap-1 py-1.5 text-xs font-semibold disabled:opacity-40"
              }
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronLeft size={14} aria-hidden="true" />
              Sebelumnya
            </button>
            {pageCount > 1 && (
              <label className="flex items-center gap-1.5">
                <span className="sr-only">Pilih halaman</span>
                <select
                  className={fieldClass + " py-1.5 text-xs"}
                  value={currentPage + 1}
                  onChange={(event) => setPage(Number(event.target.value) - 1)}
                >
                  {Array.from({ length: pageCount }, (_, index) => (
                    <option key={index} value={index + 1}>
                      Hal. {index + 1}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              type="button"
              className={
                fieldClass +
                " inline-flex items-center gap-1 py-1.5 text-xs font-semibold disabled:opacity-40"
              }
              disabled={currentPage + 1 >= pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              Berikutnya
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </section>

      {/* Data Quality Accordion */}
      <details className={panel}>
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Kualitas & Sumber Data ·{" "}
          <span className="font-mono text-xs text-[#0E33BC]">
            {data.preprocessing.issueCount} temuan
          </span>
        </summary>
        <div className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <p className="break-all">
            <strong className="text-slate-800">File:</strong>{" "}
            {data.preprocessing.fileName}
          </p>
          <p>
            <strong className="text-slate-800">Sheet stok:</strong>{" "}
            {data.preprocessing.stockSource.sheet}, header baris{" "}
            {data.preprocessing.stockSource.headerRow}.
          </p>
          <p className="rounded-xl bg-slate-50 p-3 font-medium text-slate-700">
            {data.preprocessing.missingValues} stok kosong ·{" "}
            {data.preprocessing.invalidValues} stok tidak valid ·{" "}
            {data.preprocessing.negativeStocks} stok negatif ·{" "}
            {data.preprocessing.duplicateRows} baris duplikat diabaikan ·{" "}
            {data.preprocessing.totalMismatches} selisih total.
          </p>
          {data.preprocessing.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
          <p>
            Sheet tidak diimpor:{" "}
            {data.preprocessing.ignoredSheets.join(", ") || "Tidak ada"}.
          </p>
          <div className="max-h-64 overflow-auto rounded-xl border border-slate-100 px-3">
            {data.preprocessing.issues.map((issue, index) => (
              <p
                key={index}
                className="border-b border-slate-100 py-2 last:border-b-0"
              >
                <strong className="text-slate-800">
                  {issue.sheet} · baris {issue.row}:
                </strong>{" "}
                {issue.message}
              </p>
            ))}
          </div>
          {data.preprocessing.issueCount > 100 && (
            <p className="text-slate-400">
              Menampilkan 100 temuan pertama dari {data.preprocessing.issueCount}.
            </p>
          )}
        </div>
      </details>

      {/* Product Detail Modal */}
      <dialog
        ref={detailDialogRef}
        aria-label="Detail produk stok"
        className="modern-dialog w-[min(520px,92vw)] rounded-3xl p-6"
      >
        {detailItem && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <StatusBadge item={detailItem} />
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {detailItem.product}
                </h3>
                <p className="font-mono text-xs text-slate-400">
                  {detailItem.sku || "SKU tidak tersedia"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup detail produk"
                onClick={() => detailDialogRef.current?.close()}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Stok Tercatat
                </dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-[#0E33BC]">
                  {fmt(detailItem.stock)}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3.5">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Minimum Stok
                </dt>
                <dd className="mt-1 text-xl font-extrabold tabular-nums text-slate-800">
                  {detailItem.minStock === null ? "—" : fmt(detailItem.minStock)}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3">
                <dt className="text-[11px] text-slate-400">Gudang</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {detailItem.warehouse}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3">
                <dt className="text-[11px] text-slate-400">Merek & Kategori</dt>
                <dd className="mt-0.5 font-semibold text-slate-800">
                  {[detailItem.brand, detailItem.category].filter(Boolean).join(" · ") || "—"}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3">
                <dt className="text-[11px] text-slate-400">Harga Satuan</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-slate-800">
                  {detailItem.price === null ? "Belum tersedia" : "Rp " + fmt(detailItem.price)}
                </dd>
              </div>
              <div className="rounded-2xl border border-slate-100 p-3">
                <dt className="text-[11px] text-slate-400">Estimasi Nilai</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-emerald-700">
                  {detailItem.stock !== null && detailItem.price !== null
                    ? "Rp " + fmt(detailItem.stock * detailItem.price)
                    : "Belum tersedia"}
                </dd>
              </div>
            </dl>

            {detailItem.sources[0] && (
              <p className="rounded-xl bg-[#EEF3FF]/60 px-3.5 py-2.5 text-xs text-slate-600">
                Sumber Excel:{" "}
                <strong className="font-mono text-[#0E33BC]">
                  {detailItem.sources[0].sheet} · Baris {detailItem.sources[0].row} · Kolom{" "}
                  {detailItem.sources[0].column}
                </strong>
              </p>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
