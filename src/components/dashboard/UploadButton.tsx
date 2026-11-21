"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { useData } from "@/context/DataContext";
import type { ColumnOption, Field, ImportInspection, ImportMapping, ImportOptions, ParsedData } from "@/lib/excel-parser";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900";
const empty = (sheet: string, row = 1): ImportMapping => ({ sheet, headerRow: row, layout: "long", columns: {}, warehouseColumns: [] });
function MappingEditor({ inspection, mapping, onChange }: {
  inspection: ImportInspection; mapping: ImportMapping; onChange: (m: ImportMapping) => void;
}) {
  const sheet = inspection.sheets.find(s => s.name === mapping.sheet);
  const columns: ColumnOption[] = sheet?.headers.find(h => h.row === mapping.headerRow)?.columns ?? [];
  const fields: [Field, string][] = [["product", "Produk *"], ["sku", "Kode produk"], ["brand", "Merek"], ["category", "Kategori"], ["price", "Harga satuan"], ["minimum", "Minimum stok"], ["total", "Total pembanding"], ...(mapping.layout === "long" ? [["warehouse", "Gudang *"], ["quantity", "Stok akhir *"]] as [Field, string][] : [])];
  return <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm text-slate-600">Sheet<select aria-label="Sheet stok" className={inputClass} value={mapping.sheet} onChange={e => {
        const next = inspection.sheets.find(s => s.name === e.target.value)!;
        onChange(next.stock ?? empty(next.name, next.headers[0]?.row ?? 1));
      }}>{inspection.sheets.map(s => <option key={s.name}>{s.name}</option>)}</select></label>
      <label className="text-sm text-slate-600">Baris header<select className={inputClass} value={mapping.headerRow} onChange={e => onChange(empty(mapping.sheet, Number(e.target.value)))}>
        {sheet?.headers.map(h => <option key={h.row} value={h.row}>Baris {h.row}: {h.columns.slice(0, 2).map(c => c.label).join(" / ")}</option>)}
      </select></label>
      <label className="text-sm text-slate-600">Bentuk tabel<select className={inputClass} value={mapping.layout} onChange={e => onChange({ ...mapping, layout: e.target.value as ImportMapping["layout"], warehouseColumns: [] })}>
        <option value="long">Satu baris per produk/gudang</option><option value="matrix">Gudang sebagai kolom</option>
      </select></label>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">{fields.map(([field, label]) => <label className="text-sm text-slate-600" key={field}>{label}
      <select className={inputClass} value={mapping.columns[field] ?? ""} onChange={e => {
        const next = { ...mapping.columns };
        if (e.target.value) next[field] = e.target.value; else delete next[field];
        onChange({ ...mapping, columns: next });
      }}><option value="">Tidak tersedia</option>{columns.map(c => <option key={c.column} value={c.column}>{c.column} · {c.label}</option>)}</select>
    </label>)}</div>
    {mapping.layout === "matrix" && <div><p className="mb-2 text-sm font-medium text-slate-700">Kolom stok gudang (jangan pilih total)</p>
      <div className="grid max-h-52 gap-2 overflow-auto sm:grid-cols-2">{columns.filter(c => !Object.values(mapping.columns).includes(c.column)).map(c => {
        const selected = mapping.warehouseColumns.find(w => w.column === c.column);
        return <div key={c.column} className="flex items-center gap-2 text-sm">
          <label className="flex shrink-0 items-center gap-2"><input type="checkbox" checked={!!selected} onChange={e => onChange({ ...mapping, warehouseColumns: e.target.checked ? [...mapping.warehouseColumns, { column: c.column, warehouse: c.label }] : mapping.warehouseColumns.filter(w => w.column !== c.column) })} />{c.column} · {c.label}</label>
          {selected && <div className="min-w-36 space-y-1"><input aria-label={"Nama gudang " + c.column} className={inputClass} value={selected.warehouse} onChange={e => onChange({ ...mapping, warehouseColumns: mapping.warehouseColumns.map(w => w.column === c.column ? { ...w, warehouse: e.target.value } : w) })} />
            <select aria-label={"Kolom minimum " + selected.warehouse} className={inputClass} value={selected.minimumColumn ?? ""} onChange={e => onChange({ ...mapping, warehouseColumns: mapping.warehouseColumns.map(w => w.column === c.column ? { ...w, minimumColumn: e.target.value || undefined } : w) })}><option value="">Minimum umum / tidak tersedia</option>{columns.filter(col => !mapping.warehouseColumns.some(w => w.column === col.column)).map(col => <option value={col.column} key={col.column}>{col.column} · {col.label}</option>)}</select>
          </div>}
        </div>;
      })}</div></div>}
  </div>;
}
export default function UploadButton() {
  const { data, uploadFile, uploadState } = useData();
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<ImportInspection | null>(null);
  const [stock, setStock] = useState<ImportMapping | null>(null);
  const [preview, setPreview] = useState<ParsedData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function request(file: File, action: string, mapping?: ImportOptions) {
    const form = new FormData(); form.append("file", file); form.append("action", action);
    if (mapping) form.append("mapping", JSON.stringify(mapping));
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error ?? "File gagal diproses.");
    return json;
  }
  async function selectFile(file: File) {
    setFile(file); setInspection(null); setPreview(null); setError(""); setBusy(true);
    dialog.current?.showModal();
    try {
      const json = await request(file, "inspect");
      const result = json.inspection as ImportInspection;
      setInspection(result); setStock(result.suggestedStock ?? empty(result.sheets[0]?.name ?? ""));
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal membaca file."); }
    finally { setBusy(false); }
  }
  const updateStock = (m: ImportMapping) => { setStock(m); setPreview(null); };
  async function processPreview() {
    if (!file || !stock) return;
    setError(""); setBusy(true);
    try { const json = await request(file, "preview", { stock, movement: null }); setPreview(json.data); }
    catch (err) { setError(err instanceof Error ? err.message : "Pratinjau gagal."); }
    finally { setBusy(false); }
  }
  async function confirm() {
    if (!file || !stock || !preview) return;
    setBusy(true); setError("");
    const ok = await uploadFile(file, { stock, movement: null });
    setBusy(false);
    if (ok) dialog.current?.close(); else setError("Impor gagal. Data sebelumnya tetap tersedia; coba pratinjau kembali.");
  }
  return <>
    <button onClick={() => input.current?.click()} className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"><Upload size={16} />{data ? "Ganti laporan" : "Upload Excel"}</button>
    <input ref={input} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void selectFile(f); }} />
    {uploadState.status === "error" && <span className="max-w-52 text-xs text-red-700" role="alert">{uploadState.message}</span>}
    <dialog ref={dialog} aria-label="Impor laporan stok" onCancel={e => { if (busy) e.preventDefault(); }} className="m-auto max-h-[90vh] w-[min(960px,95vw)] rounded-3xl bg-white p-6 shadow-xl backdrop:bg-slate-900/50">
      <div className="mb-4 flex items-start justify-between gap-4"><div>
        <h2 className="text-xl font-bold text-slate-900">Siapkan laporan stok</h2>
        <p className="break-all text-sm text-slate-500">{file?.name}</p>
        <p className="mt-1 text-xs text-slate-500">Pilih sumber → periksa hasil preprocessing → gunakan data. Maksimum 50 MB.</p>
        <a href="/api/upload/template" download className="text-xs font-medium text-blue-700 underline">Unduh template untuk format yang belum dikenali</a>
      </div><button aria-label="Tutup pratinjau" disabled={busy} onClick={() => dialog.current?.close()} className="rounded-lg p-2 disabled:opacity-40"><X size={20} /></button></div>
      {busy && <p role="status" className="mb-4 flex items-center gap-2 text-blue-700"><Loader2 size={18} className="animate-spin" />Memproses workbook…</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {inspection && <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
        <div className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{inspection.warnings.map(w => <p key={w}>{w}</p>)}</div>
        <h3 className="font-semibold text-slate-800">1. Sumber saldo stok akhir</h3>
        {stock && <MappingEditor inspection={inspection} mapping={stock} onChange={updateStock} />}
        <button onClick={() => void processPreview()} className="rounded-xl border border-blue-200 px-4 py-2 font-semibold text-blue-700">2. Periksa hasil preprocessing</button>
        {preview && <div className="space-y-3 rounded-2xl bg-slate-50 p-4">
          <h3 className="font-bold text-slate-900">Hasil sebelum disimpan</h3>
          <p className="text-sm text-slate-700">{preview.reportMonth} · {preview.totalProducts} produk · {preview.totalDepos} gudang · {preview.stockItems.length} catatan stok</p>
          <p className="text-sm text-amber-700">{preview.preprocessing.issueCount} temuan · {preview.preprocessing.duplicateRows} duplikat diabaikan · {preview.preprocessing.totalMismatches} selisih total</p>
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{["Produk", "Gudang", "Stok", "Minimum", "Sumber"].map(h => <th key={h} className="p-2">{h}</th>)}</tr></thead><tbody>{preview.stockItems.slice(0, 5).map(s => <tr key={s.id}><td className="p-2">{s.product}</td><td>{s.warehouse}</td><td>{s.stock ?? "Tidak diketahui"}</td><td>{s.minStock ?? "Tidak tersedia"}</td><td>{s.sources[0].sheet}:{s.sources[0].row}</td></tr>)}</tbody></table></div>
          {preview.preprocessing.warnings.map(w => <p key={w} className="text-xs text-slate-600">{w}</p>)}
          <button onClick={() => void confirm()} className="rounded-xl bg-[#0E33BC] px-5 py-3 font-semibold text-white">3. Gunakan data ini</button>
        </div>}
      </fieldset>}
    </dialog>
  </>;
}
