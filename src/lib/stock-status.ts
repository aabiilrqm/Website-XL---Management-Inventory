import type { StockStatus } from "./excel-parser";

export function stockStatus(stock: number | null, minimum: number | null): StockStatus {
  if (stock === null || stock < 0) return "Periksa";
  if (stock === 0) return "Habis";
  if (minimum === null) return "Belum dinilai";
  return stock < minimum * 0.3 ? "Kritis" : stock < minimum ? "Menipis" : "Aman";
}
