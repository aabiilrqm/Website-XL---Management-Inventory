"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { useData } from "@/context/DataContext";
import type {
  ColumnOption,
  Field,
  ImportInspection,
  ImportMapping,
  ImportOptions,
  ParsedData,
} from "@/lib/excel-parser";

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition hover:border-slate-300 focus:border-[#0E33BC] focus:outline-none";

const empty = (sheet: string, row = 1): ImportMapping => ({
  sheet,
  headerRow: row,
  layout: "long",
  columns: {},
  warehouseColumns: [],
});

function MappingEditor({
  inspection,
  mapping,
  onChange,
}: {
  inspection: ImportInspection;
  mapping: ImportMapping;
  onChange: (m: ImportMapping) => void;
}) {
  const sheet = inspection.sheets.find((s) => s.name === mapping.sheet);
  const columns: ColumnOption[] =
    sheet?.headers.find((h) => h.row === mapping.headerRow)?.columns ?? [];
  const fields: [Field, string][] = [
    ["product", "Produk *"],
    ["sku", "Kode produk"],
    ["brand", "Merek"],
    ["category", "Kategori"],
    ["price", "Harga satuan"],
    ["minimum", "Minimum stok"],
    ["total", "Total pembanding"],
    ...(mapping.layout === "long"
      ? ([
          ["warehouse", "Gudang *"],
          ["quantity", "Stok akhir *"],
        ] as [Field, string][])
      : []),
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">
          Sheet
          <select
            aria-label="Sheet stok"
            className={inputClass}
            value={mapping.sheet}
            onChange={(e) => {
              const next = inspection.sheets.find((s) => s.name === e.target.value)!;
              onChange(next.stock ?? empty(next.name, next.headers[0]?.row ?? 1));
            }}
          >
            {inspection.sheets.map((s) => (
              <option key={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Baris header
          <select
            className={inputClass}
            value={mapping.headerRow}
            onChange={(e) => onChange(empty(mapping.sheet, Number(e.target.value)))}
          >
            {sheet?.headers.map((h) => (
              <option key={h.row} value={h.row}>
                Baris {h.row}: {h.columns.slice(0, 2).map((c) => c.label).join(" / ")}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          Bentuk tabel
          <select
            className={inputClass}
            value={mapping.layout}
            onChange={(e) =>
              onChange({
                ...mapping,
                layout: e.target.value as ImportMapping["layout"],
                warehouseColumns: [],
              })
            }
          >
            <option value="long">Satu baris per produk/gudang</option>
            <option value="matrix">Gudang sebagai kolom</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {fields.map(([field, label]) => (
          <label className="text-xs font-semibold text-slate-600" key={field}>
            {label}
            <select
              className={inputClass}
              value={mapping.columns[field] ?? ""}
              onChange={(e) => {
                const next = { ...mapping.columns };
                if (e.target.value) next[field] = e.target.value;
                else delete next[field];
                onChange({ ...mapping, columns: next });
              }}
            >
              <option value="">Tidak tersedia</option>
              {columns.map((c) => (
                <option key={c.column} value={c.column}>
                  {c.column} · {c.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      {mapping.layout === "matrix" && (
        <div className="border-t border-slate-200 pt-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">
            Kolom stok gudang (jangan pilih kolom total)
          </p>
          <div className="grid max-h-52 gap-2 overflow-auto pr-1 sm:grid-cols-2">
            {columns
              .filter((c) => !Object.values(mapping.columns).includes(c.column))
              .map((c) => {
                const selected = mapping.warehouseColumns.find(
                  (w) => w.column === c.column,
                );
                return (
                  <div
                    key={c.column}
                    className={`rounded-xl border p-2.5 text-sm transition ${
                      selected
                        ? "border-[#0E33BC]/30 bg-blue-50/40"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        className="h-4 w-4 rounded accent-[#0E33BC]"
                        onChange={(e) =>
                          onChange({
                            ...mapping,
                            warehouseColumns: e.target.checked
                              ? [
                                  ...mapping.warehouseColumns,
                                  { column: c.column, warehouse: c.label },
                                ]
                              : mapping.warehouseColumns.filter(
                                  (w) => w.column !== c.column,
                                ),
                          })
                        }
                      />
                      <span className="truncate">
                        {c.column} · {c.label}
                      </span>
                    </label>
                    {selected && (
                      <div className="mt-2 space-y-1.5">
                        <input
                          aria-label={"Nama gudang " + c.column}
                          className={inputClass}
                          value={selected.warehouse}
                          onChange={(e) =>
                            onChange({
                              ...mapping,
                              warehouseColumns: mapping.warehouseColumns.map((w) =>
                                w.column === c.column
                                  ? { ...w, warehouse: e.target.value }
                                  : w,
                              ),
                            })
                          }
                        />
                        <select
                          aria-label={"Kolom minimum " + selected.warehouse}
                          className={inputClass}
                          value={selected.minimumColumn ?? ""}
                          onChange={(e) =>
                            onChange({
                              ...mapping,
                              warehouseColumns: mapping.warehouseColumns.map((w) =>
                                w.column === c.column
                                  ? {
                                      ...w,
                                      minimumColumn: e.target.value || undefined,
                                    }
                                  : w,
                              ),
                            })
                          }
                        >
                          <option value="">Minimum umum / tidak tersedia</option>
                          {columns
                            .filter(
                              (col) =>
                                !mapping.warehouseColumns.some(
                                  (w) => w.column === col.column,
                                ),
                            )
                            .map((col) => (
                              <option value={col.column} key={col.column}>
                                {col.column} · {col.label}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UploadButton() {
  const { data, uploadFile, uploadState } = useData();
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<ImportInspection | null>(null);
  const [stock, setStock] = useState<ImportMapping | null>(null);
  const [period, setPeriod] = useState("");
  const [preview, setPreview] = useState<ParsedData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function request(file: File, action: string, mapping?: ImportOptions) {
    const form = new FormData();
    form.append("file", file);
    form.append("action", action);
    if (mapping) form.append("mapping", JSON.stringify(mapping));
    const res = await authenticatedFetch("/api/upload", {
      method: "POST",
      body: form,
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? "File gagal diproses.");
    }
    return json;
  }

  async function selectFile(file: File) {
    setPeriod("");
    setFile(file);
    setInspection(null);
    setPreview(null);
    setError("");
    setBusy(true);
    dialog.current?.showModal();
    try {
      const json = await request(file, "inspect");
      const result = json.inspection as ImportInspection;
      setInspection(result);
      setStock(result.suggestedStock ?? empty(result.sheets[0]?.name ?? ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membaca file.");
    } finally {
      setBusy(false);
    }
  }

  const updateStock = (m: ImportMapping) => {
    setStock(m);
    setPreview(null);
  };

  async function processPreview() {
    if (!file || !stock) return;
    setError("");
    setBusy(true);
    try {
      const json = await request(file, "preview", { stock, movement: null });
      setPreview(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pratinjau gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!file || !stock || !preview) return;
    setBusy(true);
    setError("");
    const ok = await uploadFile(file, { stock, movement: null }, period);
    setBusy(false);
    if (ok) dialog.current?.close();
    else {
      setError(
        "Impor gagal. Data sebelumnya tetap tersedia; coba pratinjau kembali.",
      );
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#0E33BC] px-4 text-sm font-semibold text-white shadow-sm shadow-[#0E33BC]/25 transition hover:-translate-y-0.5 hover:bg-[#0A2796] hover:shadow-md hover:shadow-[#0E33BC]/30 active:translate-y-0"
      >
        <Upload size={15} aria-hidden="true" />
        <span className="hidden sm:inline">
          {data ? "Tambah laporan" : "Upload Excel"}
        </span>
        <span className="sm:hidden">Upload</span>
      </button>

      <input
        ref={input}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void selectFile(f);
        }}
      />

      {uploadState.status === "error" && (
        <span className="max-w-52 text-xs font-medium text-rose-600" role="alert">
          {uploadState.message}
        </span>
      )}

      <dialog
        ref={dialog}
        aria-label="Impor laporan stok"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
        className="modern-dialog max-h-[90vh] w-[min(960px,94vw)] overflow-y-auto rounded-3xl p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF3FF] text-[#0E33BC]">
              <FileSpreadsheet size={22} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Siapkan laporan stok
              </h2>
              <p className="break-all text-sm font-medium text-slate-600">
                {file?.name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <span>Pilih sumber → Periksa pratinjau → Simpan (maks. 50 MB)</span>
                <a
                  href="/api/upload/template"
                  download
                  className="inline-flex items-center gap-1 font-semibold text-[#0E33BC] hover:underline"
                >
                  <Download size={13} aria-hidden="true" />
                  Unduh template
                </a>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup pratinjau"
            disabled={busy}
            onClick={() => dialog.current?.close()}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        {busy && (
          <p
            role="status"
            className="mb-4 flex items-center gap-2.5 rounded-xl bg-[#EEF3FF] px-4 py-3 text-sm font-medium text-[#0E33BC]"
          >
            <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            Memproses workbook Excel…
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <AlertCircle size={17} className="shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {inspection && (
          <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
            {inspection.warnings.length > 0 && (
              <div className="rounded-xl border border-blue-200/70 bg-blue-50/70 p-3.5 text-sm text-blue-900">
                {inspection.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0E33BC] text-xs font-bold text-white">
                  1
                </span>
                <h3 className="font-semibold text-slate-900">
                  Sumber saldo stok akhir
                </h3>
              </div>
              {stock && (
                <MappingEditor
                  inspection={inspection}
                  mapping={stock}
                  onChange={updateStock}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void processPreview()}
                className="inline-flex items-center gap-2 rounded-xl border border-[#0E33BC]/30 bg-[#EEF3FF] px-4 py-2.5 text-sm font-semibold text-[#0E33BC] transition hover:bg-[#0E33BC] hover:text-white"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-current/15 text-xs font-bold">
                  2
                </span>
                Periksa hasil preprocessing
              </button>
            </div>

            {preview && (
              <div className="space-y-4 rounded-2xl border border-emerald-200/70 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="flex items-center gap-2 font-bold text-slate-900">
                    <CheckCircle2
                      size={18}
                      className="text-emerald-600"
                      aria-hidden="true"
                    />
                    Hasil pratinjau sebelum disimpan
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {preview.reportMonth}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/70">
                    <p className="text-[11px] text-slate-500">Produk</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                      {preview.totalProducts.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/70">
                    <p className="text-[11px] text-slate-500">Gudang</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                      {preview.totalDepos.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/70">
                    <p className="text-[11px] text-slate-500">Catatan stok</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-slate-900">
                      {preview.stockItems.length.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200/70">
                    <p className="text-[11px] text-slate-500">Temuan</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums text-amber-700">
                      {preview.preprocessing.issueCount.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        {["Produk", "Gudang", "Stok", "Minimum", "Sumber"].map(
                          (h) => (
                            <th key={h} className="px-3 py-2 font-semibold">
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.stockItems.slice(0, 5).map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-slate-100 text-slate-700"
                        >
                          <td className="px-3 py-2 font-medium text-slate-900">
                            {s.product}
                          </td>
                          <td className="px-3 py-2">{s.warehouse}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {s.stock ?? "Tidak diketahui"}
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {s.minStock ?? "Tidak tersedia"}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">
                            {s.sources[0].sheet}:{s.sources[0].row}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {preview.preprocessing.warnings.map((w) => (
                  <p key={w} className="text-xs text-slate-600">
                    {w}
                  </p>
                ))}

                <div className="flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-end sm:justify-between">
                  <label className="block flex-1 text-xs font-semibold text-slate-700">
                    Bulan laporan{" "}
                    {preview.reportMonth === "Periode tidak diketahui"
                      ? "(wajib)"
                      : "(opsional koreksi)"}
                    <input
                      type="month"
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={
                      !period &&
                      preview.reportMonth === "Periode tidak diketahui"
                    }
                    onClick={() => void confirm()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0E33BC] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0A2796] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    3. Gunakan data ini
                  </button>
                </div>
              </div>
            )}
          </fieldset>
        )}
      </dialog>
    </>
  );
}
