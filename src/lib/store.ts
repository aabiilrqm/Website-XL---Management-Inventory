/**
 * store.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Path : src/lib/store.ts
 *
 * Layer penyimpanan data berbasis file JSON (server-side only).
 * File disimpan di: <project-root>/data/parsed-data.json
 *
 * Fungsi yang tersedia:
 *   saveData(data: ParsedData)  → tulis ke file JSON
 *   loadData()                  → baca dari file JSON, null jika belum ada
 *   clearData()                 → hapus file (reset)
 *
 * Catatan:
 *   • Modul ini hanya boleh diimpor dari API Route (server-side).
 *     Jangan impor dari komponen React / file "use client".
 *   • `fs` dan `path` tersedia karena Next.js API Route berjalan di Node.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs   from "fs";
import path from "path";

import type { ParsedData } from "@/lib/excel-parser";

// ── Path file penyimpanan ─────────────────────────────────────────────────────
// process.cwd() = root project saat runtime (dev & production)
const DATA_DIR  = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "parsed-data.json");

// ── Pastikan direktori ada ────────────────────────────────────────────────────
function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── Simpan data ───────────────────────────────────────────────────────────────
export function saveData(data: ParsedData): void {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// ── Baca data ─────────────────────────────────────────────────────────────────
export function loadData(): ParsedData | null {
  try {
    if (!fs.existsSync(DATA_FILE)) return null;
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw) as ParsedData;
  } catch {
    return null;
  }
}

// ── Hapus data (reset) ────────────────────────────────────────────────────────
export function clearData(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  } catch {
    // Abaikan error hapus
  }
}

// ── Cek apakah data tersedia ──────────────────────────────────────────────────
export function hasData(): boolean {
  return fs.existsSync(DATA_FILE);
}
