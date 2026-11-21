/**
 * route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Path : src/app/api/data/route.ts
 *
 * GET  /api/data          → kembalikan seluruh ParsedData dari file JSON
 * DELETE /api/data        → hapus data (reset ke dummy / kosong)
 *
 * ─── Response GET sukses (200) ───────────────────────────────────────────────
 * {
 *   success  : true,
 *   source   : "file" | "empty",
 *   data     : ParsedData | null
 * }
 *
 * ─── Response DELETE sukses (200) ────────────────────────────────────────────
 * { success: true, message: "Data berhasil direset." }
 *
 * ─── Response error (500) ────────────────────────────────────────────────────
 * { success: false, error: string }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { loadData, clearData, hasData } from "@/lib/store";

// ── GET /api/data ─────────────────────────────────────────────────────────────
export async function GET() {
  try {
    if (!hasData()) {
      return NextResponse.json(
        { success: true, source: "empty", data: null },
        { status: 200 }
      );
    }

    const data = loadData();
    return NextResponse.json(
      { success: true, source: "file", data },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal membaca data.";
    console.error("[GET /api/data]", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ── DELETE /api/data ──────────────────────────────────────────────────────────
export async function DELETE() {
  try {
    clearData();
    return NextResponse.json(
      { success: true, message: "Data berhasil direset." },
      { status: 200 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus data.";
    console.error("[DELETE /api/data]", err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
