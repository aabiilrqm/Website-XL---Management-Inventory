import * as XLSX from "xlsx";

export const runtime = "nodejs";
export async function GET() {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["SKU", "Nama Produk", "Brand", "Kategori", "Gudang", "Stok Akhir", "Minimum Stok", "Harga Satuan"],
    ["CONTOH-01", "Produk contoh (ganti atau hapus baris ini)", "XL", "PV", "Makassar", 100, 50, 500],
    ["CONTOH-01", "Produk contoh (ganti atau hapus baris ini)", "XL", "PV", "Maros", 20, 30, 500],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Stok per Gudang");
  const bytes = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-stok.xlsx"',
    },
  });
}
