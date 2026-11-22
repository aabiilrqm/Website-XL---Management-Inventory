import { NextRequest, NextResponse } from "next/server";
import { ImportError, inspectExcel, parseExcel } from "@/lib/excel-parser";
import type { ImportOptions } from "@/lib/excel-parser";
import { archive, authenticated } from "@/lib/report-archive";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const error = (status: number, message: string) => NextResponse.json({ success: false, error: message }, { status });
  if (!await authenticated(request)) return error(401, "Silakan masuk kembali.");
  let form: FormData;
  try { form = await request.formData(); }
  catch { return error(400, "Gunakan multipart/form-data untuk mengupload file."); }
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return error(400, "Pilih file Excel yang tidak kosong.");
  if (!/\.(xlsx|xls)$/i.test(file.name)) return error(400, "Format yang didukung: .xlsx dan .xls.");
  if (file.size > 50 * 1024 * 1024) return error(413, "Ukuran maksimum file adalah 50 MB.");
  const action = form.get("action") ?? "import";
  if (!["inspect", "preview", "import"].includes(String(action))) return error(400, "Aksi impor tidak valid.");
  let options: ImportOptions = { fileName: file.name };
  if (form.get("mapping")) {
    try {
      const decoded = JSON.parse(String(form.get("mapping")));
      const isMapping = (m: unknown) => {
        if (!m || typeof m !== "object") return false;
        const candidate = m as Record<string, unknown>;
        return typeof candidate.sheet === "string" && Number.isInteger(candidate.headerRow) &&
          ["long", "matrix"].includes(String(candidate.layout)) && candidate.columns && typeof candidate.columns === "object" &&
          !Array.isArray(candidate.columns) && Array.isArray(candidate.warehouseColumns) &&
          candidate.warehouseColumns.every(w => w && typeof w === "object" && typeof w.column === "string" && typeof w.warehouse === "string");
      };
      if (!decoded || !isMapping(decoded.stock) || (decoded.movement && !isMapping(decoded.movement))) throw new Error();
      options = { stock: decoded.stock, movement: decoded.movement ?? null, fileName: file.name };
    } catch { return error(400, "Pemetaan kolom tidak valid."); }
  }
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (action === "inspect") return NextResponse.json({ success: true, inspection: inspectExcel(buffer) });
    const data = parseExcel(buffer, options);
    const period = form.get("period");
    if (period) {
      if (typeof period !== "string" || !/^20\d{2}-(0[1-9]|1[0-2])$/.test(period)) return error(422, "Bulan laporan tidak valid.");
      data.reportMonth = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(period + "-01T00:00:00Z"));
    }
    if (action === "import" && data.reportMonth === "Periode tidak diketahui") return error(422, "Pilih bulan laporan sebelum menyimpan.");
    const id = action === "import" ? await archive(data, false, buffer) : undefined;
    return NextResponse.json({ success: true, id, fileName: file.name, data });
  } catch (err) {
    if (err instanceof ImportError) return error(422, err.message);
    console.error("[/api/upload]", err);
    return error(500, "Proses impor gagal. Data sebelumnya tetap tersedia. Periksa file dan coba lagi.");
  }
}
