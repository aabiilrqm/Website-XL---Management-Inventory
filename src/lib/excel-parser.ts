import * as XLSX from "xlsx";

import { stockStatus } from "./stock-status";
export { stockStatus } from "./stock-status";
export type Field = "product" | "sku" | "brand" | "category" | "warehouse" | "quantity" | "minimum" | "price" | "total" | "date" | "origin" | "destination" | "status";
export interface ImportMapping {
  sheet: string; headerRow: number; layout: "matrix" | "long";
  columns: Partial<Record<Field, string>>;
  warehouseColumns: { column: string; warehouse: string; minimumColumn?: string }[];
}
export interface ImportOptions { stock?: ImportMapping; movement?: ImportMapping | null; fileName?: string }
export interface ColumnOption { column: string; label: string }
export interface SheetInspection {
  name: string; headers: { row: number; columns: ColumnOption[] }[];
  stock: ImportMapping | null; movement: ImportMapping | null; score: number;
}
export interface ImportInspection {
  sheets: SheetInspection[]; suggestedStock: ImportMapping | null; suggestedMovement: ImportMapping | null; warnings: string[];
}
export interface SourceReference { sheet: string; row: number; column: string }
export type StockStatus = "Aman" | "Menipis" | "Kritis" | "Habis" | "Periksa" | "Belum dinilai";
export interface StockItem {
  id: number; product: string; sku: string; brand: string; category: string; warehouse: string;
  stock: number | null; minStock: number | null; price: number | null; sold: number | null;
  status: StockStatus; sources: SourceReference[];
}
export interface Warehouse { id: number; name: string; stockCount: number; active: boolean; location: string; phone: string; manager: string }
export interface DashboardStat { title: string; value: string; description: string }
export interface LowStockItem { name: string; stock: number; threshold: number }
export interface StoreRequest { store: string; item: string; qty: number; status: string }
export interface DistributionRecord { date: string; store: string; item: string; qty: number; status: string }
export interface Notification {
  id: number; type: "request" | "alert" | "info"; title: string; message: string; time: string;
  status: "pending" | "warning" | "critical" | "completed" | "approved"; from: string; product: string; quantity: number;
}
export interface Movement {
  date: string | null; product: string; origin: string; destination: string; quantity: number; status: string; source: SourceReference;
}
export interface ParsedData {
  schemaVersion: 2; stockItems: StockItem[]; movements: Movement[]; warehouses: Warehouse[];
  dashboardStats: DashboardStat[]; lowStockItems: LowStockItem[]; storeRequests: StoreRequest[];
  distributions: DistributionRecord[]; notifications: Notification[];
  lastUpdated: string; reportMonth: string; totalProducts: number; totalDepos: number;
  preprocessing: {
    fileName: string; stockSource: ImportMapping; movementSource: ImportMapping | null;
    ignoredSheets: string[]; warnings: string[]; issues: { sheet: string; row: number; message: string }[];
    issueCount: number; missingValues: number; invalidValues: number; negativeStocks: number;
    duplicateRows: number; skippedRows: number; totalMismatches: number;
  };
}
export class ImportError extends Error {}
type Grid = Map<number, Map<number, unknown>>;
const SCAN_ROWS = 80;
const aliases: Record<Field, string[]> = {
  product: ["nama produk", "nama product", "produk", "product", "product name", "produk name", "item name", "product name ows", "product name denom", "item stok", "nama barang", "item", "description"],
  sku: ["product id", "id produk", "kode produk", "kode barang", "sku", "item code", "prdocut id"],
  brand: ["brand", "merek", "merk"], category: ["sp pv", "category", "kategori", "categori", "jenis", "product category"],
  warehouse: ["depo", "gudang", "warehouse", "nama gudang", "lokasi", "branch", "cabang"],
  quantity: ["stok", "stock", "qty", "quantity", "jumlah", "sisa stock", "sisa stok", "closing stock", "stok akhir", "stock akhir", "on depo", "available stock"],
  minimum: ["min stock", "min stok", "minimum stock", "stok minimum", "minimum stok", "safety stock", "reorder point"],
  price: ["harga satuan", "harga", "price", "unit price"], total: ["total", "grand total", "total stok", "total stock"],
  date: ["tgl", "tanggal", "date", "transaction date", "tgl trx"],
  origin: ["depo asal", "gudang asal", "asal", "origin", "source warehouse", "from"],
  destination: ["depo tujuan", "gudang tujuan", "tujuan", "destination", "destination warehouse", "to"],
  status: ["status po xl", "status", "status transfer"],
};
export function cleanText(v: unknown): string { return v == null ? "" : String(v).replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim(); }
const norm = (v: unknown) => cleanText(v).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
const isField = (v: unknown, f: Field) => aliases[f].some(a => norm(a) === norm(cleanText(v).replace(/[._]\d+$/, "")));
const isTotal = (v: unknown) => /^(grand total|sub total|subtotal|total)(\b|$)/i.test(cleanText(v));
export function warehouseName(v: unknown): string {
  const text = cleanText(v).replace(/^(gudang|depo|warehouse)\s*[:\-]?\s+/i, "");
  return ({ pare: "PARE-PARE", parepare: "PARE-PARE", "pare pare": "PARE-PARE", "luwu timur": "LUTIM" } as Record<string, string>)[norm(text)] ?? text.toUpperCase();
}
/** Missing is unknown. Dash means zero in Excel accounting. Negative values remain negative. */
export function parseNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = cleanText(v);
  if (!s) return null;
  if (/^[-–—]$/.test(s)) return 0;
  const negative = /^\(.*\)$/.test(s);
  s = s.replace(/^(Rp\.?|IDR)\s*/i, "").replace(/[()\s]/g, "");
  if (!/^[+-]?[\d.,]+$/.test(s)) return null;
  if (s.includes(",") && s.includes(".")) s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  else if (/^[+-]?\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, "");
  else s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? negative ? -n : n : null;
}
/** Traverse populated cells, never a rectangular !ref (example contains a million formatted rows). */
function grid(sheet: XLSX.WorkSheet): Grid {
  const rows: Grid = new Map();
  for (const key of Object.keys(sheet)) {
    if (key.startsWith("!")) continue;
    const cell = sheet[key] as XLSX.CellObject;
    if ((cell.v == null || cell.v === "") && !cell.f) continue;
    const { r, c } = XLSX.utils.decode_cell(key);
    if (!rows.has(r)) rows.set(r, new Map());
    rows.get(r)!.set(c, cell.t === "e" ? "#EXCEL_ERROR" : cell.v == null || cell.v === "" ? "#FORMULA_NOT_CALCULATED" : cell.v);
  }
  return rows;
}
const ci = (col: string) => XLSX.utils.decode_col(col);
const val = (row: Map<number, unknown>, col?: string) => col ? row.get(ci(col)) : undefined;
function headerColumns(sheet: XLSX.WorkSheet, rows: Grid, r: number): ColumnOption[] {
  const cells = new Map(rows.get(r) ?? []);
  for (const m of sheet["!merges"] ?? []) {
    if (m.s.c === m.e.c && m.s.r <= r && m.e.r >= r && !cells.has(m.s.c)) cells.set(m.s.c, rows.get(m.s.r)?.get(m.s.c));
  }
  return [...cells].sort(([a], [b]) => a - b).flatMap(([c, v]) => typeof v === "string" && cleanText(v) ? [{ column: XLSX.utils.encode_col(c), label: cleanText(v) }] : []);
}
function detect(name: string, rows: Grid, headers: ColumnOption[], r: number, movement: boolean) {
  const products = headers.filter(h => isField(h.label, "product"));
  return products.flatMap(p => {
    const center = ci(p.column);
    // Select fields nearest to this product column: independent side-by-side tables.
    const near = headers.filter(h => !products.some(other => other !== p && Math.abs(ci(other.column) - ci(h.column)) < Math.abs(center - ci(h.column))));
    const columns: ImportMapping["columns"] = { product: p.column };
    for (const field of Object.keys(aliases) as Field[]) {
      if (field === "product") continue;
      const priority = (h: ColumnOption) => Math.abs(ci(h.column) - center) - (/^(sisa|closing|stok akhir|stock akhir)/.test(norm(h.label)) ? 100 : 0);
      const matches = near.filter(h => isField(h.label, field)).sort((a, b) => priority(a) - priority(b));
      if (matches[0]) columns[field] = matches[0].column;
    }
    if (movement) {
      if (!columns.origin || !columns.destination || !columns.quantity) return [];
      return [{ mapping: { sheet: name, headerRow: r + 1, layout: "long" as const, columns, warehouseColumns: [] }, score: 40 + (columns.date ? 5 : 0) }];
    }
    if (columns.origin || columns.destination || columns.date) return [];
    const warehouseColumns = near.filter(h => {
      if (Object.values(columns).includes(h.column) || isTotal(h.label)) return false;
      if (Object.values(aliases).flat().some(a => norm(a) === norm(h.label))) return false;
      if (/amount|value|nilai|awal|akhir|on hand|produksi|penjualan|sellout|transit|gap|konversi|sisa|\bmin\b|minimum|safety|\bin\b|\bout\b|week|minggu|^p np$/i.test(h.label)) return false;
      if (/^(makassar|maros|bulukumba|bone|pare[ -]?pare|pare|palopo|lutim|luwu timur|wonomulyo|kendari|bombana)$/i.test(h.label) || /^(gudang|depo|warehouse)\s/i.test(h.label)) return true;
      if (!columns.total || ci(h.column) < center || ci(h.column) >= ci(columns.total)) return false;
      const sample = [...rows].filter(([rr]) => rr > r).slice(0, 8).map(([, row]) => val(row, h.column)).filter(v => cleanText(v));
      return sample.length >= 2 && sample.every(v => parseNumber(v) !== null);
    }).map(h => {
      const warehouse = warehouseName(h.label);
      const minimum = headers.find(option => /\bmin\b|minimum|safety stock|reorder point/i.test(option.label) &&
        norm(warehouseName(option.label.replace(/\b(minimum|min|stock|stok|safety|reorder|point)\b/gi, ""))) === norm(warehouse));
      return { column: h.column, warehouse, ...(minimum ? { minimumColumn: minimum.column } : {}) };
    });
    const layout = columns.warehouse && columns.quantity ? "long" as const : "matrix" as const;
    if (layout === "matrix" && !warehouseColumns.length) return [];
    const cols = layout === "long" ? [columns.quantity!] : warehouseColumns.map(w => w.column);
    const sampleCount = [...rows].filter(([rr]) => rr > r).slice(0, 8).filter(([, row]) => {
      const name = val(row, columns.product);
      return cleanText(name) && !isTotal(name) && !isField(name, "product") && cols.some(c => parseNumber(val(row, c)) !== null);
    }).length;
    return [{ mapping: { sheet: name, headerRow: r + 1, layout, columns, warehouseColumns: layout === "matrix" ? warehouseColumns : [] },
      score: 20 + Math.min(warehouseColumns.length, 10) + sampleCount * 3 + (columns.sku ? 2 : 0) + (columns.brand ? 1 : 0) }];
  });
}
function read(buffer: Buffer, preview: boolean, sheets?: string[]): XLSX.WorkBook {
  try { return XLSX.read(buffer, { type: "buffer", cellDates: false, cellText: false, cellFormula: true, cellStyles: false, ...(preview ? { sheetRows: SCAN_ROWS } : {}), ...(sheets ? { sheets } : {}) }); }
  catch { throw new ImportError("File Excel tidak dapat dibaca. Pastikan file valid dan tidak diproteksi kata sandi."); }
}
export function inspectExcel(buffer: Buffer): ImportInspection {
  const book = read(buffer, true);
  const stocks: { mapping: ImportMapping; score: number }[] = [];
  const moves: typeof stocks = [];
  const sheets = book.SheetNames.map(name => {
    const sheet = book.Sheets[name], rows = grid(sheet);
    const headers = [...rows.keys()].filter(r => r < SCAN_ROWS).sort((a, b) => a - b).map(r => ({ row: r + 1, columns: headerColumns(sheet, rows, r) })).filter(h => h.columns.length >= 2);
    const stock = headers.flatMap(h => detect(name, rows, h.columns, h.row - 1, false)).sort((a, b) => b.score - a.score);
    const move = headers.flatMap(h => detect(name, rows, h.columns, h.row - 1, true)).sort((a, b) => b.score - a.score);
    if (stock[0]) { stock[0].score += /summary per bo|stok per gudang|stock per warehouse/i.test(name) ? 15 : 0; stocks.push(stock[0]); }
    if (move[0]) moves.push(move[0]);
    return { name, headers, stock: stock[0]?.mapping ?? null, movement: move[0]?.mapping ?? null, score: stock[0]?.score ?? 0 };
  });
  stocks.sort((a, b) => b.score - a.score); moves.sort((a, b) => b.score - a.score);
  const warnings = ["Pilih satu sumber stok utama. Sheet ringkasan dan detail bisa memuat stok yang sama."];
  if (!stocks.length) warnings.push("Format belum dikenali otomatis. Pilih sheet, baris header, dan kolom secara manual (80 baris pertama).");
  return { sheets, suggestedStock: stocks[0]?.mapping ?? null, suggestedMovement: moves[0]?.mapping ?? null, warnings };
}
function validate(m: ImportMapping, book: XLSX.WorkBook, movement = false) {
  if (!m || !book.Sheets[m.sheet]) throw new ImportError("Sheet yang dipilih tidak tersedia.");
  if (!Number.isInteger(m.headerRow) || m.headerRow < 1 || m.headerRow > 1048576 || !m.columns || !Array.isArray(m.warehouseColumns) || !["long", "matrix"].includes(m.layout)) throw new ImportError("Pemetaan tidak valid.");
  const cols = [...Object.values(m.columns), ...m.warehouseColumns.flatMap(w => [w.column, ...(w.minimumColumn ? [w.minimumColumn] : [])])];
  if (cols.some(c => typeof c !== "string" || !/^[A-Z]{1,3}$/.test(c) || ci(c) >= 16384)) throw new ImportError("Referensi kolom tidak valid.");
  if (!m.columns.product) throw new ImportError("Pilih kolom nama produk.");
  if ([m.columns.quantity, m.columns.minimum, m.columns.price, m.columns.warehouse].includes(m.columns.product)) throw new ImportError("Kolom produk harus berbeda dari stok, minimum, harga, dan gudang.");
  if (m.columns.quantity && [m.columns.minimum, m.columns.price, m.columns.warehouse].includes(m.columns.quantity)) throw new ImportError("Kolom stok harus berbeda dari minimum, harga, dan gudang.");
  if (movement && (!m.columns.quantity || !m.columns.origin || !m.columns.destination)) throw new ImportError("Transfer memerlukan jumlah, gudang asal, dan gudang tujuan.");
  if (!movement && m.layout === "long" && (!m.columns.warehouse || !m.columns.quantity)) throw new ImportError("Format baris memerlukan gudang dan stok.");
  if (!movement && m.layout === "matrix") {
    const names = m.warehouseColumns.map(w => warehouseName(w.warehouse));
    if (!names.length || names.some(n => !n || isTotal(n)) || new Set(names).size !== names.length || new Set(m.warehouseColumns.map(w => w.column)).size !== names.length) throw new ImportError("Pilih kolom gudang dengan nama unik. Jangan pilih kolom total sebagai gudang.");
    if (m.warehouseColumns.some(w => Object.values(m.columns).includes(w.column))) throw new ImportError("Kolom gudang tidak boleh merangkap sebagai harga, produk, atau total.");
    if (m.warehouseColumns.some(w => w.minimumColumn && (w.minimumColumn === w.column || m.warehouseColumns.some(other => other.column === w.minimumColumn)))) throw new ImportError("Kolom minimum harus berbeda dari kolom stok.");
  }
}
function dateISO(v: unknown, date1904 = false): string | null {
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v, { date1904 });
    return d ? [d.y, String(d.m).padStart(2, "0"), String(d.d).padStart(2, "0")].join("-") : null;
  }
  const text = cleanText(v);
  const m = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  const iso = m ? m[3] + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0") : text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return iso && !isNaN(Date.parse(iso)) && new Date(iso).toISOString().slice(0, 10) === iso ? iso : null;
}
function reportPeriod(book: XLSX.WorkBook, fileName: string, movements: Movement[]): string {
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const eng = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const texts = [fileName];
  for (const sheet of Object.values(book.Sheets)) for (const [r, row] of grid(sheet)) if (r < 10) texts.push(...[...row.values()].filter(v => typeof v === "string").map(cleanText));
  for (const text of texts) for (const [i, month] of months.entries()) {
    const match = text.match(new RegExp("(?:" + month + "|" + eng[i] + ")\\s+(20\\d{2})", "i"));
    if (match) return month + " " + match[1];
  }
  const dates = movements.map(m => m.date).filter((d): d is string => !!d).sort();
  const latest = dates[dates.length - 1];
  return latest ? months[Number(latest.slice(5, 7)) - 1] + " " + latest.slice(0, 4) : "Periode tidak diketahui";
}
export function parseExcel(buffer: Buffer, options: ImportOptions = {}): ParsedData {
  const inspection = !options.stock || options.movement === undefined ? inspectExcel(buffer) : null;
  const mapping = options.stock ?? inspection?.suggestedStock;
  if (!mapping) throw new ImportError("Tidak ada tabel stok yang dikenali. Gunakan pemetaan manual.");
  const movement = options.movement === undefined ? inspection?.suggestedMovement ?? null : options.movement;
  const book = read(buffer, false, [...new Set([mapping.sheet, ...(movement ? [movement.sheet] : [])])]);
  validate(mapping, book); if (movement) validate(movement, book, true);
  const q: ParsedData["preprocessing"] = {
    fileName: options.fileName ?? "", stockSource: mapping, movementSource: movement,
    ignoredSheets: book.SheetNames.filter(n => n !== mapping.sheet && n !== movement?.sheet), warnings: [], issues: [],
    issueCount: 0, missingValues: 0, invalidValues: 0, negativeStocks: 0, duplicateRows: 0, skippedRows: 0, totalMismatches: 0,
  };
  const issue = (sheet: string, row: number, message: string) => { q.issueCount++; if (q.issues.length < 100) q.issues.push({ sheet, row, message }); };
  const stocks: StockItem[] = [], seen = new Set<string>(), c = mapping.columns;
  for (const [r, row] of [...grid(book.Sheets[mapping.sheet])].sort(([a], [b]) => a - b)) {
    if (r < mapping.headerRow) continue;
    const product = cleanText(val(row, c.product));
    if (!product || isTotal(product) || isField(product, "product")) { q.skippedRows++; continue; }
    const sku = cleanText(val(row, c.sku)), brand = cleanText(val(row, c.brand)).toUpperCase(), category = cleanText(val(row, c.category)).toUpperCase();
    const price = parseNumber(val(row, c.price)), minimum = parseNumber(val(row, c.minimum));
    if ((cleanText(val(row, c.price)) && (price === null || price < 0)) || (cleanText(val(row, c.minimum)) && (minimum === null || minimum < 0))) issue(mapping.sheet, r + 1, "Harga atau minimum tidak valid; tidak digunakan.");
    const wh: ImportMapping["warehouseColumns"] = mapping.layout === "matrix" ? mapping.warehouseColumns : [{ column: c.quantity!, warehouse: warehouseName(val(row, c.warehouse)) }];
    if (!wh[0]?.warehouse || isTotal(wh[0].warehouse)) { q.skippedRows++; continue; }
    const parsed = wh.map(w => ({ ...w, warehouse: warehouseName(w.warehouse), raw: val(row, w.column), stock: parseNumber(val(row, w.column)), minimum: w.minimumColumn ? parseNumber(val(row, w.minimumColumn)) : minimum }));
    if (parsed.every(p => !cleanText(p.raw))) { q.skippedRows++; continue; }
    const fingerprint = JSON.stringify([norm(product), sku, norm(brand), norm(category), parsed.map(p => [p.warehouse, cleanText(p.raw), p.minimum]), price]);
    if (seen.has(fingerprint)) { q.duplicateRows++; issue(mapping.sheet, r + 1, "Baris identik diabaikan agar stok tidak dihitung dua kali."); continue; }
    seen.add(fingerprint);
    const total = parseNumber(val(row, c.total));
    if (c.total && total !== null && parsed.every(p => p.stock !== null)) {
      const sum = parsed.reduce((a, p) => a + p.stock!, 0);
      if (Math.abs(sum - total) > 0.001) { q.totalMismatches++; issue(mapping.sheet, r + 1, "Total Excel " + total + " berbeda dari jumlah gudang " + sum + "; dipakai jumlah gudang."); }
    }
    for (const p of parsed) {
      const rowMinimum = p.minimum !== null && p.minimum >= 0 ? p.minimum : null;
      if (p.minimumColumn && cleanText(val(row, p.minimumColumn)) && rowMinimum === null) issue(mapping.sheet, r + 1, p.warehouse + ": minimum stok tidak valid; belum dinilai.");
      if (p.stock === null) { if (!cleanText(p.raw)) q.missingValues++; else q.invalidValues++; issue(mapping.sheet, r + 1, p.warehouse + ": stok kosong/tidak valid."); }
      else if (p.stock < 0) { q.negativeStocks++; issue(mapping.sheet, r + 1, p.warehouse + ": stok negatif " + p.stock + ", perlu rekonsiliasi."); }
      stocks.push({ id: stocks.length + 1, product, sku, brand: brand || "Tidak diketahui", category: category || "Tidak diketahui",
        warehouse: p.warehouse, stock: p.stock, minStock: rowMinimum,
        price: price !== null && price >= 0 ? price : null, sold: null, status: stockStatus(p.stock, rowMinimum),
        sources: [{ sheet: mapping.sheet, row: r + 1, column: p.column }] });
    }
  }
  if (!stocks.length || stocks.every(s => s.stock === null)) throw new ImportError("Pemetaan tidak menghasilkan stok numerik. Periksa header dan kolom stok.");
  const movements: Movement[] = [];
  if (movement) for (const [r, row] of grid(book.Sheets[movement.sheet])) {
    if (r < movement.headerRow) continue;
    const c = movement.columns, product = cleanText(val(row, c.product)), raw = val(row, c.quantity), quantity = parseNumber(raw);
    if (!product || isTotal(product) || isField(product, "product") || !cleanText(raw)) continue;
    const origin = warehouseName(val(row, c.origin)), destination = warehouseName(val(row, c.destination));
    if (quantity === null || quantity <= 0 || !origin || !destination) { issue(movement.sheet, r + 1, "Transfer diabaikan: jumlah atau asal/tujuan tidak valid."); continue; }
    const date = dateISO(val(row, c.date), !!book.Workbook?.WBProps?.date1904);
    if (c.date && !date) issue(movement.sheet, r + 1, "Tanggal transfer tidak valid; tidak masuk grafik harian.");
    movements.push({ date, product, origin, destination, quantity, status: cleanText(val(row, c.status)) || "Tidak diketahui", source: { sheet: movement.sheet, row: r + 1, column: c.quantity! } });
  }
  const totals = new Map<string, number>();
  for (const s of stocks) totals.set(s.warehouse, (totals.get(s.warehouse) ?? 0) + (s.stock ?? 0));
  const warehouses = [...totals].map(([name, stockCount], i) => ({ id: i + 1, name: "Gudang " + name, stockCount, active: true, location: "Tidak tercantum dalam laporan", phone: "—", manager: "—" }));
  const total = stocks.reduce((a, s) => a + (s.stock ?? 0), 0);
  const products = new Set(stocks.map(s => (s.sku || norm(s.product)) + "|" + norm(s.brand) + "|" + norm(s.category))).size;
  if (stocks.some(s => s.minStock === null)) q.warnings.push("Sebagian minimum stok tidak tersedia. Status menipis belum dinilai untuk catatan tersebut; tidak ada ambang yang diasumsikan.");
  if (q.missingValues || q.invalidValues) q.warnings.push("Total hanya menjumlahkan nilai yang diketahui; stok kosong bukan stok nol.");
  if (q.duplicateRows) q.warnings.push("Baris identik dibuang. Jika baris tersebut mewakili batch berbeda, gabungkan batch di sumber sebelum impor.");
  q.warnings.push("Transfer antar-depo bukan penjualan dan tidak ditambahkan ke stok akhir.");
  return { schemaVersion: 2, stockItems: stocks, movements, warehouses, preprocessing: q,
    dashboardStats: [
      { title: "Stok tercatat", value: total.toLocaleString("id-ID"), description: "Saldo per gudang termasuk koreksi negatif" },
      { title: "Produk unik", value: String(products), description: "Produk dalam sumber stok" },
      { title: "Gudang", value: String(warehouses.length), description: "Gudang dalam laporan" },
      { title: "Perlu diperiksa", value: String(q.missingValues + q.invalidValues + q.negativeStocks), description: "Stok kosong, tidak valid, atau negatif" },
    ],
    lowStockItems: stocks.filter(s => s.stock !== null && s.minStock !== null && s.stock < s.minStock).map(s => ({ name: s.product + " · " + s.warehouse, stock: s.stock!, threshold: s.minStock! })),
    storeRequests: [], notifications: [], distributions: movements.map(m => ({ date: m.date ?? "Tidak diketahui", store: m.destination, item: m.product, qty: m.quantity, status: m.status })),
    lastUpdated: new Date().toISOString(), reportMonth: reportPeriod(book, options.fileName ?? "", movements), totalProducts: products, totalDepos: warehouses.length };
}
