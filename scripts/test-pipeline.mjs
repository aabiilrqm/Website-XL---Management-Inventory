/**
 * scripts/test-pipeline.mjs
 * Testing script using standard ES module in Node.js
 */

import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🧪 Menyiapkan Sample File Excel & Mengetes Parser...\n");

// 1. Buat Mock Workbook Excel sesuai struktur spesifikasi XL
const wb = XLSX.utils.book_new();

// Sheet 1: SUMMARY PER BO (Header di baris ke-4 / index 3)
const summaryData = [
  ["LAPORAN STOK FISIK XL"],
  ["WILAYAH SULAWESI SELATAN"],
  [], // Baris kosong
  // Header tabel (index 3)
  [
    "SP/PV",
    "BRAND",
    "NAMA PRODUK",
    "Harga Satuan",
    "MAKASSAR",
    "Maros",
    "BULUKUMBA",
    "BONE",
    "PARE-PARE",
    "PALOPO",
    "LUTIM",
    "WONOMULYO",
    "KENDARI",
    "BOMBANA",
    "TOTAL",
  ],
  // Data produk 1
  [
    "PV",
    "XL",
    "VD Unlimited Harian 2GB 28H",
    50000,
    1200,
    400,
    300,
    250,
    150,
    100,
    80,
    90,
    200,
    110,
    2880,
  ],
  // Data produk 2
  [
    "SP",
    "XL",
    "Kartu Perdana XL 12GB",
    35000,
    500,
    150,
    80,
    60,
    40,
    30,
    20,
    25,
    50,
    45,
    1000,
  ],
  // Data produk 3
  [
    "PV",
    "XL",
    "VD Kuota 5GB 30H",
    45000,
    25,
    10,
    5,
    15,
    30,
    12,
    8,
    4,
    10,
    6,
    125,
  ],
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
XLSX.utils.book_append_sheet(wb, wsSummary, "SUMMARY PER BO");

// Sheet 2: In Out Barang (Header di baris ke-2 / index 1)
const inOutData = [
  ["LOG DISTRIBUSI BARANG"],
  // Header (index 1)
  [
    "TGL.1",
    "DEPO ASAL",
    "DEPO TUJUAN",
    "Produk Name",
    "QTY.1",
    "Remark",
    "Status PO XL",
  ],
  // Data riwayat
  [
    "2026-04-20",
    "MAKASSAR",
    "MAROS",
    "VD Unlimited Harian 2GB 28H",
    200,
    "TF STOK",
    "Completed",
  ],
  [
    "2026-04-22",
    "MAKASSAR",
    "BULUKUMBA",
    "Kartu Perdana XL 12GB",
    100,
    "PO XLSMART",
    "Completed",
  ],
  [
    "2026-04-24",
    "MAKASSAR",
    "GOWA",
    "VD Kuota 5GB 30H",
    50,
    "TF STOK",
    "Pending",
  ],
];

const wsInOut = XLSX.utils.aoa_to_sheet(inOutData);
XLSX.utils.book_append_sheet(wb, wsInOut, "In Out Barang");

// Simpan file sample
const sampleDir = path.join(rootDir, "sample");
if (!fs.existsSync(sampleDir)) fs.mkdirSync(sampleDir, { recursive: true });
const sampleFilePath = path.join(sampleDir, "sample-stok-xl.xlsx");

XLSX.writeFile(wb, sampleFilePath);
console.log(`✅ File sample Excel berhasil dibuat di:`);
console.log(`   👉 ${sampleFilePath}\n`);
