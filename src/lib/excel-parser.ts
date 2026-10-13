/**
 * excel-parser.ts
 * ─────────────────────────────────────────────────────────────
 * Path  : src/lib/excel-parser.ts
 *
 * Membaca file .xlsx laporan stok fisik XL dan menghasilkan
 * data yang PERSIS cocok dengan struktur yang dipakai setiap
 * halaman website (dashboard, stok-produk, gudang, notifikasi).
 *
 * Sheet yang diproses:
 *   • "SUMMARY PER BO"  → stok per produk per depo
 *   • "In Out Barang"   → riwayat distribusi & transfer stok
 *
 * Dependensi: xlsx (sudah ada di package.json)
 * ─────────────────────────────────────────────────────────────
 */

import * as XLSX from "xlsx";

// ═══════════════════════════════════════════════════════════════
// TIPE DATA — cocok persis dengan struktur tiap halaman
// ═══════════════════════════════════════════════════════════════

// --- dashboard/page.tsx ----------------------------------------
export interface DashboardStat {
  title: string;
  value: string;
  description: string;
}

export interface LowStockItem {
  name: string;
  stock: number;
  threshold: number;
}

export interface StoreRequest {
  store: string;   // nama depo tujuan
  item: string;    // nama produk
  qty: number;
  status: string;  // "Menunggu" | "Diproses" | "Terkirim"
}

export interface DistributionRecord {
  date: string;    // "24 Apr 2026"
  store: string;   // nama depo tujuan
  item: string;    // nama produk
  qty: number;
  status: string;  // "Terkirim" | "Dalam Proses"
}

// --- stok-produk/page.tsx --------------------------------------
export interface StockItem {
  id: number;
  product: string;
  warehouse: string;  // nama depo
  stock: number;
  minStock: number;
  sold: number;       // qty keluar dari depo ini (dari In Out Barang)
  status: "Aman" | "Menipis" | "Kritis" | "Habis";
  price: number;
}

// --- gudang/page.tsx -------------------------------------------
export interface Warehouse {
  id: number;
  name: string;       // "Gudang MAKASSAR"
  location: string;
  phone: string;
  manager: string;
  stockCount: number;
  active: boolean;
}

// --- notifikasi/page.tsx --------------------------------------
export interface Notification {
  id: number;
  type: "request" | "alert" | "info";
  title: string;
  message: string;
  time: string;       // "5 menit lalu", "2 jam lalu", dst.
  status: "pending" | "warning" | "critical" | "completed" | "approved";
  from: string;
  product: string;
  quantity: number;
}

// --- Output utama parseExcel() --------------------------------
export interface ParsedData {
  // Data per halaman
  dashboardStats: DashboardStat[];
  lowStockItems: LowStockItem[];
  storeRequests: StoreRequest[];
  distributions: DistributionRecord[];
  stockItems: StockItem[];
  warehouses: Warehouse[];
  notifications: Notification[];

  // Metadata
  lastUpdated: string;
  reportMonth: string;   // "April 2026"
  totalProducts: number;
  totalDepos: number;
}

// ═══════════════════════════════════════════════════════════════
// KONSTANTA
// ═══════════════════════════════════════════════════════════════

// Kolom depo di sheet SUMMARY PER BO (header asli Excel)
const DEPO_EXCEL_COLS: string[] = [
  "MAKASSAR", "Maros", "BULUKUMBA", "BONE",
  "PARE-PARE", "PALOPO", "LUTIM", "WONOMULYO",
  "KENDARI", "BOMBANA",
];

// Nama standar (uppercase) untuk tampilan di website
const DEPO_DISPLAY: Record<string, string> = {
  MAKASSAR: "MAKASSAR",
  Maros: "MAROS",
  BULUKUMBA: "BULUKUMBA",
  BONE: "BONE",
  "PARE-PARE": "PARE-PARE",
  PALOPO: "PALOPO",
  LUTIM: "LUTIM",
  WONOMULYO: "WONOMULYO",
  KENDARI: "KENDARI",
  BOMBANA: "BOMBANA",
};

// Info statis gudang (alamat, telepon, kepala gudang)
// Data ini tidak ada di Excel — disesuaikan secara manual
const DEPO_INFO: Record<string, { location: string; phone: string; manager: string }> = {
  MAKASSAR:   { location: "Jl. A.P. Pettarani No. 1, Makassar",         phone: "0411-123456",  manager: "Andi Saputra"     },
  MAROS:      { location: "Jl. Poros Maros-Makassar No. 45, Maros",     phone: "0411-789012",  manager: "Budi Santoso"     },
  BULUKUMBA:  { location: "Jl. Andi Mappanyukki No. 21, Bulukumba",     phone: "0413-567890",  manager: "Citra Dewi"       },
  BONE:       { location: "Jl. Jenderal Sudirman No. 34, Bone",         phone: "0481-345678",  manager: "Darmawan"         },
  "PARE-PARE":{ location: "Jl. Bau Massepe No. 56, Parepare",           phone: "0421-901234",  manager: "Erna Wati"        },
  PALOPO:     { location: "Jl. Andi Djemma No. 78, Palopo",             phone: "0471-123789",  manager: "Fahmi Rizal"      },
  LUTIM:      { location: "Jl. Soekarno Hatta No. 12, Malili, Luwu Timur", phone: "0474-234567", manager: "Gita Nirmala" },
  WONOMULYO:  { location: "Jl. Poros Polman-Mamuju No. 90, Wonomulyo",  phone: "0422-345678",  manager: "Hendra Kusuma"   },
  KENDARI:    { location: "Jl. Abdullah Silondae No. 23, Kendari",      phone: "0401-456789",  manager: "Indah Permata"   },
  BOMBANA:    { location: "Jl. Poros Bombana No. 5, Rumbia, Bombana",   phone: "0405-567890",  manager: "Joko Wibowo"     },
};

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Bersihkan nilai numerik dari cell Excel. Nilai negatif → 0. */
function toNum(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : Math.max(0, n);
}

/** Hitung minStock berdasarkan tipe & nama produk. */
function calcMinStock(type: string, name: string): number {
  const upper = (name ?? "").toUpperCase();
  if (upper.includes("KOSONG")) return 50_000;  // voucher kosong volume besar
  if (type === "SP") return 1_000;               // starter pack
  return 300;                                     // voucher produk biasa
}

/** Tentukan status stok. */
function stockStatus(stock: number, min: number): StockItem["status"] {
  if (stock <= 0) return "Habis";
  if (stock < min * 0.3) return "Kritis";
  if (stock < min) return "Menipis";
  return "Aman";
}

/** Format angka ke string dengan pemisah titik (Indonesian). */
function fmtNum(n: number): string {
  return n.toLocaleString("id-ID");
}

/** Format tanggal Excel → "24 Apr 2026". */
function fmtDate(val: unknown): string {
  if (!val) return "-";
  let d: Date;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === "number") {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (!parsed) return "-";
    d = new Date(parsed.y, parsed.m - 1, parsed.d);
  } else {
    d = new Date(String(val));
  }
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

/** Hitung waktu relatif dari tanggal ke tanggal referensi laporan (akhir April 2026). */
function relativeTime(val: unknown, refDate: Date): string {
  if (!val) return "-";
  let d: Date;
  if (val instanceof Date) {
    d = val;
  } else if (typeof val === "number") {
    const parsed = XLSX.SSF.parse_date_code(val);
    if (!parsed) return "-";
    d = new Date(parsed.y, parsed.m - 1, parsed.d);
  } else {
    d = new Date(String(val));
  }
  if (isNaN(d.getTime())) return "-";

  const diffMs = refDate.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay >= 1) return `${diffDay} hari lalu`;
  if (diffHr >= 1) return `${diffHr} jam lalu`;
  if (diffMin >= 1) return `${diffMin} menit lalu`;
  return "Baru saja";
}

// ═══════════════════════════════════════════════════════════════
// PARSER: SUMMARY PER BO
// ═══════════════════════════════════════════════════════════════

interface ProductRow {
  name: string;
  brand: string;
  type: string;       // "SP" | "PV"
  price: number;
  stockByDepo: Record<string, number>;  // key = nama display (uppercase)
  total: number;
  minStock: number;
}

function parseSummaryPerBO(ws: XLSX.WorkSheet): ProductRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 3,   // header ada di baris ke-4 (index 3)
    defval: 0,
  });

  const products: ProductRow[] = [];

  for (const row of rows) {
    const spPv = String(row["SP/PV"] ?? "").trim();
    if (!spPv || spPv === "0") continue;

    const name = String(row["NAMA PRODUK"] ?? "").trim();
    if (!name || name === "0") continue;

    const brand = String(row["BRAND"] ?? "").trim();
    const price = toNum(row["Harga Satuan"]);

    // Stok per depo — perhatikan header "Maros" (mixed-case) di Excel
    const stockByDepo: Record<string, number> = {};
    for (const col of DEPO_EXCEL_COLS) {
      const displayName = DEPO_DISPLAY[col];
      stockByDepo[displayName] = toNum(row[col]);
    }

    const totalFromExcel = toNum(row["TOTAL"]);
    const total = totalFromExcel > 0
      ? totalFromExcel
      : Object.values(stockByDepo).reduce((a, b) => a + b, 0);

    const minStock = calcMinStock(spPv, name);

    products.push({ name, brand, type: spPv, price, stockByDepo, total, minStock });
  }

  return products;
}

// ═══════════════════════════════════════════════════════════════
// PARSER: IN OUT BARANG
// ═══════════════════════════════════════════════════════════════

interface InOutRow {
  date: unknown;        // TGL.1 — tanggal distribusi/transfer
  depoAsal: string;
  depoTujuan: string;
  product: string;      // Produk Name
  qty: number;          // QTY.1
  remark: string;       // "TF STOK" | "PO XLSMART"
  status: string;       // Status PO XL
}

function parseInOutBarang(ws: XLSX.WorkSheet): InOutRow[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 1,   // header ada di baris ke-2 (index 1)
    defval: "",
  });

  const result: InOutRow[] = [];

  for (const row of rows) {
    const product = String(row["Produk Name"] ?? "").trim();
    // Dukung baik format QTY_1 maupun QTY.1 dari duplicate header xlsx
    const qty = toNum(row["QTY_1"] ?? row["QTY.1"] ?? row["QTY"]);

    // Lewati baris kosong (sisi kanan sheet tidak terisi)
    if (!product || qty === 0) continue;

    result.push({
      date: row["TGL_1"] ?? row["TGL.1"] ?? row["TGL"],
      depoAsal: String(row["DEPO ASAL"] ?? "").trim(),
      depoTujuan: String(row["DEPO TUJUAN"] ?? "").trim(),
      product,
      qty,
      remark: String(row["Remark"] ?? "").trim(),
      status: String(row["Status PO XL"] ?? "").trim(),
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// BUILDER: DATA PER HALAMAN
// ═══════════════════════════════════════════════════════════════

/** Bangun daftar StockItem untuk halaman stok-produk. */
function buildStockItems(products: ProductRow[]): StockItem[] {
  const items: StockItem[] = [];
  let id = 1;

  for (const p of products) {
    for (const [depo, stock] of Object.entries(p.stockByDepo)) {
      if (stock <= 0) continue;  // sembunyikan depo dengan stok nol

      items.push({
        id: id++,
        product: p.name,
        warehouse: depo,
        stock,
        minStock: p.minStock,
        sold: 0,        // akan diisi oleh enrichStockItemsWithSold()
        status: stockStatus(stock, p.minStock),
        price: p.price,
      });
    }
  }

  return items;
}

/**
 * Isi field `sold` pada stockItems dari data In Out Barang.
 * sold = total qty keluar dari depo ini untuk produk ini (Status Completed).
 */
function enrichStockItemsWithSold(
  items: StockItem[],
  inOutRows: InOutRow[]
): void {
  // Buat lookup: "PRODUK||DEPO_ASAL" → total qty keluar
  const soldMap = new Map<string, number>();

  for (const row of inOutRows) {
    if (row.status !== "Completed") continue;

    // Normalisasi nama depo (In Out bisa pakai "Bulukumba" mixed-case)
    const depoKey = row.depoAsal.toUpperCase();
    const key = `${row.product.trim().toLowerCase()}||${depoKey}`;
    soldMap.set(key, (soldMap.get(key) ?? 0) + row.qty);
  }

  for (const item of items) {
    const key = `${item.product.trim().toLowerCase()}||${item.warehouse.toUpperCase()}`;
    item.sold = soldMap.get(key) ?? 0;
  }
}

/** Bangun daftar Warehouse untuk halaman gudang. */
function buildWarehouses(products: ProductRow[]): Warehouse[] {
  // Akumulasi stok per depo
  const stockByDepo: Record<string, number> = {};
  for (const col of Object.values(DEPO_DISPLAY)) {
    stockByDepo[col] = 0;
  }
  for (const p of products) {
    for (const [depo, stock] of Object.entries(p.stockByDepo)) {
      stockByDepo[depo] = (stockByDepo[depo] ?? 0) + stock;
    }
  }

  const warehouses: Warehouse[] = [];
  let id = 1;

  for (const depo of Object.values(DEPO_DISPLAY)) {
    const info = DEPO_INFO[depo] ?? {
      location: `Wilayah ${depo}`,
      phone: "-",
      manager: "-",
    };
    const stockCount = stockByDepo[depo] ?? 0;

    warehouses.push({
      id: id++,
      name: `Gudang ${depo}`,
      location: info.location,
      phone: info.phone,
      manager: info.manager,
      stockCount,
      active: stockCount > 0,
    });
  }

  return warehouses;
}

/** Bangun daftar Notification untuk halaman notifikasi. */
function buildNotifications(
  products: ProductRow[],
  inOutRows: InOutRow[],
  refDate: Date
): Notification[] {
  const notifs: Notification[] = [];
  let id = 1;

  // 1. ALERT — produk dengan stok kritis/menipis per depo
  for (const p of products) {
    for (const [depo, stock] of Object.entries(p.stockByDepo)) {
      if (stock <= 0) continue;
      const st = stockStatus(stock, p.minStock);
      if (st !== "Kritis" && st !== "Menipis") continue;

      notifs.push({
        id: id++,
        type: "alert",
        title: st === "Kritis"
          ? `Peringatan Stok Kritis`
          : `Peringatan Stok Menipis`,
        message: `Stok ${p.name} di Gudang ${depo} tersisa ${fmtNum(stock)} pcs`,
        time: "Baru saja",
        status: st === "Kritis" ? "critical" : "warning",
        from: `Gudang ${depo}`,
        product: p.name,
        quantity: stock,
      });
    }
  }

  // 2. INFO — distribusi selesai (In Out Barang Completed), 20 terbaru
  const completed = inOutRows
    .filter((r) => r.status === "Completed")
    .slice(0, 20);

  for (const row of completed) {
    notifs.push({
      id: id++,
      type: "info",
      title: "Distribusi Selesai",
      message: `${row.product} (${fmtNum(row.qty)} pcs) dari ${row.depoAsal} → ${row.depoTujuan} telah selesai`,
      time: relativeTime(row.date, refDate),
      status: "completed",
      from: row.depoAsal || "Pusat",
      product: row.product,
      quantity: row.qty,
    });
  }

  return notifs;
}

/** Bangun dashboardStats (4 kartu ringkasan). */
function buildDashboardStats(
  products: ProductRow[],
  warehouses: Warehouse[],
  inOutRows: InOutRow[]
): DashboardStat[] {
  const totalStock = products.reduce((s, p) => s + p.total, 0);
  const activeDepos = warehouses.filter((w) => w.active).length;
  const distTotal = inOutRows
    .filter((r) => r.status === "Completed")
    .reduce((s, r) => s + r.qty, 0);
  const pendingCount = inOutRows.filter((r) => r.status !== "Completed").length;

  return [
    {
      title: "Total Stok Gudang",
      value: fmtNum(totalStock),
      description: "Unit tersedia di semua gudang Sulawesi",
    },
    {
      title: "Gudang Aktif",
      value: fmtNum(activeDepos),
      description: "Depo dengan stok tersedia",
    },
    {
      title: "Distribusi Bulan Ini",
      value: fmtNum(distTotal),
      description: "Unit yang sudah didistribusikan",
    },
    {
      title: "Request Masuk",
      value: fmtNum(pendingCount),
      description: "Menunggu persetujuan admin",
    },
  ];
}

/** Bangun lowStockItems untuk dashboard (maks 10 item). */
function buildLowStockItems(products: ProductRow[]): LowStockItem[] {
  const items: LowStockItem[] = [];

  for (const p of products) {
    const st = stockStatus(p.total, p.minStock);
    if (st === "Aman") continue;

    items.push({ name: p.name, stock: p.total, threshold: p.minStock });
    if (items.length >= 10) break;
  }

  return items;
}

/** Bangun storeRequests untuk dashboard (dari In Out Barang, maks 5). */
function buildStoreRequests(inOutRows: InOutRow[]): StoreRequest[] {
  return inOutRows.slice(0, 5).map((row) => ({
    store: row.depoTujuan || "Depo Tujuan",
    item: row.product,
    qty: row.qty,
    status: row.status === "Completed" ? "Terkirim" : "Menunggu",
  }));
}

/** Bangun distributions untuk dashboard (dari In Out Barang, maks 5). */
function buildDistributions(inOutRows: InOutRow[]): DistributionRecord[] {
  return inOutRows.slice(0, 5).map((row) => ({
    date: fmtDate(row.date),
    store: row.depoTujuan || "Depo Tujuan",
    item: row.product,
    qty: row.qty,
    status: row.status === "Completed" ? "Terkirim" : "Dalam Proses",
  }));
}

// ═══════════════════════════════════════════════════════════════
// FUNGSI UTAMA
// ═══════════════════════════════════════════════════════════════

/**
 * parseExcel(buffer)
 * ─────────────────────────────────────────────────────────────
 * Terima Buffer file .xlsx → kembalikan ParsedData.
 *
 * Semua field output cocok PERSIS dengan struktur data yang
 * dipakai di setiap halaman website:
 *   dashboardStats  → dashboard/page.tsx  (stats[])
 *   lowStockItems   → dashboard/page.tsx  (lowStockItems[])
 *   storeRequests   → dashboard/page.tsx  (storeRequests[])
 *   distributions   → dashboard/page.tsx  (distributions[])
 *   stockItems      → stok-produk/page.tsx (initialStockData[])
 *   warehouses      → gudang/page.tsx      (initialWarehouses[])
 *   notifications   → notifikasi/page.tsx  (initialNotifications[])
 *
 * Contoh pemakaian di API route:
 *   const buffer = Buffer.from(await file.arrayBuffer());
 *   const data   = parseExcel(buffer);
 *   return NextResponse.json({ success: true, data });
 */
export function parseExcel(buffer: Buffer): ParsedData {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  // Validasi sheet wajib
  const required = ["SUMMARY PER BO", "In Out Barang"];
  for (const name of required) {
    if (!workbook.SheetNames.includes(name)) {
      throw new Error(
        `Sheet "${name}" tidak ditemukan. ` +
        `Sheet tersedia: ${workbook.SheetNames.join(", ")}`
      );
    }
  }

  // Parse raw data dari kedua sheet
  const products = parseSummaryPerBO(workbook.Sheets["SUMMARY PER BO"]);
  const inOutRows = parseInOutBarang(workbook.Sheets["In Out Barang"]);

  // Referensi waktu = tanggal terakhir di data In Out Barang
  const lastDateMs = inOutRows
    .map((r) => {
      if (!r.date) return 0;
      if (r.date instanceof Date) return r.date.getTime();
      if (typeof r.date === "number") {
        const p = XLSX.SSF.parse_date_code(r.date as number);
        return p ? new Date(p.y, p.m - 1, p.d).getTime() : 0;
      }
      return new Date(String(r.date)).getTime();
    })
    .filter(Boolean)
    .reduce((a, b) => Math.max(a, b), 0);
  const refDate = lastDateMs ? new Date(lastDateMs) : new Date();

  // Bangun data per halaman
  const warehouses = buildWarehouses(products);
  const stockItems = buildStockItems(products);
  enrichStockItemsWithSold(stockItems, inOutRows);

  const dashboardStats = buildDashboardStats(products, warehouses, inOutRows);
  const lowStockItems = buildLowStockItems(products);
  const storeRequests = buildStoreRequests(inOutRows);
  const distributions = buildDistributions(inOutRows);
  const notifications = buildNotifications(products, inOutRows, refDate);

  // Tentukan bulan laporan dari data
  const reportMonth = refDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return {
    dashboardStats,
    lowStockItems,
    storeRequests,
    distributions,
    stockItems,
    warehouses,
    notifications,
    lastUpdated: new Date().toISOString(),
    reportMonth,
    totalProducts: products.length,
    totalDepos: warehouses.length,
  };
}