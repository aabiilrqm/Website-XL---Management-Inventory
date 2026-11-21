/**
 * route.ts
 * ─────────────────────────────────────────────────────────────
 * Path  : src/app/api/upload/route.ts
 *
 * Endpoint  : POST /api/upload
 * Body      : multipart/form-data, field name = "file"
 * File      : .xlsx laporan stok fisik XL
 *
 * ─── Response sukses (200) ────────────────────────────────────
 * {
 *   success: true,
 *   fileName: string,
 *   data: {
 *     dashboardStats   : DashboardStat[]   → dashboard/page.tsx
 *     lowStockItems    : LowStockItem[]    → dashboard/page.tsx
 *     storeRequests    : StoreRequest[]    → dashboard/page.tsx
 *     distributions    : DistributionRecord[] → dashboard/page.tsx
 *     stockItems       : StockItem[]       → stok-produk/page.tsx
 *     warehouses       : Warehouse[]       → gudang/page.tsx
 *     notifications    : Notification[]    → notifikasi/page.tsx
 *     lastUpdated      : string (ISO)
 *     reportMonth      : string ("April 2026")
 *     totalProducts    : number
 *     totalDepos       : number
 *   }
 * }
 *
 * ─── Response error (400 / 500) ───────────────────────────────
 * { success: false, error: string }
 *
 * ─── Contoh fetch dari frontend ───────────────────────────────
 * const form = new FormData();
 * form.append("file", fileInputRef.current.files[0]);
 *
 * const res  = await fetch("/api/upload", { method: "POST", body: form });
 * const json = await res.json();
 *
 * if (json.success) {
 *   const {
 *     dashboardStats, lowStockItems, storeRequests, distributions,
 *     stockItems, warehouses, notifications
 *   } = json.data;
 *
 *   // → set ke state/context masing-masing halaman
 * }
 *
 * ─────────────────────────────────────────────────────────────
 * CATATAN next.config.ts — tambahkan jika file > 4MB:
 *
 * const nextConfig = {
 *   experimental: {
 *     serverActions: { bodySizeLimit: "50mb" },
 *   },
 * };
 * export default nextConfig;
 * ─────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { parseExcel } from "@/lib/excel-parser";
import { saveData } from "@/lib/store";

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  // ── 1. Baca form data ────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return error(400, "Gagal membaca form data. Pastikan request menggunakan multipart/form-data.");
  }

  // ── 2. Ambil file ────────────────────────────────────────────
  const file = formData.get("file");

  if (!file) {
    return error(400, 'Field "file" tidak ditemukan dalam request.');
  }
  if (!(file instanceof File)) {
    return error(400, 'Field "file" bukan file yang valid.');
  }

  // ── 3. Validasi ekstensi ─────────────────────────────────────
  const name = file.name.toLowerCase();
  if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
    return error(400, `Format tidak didukung: "${file.name}". Hanya menerima .xlsx atau .xls.`);
  }

  // ── 4. Validasi ukuran ───────────────────────────────────────
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return error(400, `File terlalu besar (${sizeMB} MB). Maksimum: ${MAX_FILE_SIZE_MB} MB.`);
  }

  // ── 5. Parse ─────────────────────────────────────────────────
  let data;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    data = parseExcel(buffer);
    // ── Persist data ke file JSON ─────────────────────────────
    saveData(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Kesalahan tidak dikenal saat memproses file.";
    console.error("[/api/upload]", err);
    return error(500, `Gagal memproses file: ${msg}`);
  }

  // ── 6. Kembalikan hasil ──────────────────────────────────────
  return NextResponse.json(
    { success: true, fileName: file.name, data },
    { status: 200 }
  );
}

// Helper: buat response error
function error(status: number, message: string) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// Nonaktifkan body parser bawaan Next.js
export const config = { api: { bodyParser: false } };