const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const DEPO_EXCEL_COLS = [
  "MAKASSAR", "Maros", "BULUKUMBA", "BONE",
  "PARE-PARE", "PALOPO", "LUTIM", "WONOMULYO",
  "KENDARI", "BOMBANA",
];

const DEPO_DISPLAY = {
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

const DEPO_INFO = {
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

function toNum(val, fallback = 0) {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : Math.max(0, n);
}

function calcMinStock(type, name) {
  const upper = (name ?? "").toUpperCase();
  if (upper.includes("KOSONG")) return 50000;
  if (type === "SP") return 1000;
  return 300;
}

function stockStatus(stock, min) {
  if (stock <= 0) return "Habis";
  if (stock < min * 0.3) return "Kritis";
  if (stock < min) return "Menipis";
  return "Aman";
}

function fmtNum(n) {
  return n.toLocaleString("id-ID");
}

function fmtDate(val) {
  if (!val) return "-";
  let d;
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

function relativeTime(val, refDate) {
  if (!val) return "-";
  let d;
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
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffDay >= 1) return `${diffDay} hari lalu`;
  if (diffHr >= 1) return `${diffHr} jam lalu`;
  if (diffMin >= 1) return `${diffMin} menit lalu`;
  return "Baru saja";
}

const filePath = path.join(__dirname, "..", "sample", "laporan-stok-user.xlsx");
console.log("Membaca file Excel user:", filePath);

const workbook = XLSX.readFile(filePath, { cellDates: true });

// 1. Parse SUMMARY PER BO
const wsSummary = workbook.Sheets["SUMMARY PER BO"];
const rowsSummary = XLSX.utils.sheet_to_json(wsSummary, { range: 3, defval: 0 });
const products = [];

for (const row of rowsSummary) {
  const spPv = String(row["SP/PV"] ?? "").trim();
  if (!spPv || spPv === "0" || spPv === "NaN") continue;

  const name = String(row["NAMA PRODUK"] ?? "").trim();
  if (!name || name === "0") continue;

  const brand = String(row["BRAND"] ?? "").trim();
  const price = toNum(row["Harga Satuan"]);

  const stockByDepo = {};
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

// 2. Parse In Out Barang
const wsInOut = workbook.Sheets["In Out Barang"];
const rowsInOut = XLSX.utils.sheet_to_json(wsInOut, { range: 1, defval: "" });
const inOutRows = [];

for (const row of rowsInOut) {
  const product = String(row["Produk Name"] ?? "").trim();
  const qty = toNum(row["QTY_1"] ?? row["QTY.1"] ?? row["QTY"]);
  if (!product || qty === 0) continue;

  inOutRows.push({
    date: row["TGL_1"] ?? row["TGL.1"] ?? row["TGL"],
    depoAsal: String(row["DEPO ASAL"] ?? "").trim(),
    depoTujuan: String(row["DEPO TUJUAN"] ?? "").trim(),
    product,
    qty,
    remark: String(row["Remark"] ?? "").trim(),
    status: String(row["Status PO XL"] ?? "").trim(),
  });
}

// Ref date
const refDate = new Date("2026-04-30");

// Build Warehouses
const stockByDepo = {};
for (const col of Object.values(DEPO_DISPLAY)) stockByDepo[col] = 0;
for (const p of products) {
  for (const [depo, stock] of Object.entries(p.stockByDepo)) {
    stockByDepo[depo] = (stockByDepo[depo] ?? 0) + stock;
  }
}

const warehouses = Object.values(DEPO_DISPLAY).map((depo, idx) => {
  const info = DEPO_INFO[depo] || { location: `Wilayah ${depo}`, phone: "-", manager: "-" };
  const stockCount = stockByDepo[depo] || 0;
  return {
    id: idx + 1,
    name: `Gudang ${depo}`,
    location: info.location,
    phone: info.phone,
    manager: info.manager,
    stockCount,
    active: stockCount > 0,
  };
});

// Build Stock Items
let itemId = 1;
const stockItems = [];
for (const p of products) {
  for (const [depo, stock] of Object.entries(p.stockByDepo)) {
    if (stock <= 0) continue;
    stockItems.push({
      id: itemId++,
      product: p.name,
      warehouse: depo,
      stock,
      minStock: p.minStock,
      sold: 0,
      status: stockStatus(stock, p.minStock),
      price: p.price,
    });
  }
}

// Enrich sold
const soldMap = new Map();
for (const row of inOutRows) {
  if (row.status !== "Completed") continue;
  const key = `${row.product.trim().toLowerCase()}||${row.depoAsal.toUpperCase()}`;
  soldMap.set(key, (soldMap.get(key) || 0) + row.qty);
}
for (const item of stockItems) {
  const key = `${item.product.trim().toLowerCase()}||${item.warehouse.toUpperCase()}`;
  item.sold = soldMap.get(key) || 0;
}

// Dashboard stats
const totalStock = products.reduce((s, p) => s + p.total, 0);
const activeDepos = warehouses.filter((w) => w.active).length;
const distTotal = inOutRows
  .filter((r) => r.status === "Completed")
  .reduce((s, r) => s + r.qty, 0);
const pendingCount = inOutRows.filter((r) => r.status !== "Completed").length;

const dashboardStats = [
  {
    title: "Total Stok Gudang",
    value: fmtNum(totalStock),
    description: "Unit tersedia di seluruh gudang Sulawesi",
  },
  {
    title: "Gudang Aktif",
    value: fmtNum(activeDepos),
    description: "Depo dengan stok tersedia",
  },
  {
    title: "Distribusi Bulan Ini",
    value: fmtNum(distTotal),
    description: "Unit yang telah didistribusikan",
  },
  {
    title: "Request Masuk",
    value: fmtNum(pendingCount),
    description: "Menunggu persetujuan admin",
  },
];

// Low stock items
const lowStockItems = [];
for (const p of products) {
  const st = stockStatus(p.total, p.minStock);
  if (st !== "Aman") {
    lowStockItems.push({ name: p.name, stock: p.total, threshold: p.minStock });
    if (lowStockItems.length >= 10) break;
  }
}

// Store requests & distributions
const storeRequests = inOutRows.slice(0, 5).map((row) => ({
  store: row.depoTujuan || "Depo Tujuan",
  item: row.product,
  qty: row.qty,
  status: row.status === "Completed" ? "Terkirim" : "Menunggu",
}));

const distributions = inOutRows.slice(0, 5).map((row) => ({
  date: fmtDate(row.date),
  store: row.depoTujuan || "Depo Tujuan",
  item: row.product,
  qty: row.qty,
  status: row.status === "Completed" ? "Terkirim" : "Dalam Proses",
}));

// Notifications
let notifId = 1;
const notifications = [];
for (const p of products) {
  for (const [depo, stock] of Object.entries(p.stockByDepo)) {
    if (stock <= 0) continue;
    const st = stockStatus(stock, p.minStock);
    if (st !== "Kritis" && st !== "Menipis") continue;
    notifications.push({
      id: notifId++,
      type: "alert",
      title: st === "Kritis" ? "Peringatan Stok Kritis" : "Peringatan Stok Menipis",
      message: `Stok ${p.name} di Gudang ${depo} tersisa ${fmtNum(stock)} pcs`,
      time: "Baru saja",
      status: st === "Kritis" ? "critical" : "warning",
      from: `Gudang ${depo}`,
      product: p.name,
      quantity: stock,
    });
  }
}

for (const row of inOutRows.filter((r) => r.status === "Completed").slice(0, 20)) {
  notifications.push({
    id: notifId++,
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

const parsedData = {
  dashboardStats,
  lowStockItems,
  storeRequests,
  distributions,
  stockItems,
  warehouses,
  notifications,
  lastUpdated: new Date().toISOString(),
  reportMonth: "April 2026",
  totalProducts: products.length,
  totalDepos: warehouses.length,
};

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "parsed-data.json"), JSON.stringify(parsedData, null, 2));

console.log("==========================================");
console.log("✅ DATASET USER BERHASIL DIPROSES & DISIMPAN!");
console.log("==========================================");
console.log(`- Bulan Laporan   : ${parsedData.reportMonth}`);
console.log(`- Total Produk    : ${parsedData.totalProducts} produk`);
console.log(`- Total Gudang    : ${parsedData.totalDepos} depo`);
console.log(`- Total Stok Fisik: ${parsedData.dashboardStats[0].value} unit`);
console.log(`- Distribusi Total: ${parsedData.dashboardStats[2].value} unit`);
console.log(`- Item Alert Rendah: ${parsedData.lowStockItems.length} produk`);
console.log(`- File tersimpan di: data/parsed-data.json`);
