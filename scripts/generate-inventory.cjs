#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports -- Entry point .cjs menggunakan modul CommonJS Node.js. */
// Jalankan dari folder proyek: npm run generate:data -- --products 100 --warehouses 5
// Gunakan --help untuk daftar opsi atau --config untuk konfigurasi JSON.
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const projectRoot = path.resolve(__dirname, "..");
const defaultWarehouses = ["MAKASSAR", "MAROS", "BULUKUMBA", "BONE", "PARE-PARE", "PALOPO", "LUTIM", "WONOMULYO", "KENDARI", "BOMBANA"];
const optionNames = {
  products: "products", warehouses: "warehouses", brands: "brands", categories: "categories", period: "period",
  "stock-min": "stockMin", "stock-max": "stockMax", "min-stock": "minStock",
  "price-min": "priceMin", "price-max": "priceMax", "empty-percent": "emptyPercent",
  "low-percent": "lowPercent", "critical-percent": "criticalPercent", "empty-warehouses": "emptyWarehouses",
  seed: "seed", format: "format", output: "output",
};
const help = `Generator file Excel simulasi stok inventory.

  npm run generate:data -- [opsi]
  node scripts/generate-inventory.cjs --config scripts/inventory-generator.example.json

  --products N              Jumlah produk unik (default: 24)
  --warehouses N            Jumlah gudang (default: 10), atau nama dipisahkan koma
  --brands XL,AXIS          Daftar merek (default: XL,AXIS,SMARTFREN)
  --categories SP,PV        Daftar kategori (default: SP,PV)
  --period "November 2026"   Periode bulan dan tahun (default: bulan ini, Asia/Makassar)
  --stock-min N             Batas bawah stok aman (default: 100)
  --stock-max N             Batas atas stok aman (default: 2000)
  --min-stock N             Minimum stok per produk/gudang (default: 100, minimal 4)
  --price-min N             Harga satuan terendah, rupiah (default: 500)
  --price-max N             Harga satuan tertinggi, rupiah (default: 100000)
  --empty-percent N         Peluang stok nol, 0-100 (default: 15)
  --low-percent N           Peluang stok menipis, 0-100 (default: 20)
  --critical-percent N      Peluang stok kritis, 0-100 (default: 10)
  --empty-warehouses NAMA   Nama gudang yang selalu kosong, dipisahkan koma
  --seed N                  Angka acak tetap, 0-4294967295 (default: 42)
  --format matrix|long      Gudang sebagai kolom / satu baris per produk-gudang
  --output PATH.xlsx        Tujuan file, relatif terhadap folder proyek
  --config PATH.json        Baca konfigurasi JSON; opsi CLI mengalahkan JSON
  --force                   Timpa file tujuan yang sudah ada
  --help                    Tampilkan bantuan

Jumlah catatan stok = jumlah produk x jumlah gudang.
Peluang status diterapkan per catatan; sisanya menjadi stok aman.
stock-min/max berlaku pada stok aman. Stok menipis/kritis mengikuti min-stock.
File dibuat lokal dan tidak mengganti laporan yang sedang digunakan website.
`;

function currentPeriod() {
  const value = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Makassar" }).format(new Date());
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    const raw = args[i];
    if (!raw.startsWith("--")) throw new Error(`Argumen tidak dikenal: ${raw}. Gunakan --help.`);
    const equal = raw.indexOf("=");
    const name = raw.slice(2, equal < 0 ? undefined : equal);
    if (["force", "help"].includes(name)) {
      if (equal >= 0) throw new Error(`--${name} tidak menerima nilai.`);
      result[name] = true;
      continue;
    }
    if (name !== "config" && !Object.hasOwn(optionNames, name)) throw new Error(`Opsi tidak dikenal: --${name}. Gunakan --help.`);
    const value = equal >= 0 ? raw.slice(equal + 1) : args[++i];
    if (value === undefined || value === "" || value.startsWith("--")) throw new Error(`Isi nilai untuk --${name}.`);
    result[name === "config" ? "config" : optionNames[name]] = value;
  }
  return result;
}
function number(value, name, min, max, integer = true) {
  if ((typeof value !== "number" && typeof value !== "string") || String(value).trim() === "") throw new Error(`${name} harus berupa angka.`);
  const n = Number(value);
  if (!Number.isFinite(n) || (integer && !Number.isSafeInteger(n)) || n < min || n > max) {
    throw new Error(`${name} harus ${integer ? "bilangan bulat" : "angka"} antara ${min} dan ${max}.`);
  }
  return n;
}
function list(value, name, allowEmpty = false) {
  const values = typeof value === "string" ? (value.trim() ? value.split(",") : []) : value;
  if (!Array.isArray(values) || (!allowEmpty && !values.length) || values.some(v => typeof v !== "string" || !v.trim())) throw new Error(`${name} harus berupa daftar nama yang tidak kosong.`);
  return values.map(v => v.replace(/\s+/g, " ").trim().toUpperCase());
}
function warehouseName(value) {
  const name = value.replace(/^(GUDANG|DEPO|WAREHOUSE)\s*[:\-]?\s+/i, "").trim();
  return ({ PARE: "PARE-PARE", PAREPARE: "PARE-PARE", "PARE PARE": "PARE-PARE", "LUWU TIMUR": "LUTIM" })[name] ?? name;
}
function unique(values, name) {
  if (new Set(values).size !== values.length) throw new Error(`${name} berisi nama duplikat.`);
  return values;
}
function normalize(options) {
  const defaults = {
    products: 24, warehouses: 10, brands: ["XL", "AXIS", "SMARTFREN"], categories: ["SP", "PV"], period: currentPeriod(),
    stockMin: 100, stockMax: 2000, minStock: 100, priceMin: 500, priceMax: 100000,
    emptyPercent: 15, lowPercent: 20, criticalPercent: 10, emptyWarehouses: [], seed: 42, format: "matrix", force: false,
  };
  for (const name of Object.keys(options)) {
    if (!Object.hasOwn(defaults, name) && name !== "output") throw new Error(`Properti konfigurasi tidak dikenal: ${name}.`);
  }
  const c = { ...defaults, ...options };
  c.products = number(c.products, "products", 1, 100000);
  c.seed = number(c.seed, "seed", 0, 4294967295);
  for (const key of ["stockMin", "stockMax", "priceMin", "priceMax"]) c[key] = number(c[key], key, 0, 100000000);
  c.minStock = number(c.minStock, "minStock", 4, 100000000);
  for (const key of ["emptyPercent", "lowPercent", "criticalPercent"]) c[key] = number(c[key], key, 0, 100, false);
  if (c.emptyPercent + c.lowPercent + c.criticalPercent > 100) throw new Error("Jumlah peluang stok habis, menipis, dan kritis tidak boleh melebihi 100%.");
  if (c.stockMin > c.stockMax || c.stockMax < c.minStock) throw new Error("stockMax harus >= stockMin dan >= minStock.");
  if (c.priceMin > c.priceMax) throw new Error("priceMax harus >= priceMin.");
  if (typeof c.warehouses === "number" || (typeof c.warehouses === "string" && /^\d+$/.test(c.warehouses))) {
    const count = number(c.warehouses, "warehouses", 1, 1000);
    c.warehouses = Array.from({ length: count }, (_, i) => defaultWarehouses[i] ?? `CABANG ${i + 1}`);
  } else c.warehouses = list(c.warehouses, "warehouses");
  c.warehouses = unique(c.warehouses.map(warehouseName), "warehouses");
  if (!c.warehouses.length || c.warehouses.length > 1000 || c.products * c.warehouses.length > 1000000) throw new Error("Gunakan 1-1000 gudang dan maksimal 1.000.000 catatan produk x gudang.");
  c.brands = unique(list(c.brands, "brands"), "brands");
  c.categories = unique(list(c.categories, "categories"), "categories");
  c.emptyWarehouses = unique(list(c.emptyWarehouses, "emptyWarehouses", true).map(warehouseName), "emptyWarehouses");
  for (const name of c.emptyWarehouses) if (!c.warehouses.includes(name)) throw new Error(`Gudang kosong tidak ditemukan dalam daftar gudang: ${name}.`);
  if (!["matrix", "long"].includes(c.format)) throw new Error("format harus matrix atau long.");
  if (typeof c.force !== "boolean") throw new Error("force harus true atau false.");
  const months = "Januari Februari Maret April Mei Juni Juli Agustus September Oktober November Desember".split(" ");
  const match = typeof c.period === "string" && c.period.trim().match(/^(\S+)\s+(20\d{2})$/);
  const month = match && months.find(m => m.toLowerCase() === match[1].toLowerCase());
  if (!month) throw new Error('period harus bulan Indonesia dan tahun 2000-2099, misalnya "November 2026".');
  c.period = `${month} ${match[2]}`;
  c.output ??= `src/lib/data/simulasi-stok-${c.period.toLowerCase().replace(/\s+/g, "-")}.xlsx`;
  if (typeof c.output !== "string" || !c.output.trim() || path.extname(c.output).toLowerCase() !== ".xlsx") throw new Error("output harus berupa path file .xlsx.");
  c.output = path.resolve(projectRoot, c.output);
  return c;
}
// Seed yang sama dan konfigurasi yang sama menghasilkan nilai data yang sama.
function randomWithSeed(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
function generateWorkbook(c) {
  const random = randomWithSeed(c.seed);
  const integer = (min, max) => min + Math.floor(random() * (max - min + 1));
  const summary = { period: c.period, products: c.products, warehouses: c.warehouses.length, records: c.products * c.warehouses.length, totalStock: 0, totalValue: 0, statuses: { Aman: 0, Menipis: 0, Kritis: 0, Habis: 0 } };
  const heading = ["SP/PV", "BRAND", "P/NP", "PRODUCT ID", "NAMA PRODUK"];
  const matrix = c.format === "matrix";
  const totalColumn = 5 + c.warehouses.length;
  const headers = matrix ? [...heading, ...c.warehouses.map(name => `Gudang ${name}`), "TOTAL", "Harga Satuan", "Total Amount", "Minimum Stok"]
    : [...heading, "Gudang", "Stok Akhir", "Minimum Stok", "Harga Satuan", "Total Amount"];
  const rows = [["LAPORAN STOK PHYSICAL"], [`Periode: ${c.period}`], ["Data simulasi untuk uji unggah. Produk, harga, dan jumlah stok merupakan contoh."], headers];
  const totals = c.warehouses.map(() => 0);
  for (let i = 0; i < c.products; i++) {
    const brand = c.brands[i % c.brands.length];
    const category = c.categories[Math.floor(i / c.brands.length) % c.categories.length];
    const id = `DEMO-${String(i + 1).padStart(6, "0")}`;
    const name = `${category === "PV" ? "Voucher" : category} ${brand} Paket ${[3, 5, 8, 12, 20, 30][i % 6]}GB ${[3, 7, 14, 30][i % 4]} Hari ${String(i + 1).padStart(4, "0")}`;
    const price = integer(c.priceMin, c.priceMax);
    const stocks = c.warehouses.map((warehouse, index) => {
      const chance = random() * 100;
      let stock, status;
      if (c.emptyWarehouses.includes(warehouse) || chance < c.emptyPercent) { stock = 0; status = "Habis"; }
      else if (chance < c.emptyPercent + c.criticalPercent) { stock = integer(1, Math.ceil(c.minStock * 0.3) - 1); status = "Kritis"; }
      else if (chance < c.emptyPercent + c.criticalPercent + c.lowPercent) { stock = integer(Math.ceil(c.minStock * 0.3), c.minStock - 1); status = "Menipis"; }
      else { stock = integer(Math.max(c.stockMin, c.minStock), c.stockMax); status = "Aman"; }
      summary.statuses[status]++;
      totals[index] += stock;
      return stock;
    });
    const total = stocks.reduce((sum, stock) => sum + stock, 0);
    summary.totalStock += total;
    summary.totalValue += total * price;
    if (!Number.isSafeInteger(summary.totalValue)) throw new Error("Nilai total melampaui presisi angka. Kurangi jumlah data, stok, atau harga.");
    const fields = [category, brand, "NP", id, name];
    if (matrix) {
      const row = rows.length + 1;
      const totalRef = XLSX.utils.encode_col(totalColumn);
      const priceRef = XLSX.utils.encode_col(totalColumn + 1);
      rows.push([...fields, ...stocks, { t: "n", f: `SUM(F${row}:${XLSX.utils.encode_col(totalColumn - 1)}${row})`, v: total }, price,
        { t: "n", f: `${totalRef}${row}*${priceRef}${row}`, v: total * price }, c.minStock]);
    } else {
      stocks.forEach((stock, j) => {
        const row = rows.length + 1;
        rows.push([...fields, c.warehouses[j], stock, c.minStock, price, { t: "n", f: `G${row}*I${row}`, v: stock * price }]);
      });
    }
  }
  const lastDataRow = rows.length;
  if (matrix) {
    const footer = Array(headers.length).fill(null);
    footer[4] = "GRAND TOTAL";
    for (let j = 0; j < totals.length; j++) footer[5 + j] = { t: "n", f: `SUM(${XLSX.utils.encode_col(5 + j)}5:${XLSX.utils.encode_col(5 + j)}${lastDataRow})`, v: totals[j] };
    footer[totalColumn] = { t: "n", f: `SUM(${XLSX.utils.encode_col(totalColumn)}5:${XLSX.utils.encode_col(totalColumn)}${lastDataRow})`, v: summary.totalStock };
    footer[totalColumn + 2] = { t: "n", f: `SUM(${XLSX.utils.encode_col(totalColumn + 2)}5:${XLSX.utils.encode_col(totalColumn + 2)}${lastDataRow})`, v: summary.totalValue };
    rows.push(footer);
  }
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = headers.map((_, i) => ({ wch: i === 4 ? 55 : i === 3 ? 20 : 18 }));
  sheet["!merges"] = [0, 1, 2].map(r => ({ s: { r, c: 0 }, e: { r, c: headers.length - 1 } }));
  sheet["!autofilter"] = { ref: `A4:${XLSX.utils.encode_col(headers.length - 1)}${lastDataRow}` };
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith("!")) continue;
    if (cell.t === "n") {
      const column = XLSX.utils.decode_cell(address).c;
      const money = matrix ? column === totalColumn + 1 || column === totalColumn + 2 : column === 8 || column === 9;
      cell.z = money ? '"Rp "#,##0' : "#,##0";
    }
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, matrix ? "SUMMARY PER BO" : "Stok per Gudang");
  return { workbook, summary };
}
function main(args) {
  const cli = parseArgs(args);
  if (cli.help) { console.log(help); return; }
  let config = {};
  if (cli.config) {
    config = JSON.parse(fs.readFileSync(path.resolve(cli.config), "utf8"));
    if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Konfigurasi JSON harus berupa objek.");
  }
  delete cli.config;
  const c = normalize({ ...config, ...cli });
  const { workbook, summary } = generateWorkbook(c);
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx", compression: true });
  if (bytes.length > 50 * 1024 * 1024) throw new Error("Ukuran file melebihi batas unggah 50 MB. Kurangi jumlah data.");
  fs.mkdirSync(path.dirname(c.output), { recursive: true });
  try { fs.writeFileSync(c.output, bytes, { flag: c.force ? "w" : "wx" }); }
  catch (error) { if (error.code === "EEXIST") throw new Error("File tujuan sudah ada. Ganti --output atau tambahkan --force untuk menimpanya."); throw error; }
  console.log(JSON.stringify({ file: c.output, format: c.format, seed: c.seed, ...summary }, null, 2));
}
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(`Gagal membuat data: ${error.message}`); process.exitCode = 1; }
}
module.exports = { normalize, generateWorkbook, parseArgs };
