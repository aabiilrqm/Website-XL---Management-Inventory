// Legacy entry point delegates to the same preprocessing used by the upload API.
// node scripts/process-and-save-user-data.js [report.xlsx]
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { parseExcel } = require("./parser-loader.cjs");
const source = process.argv[2] ?? path.resolve(__dirname, "../sample/laporan-stok-user.xlsx");
const data = parseExcel(fs.readFileSync(source), { fileName: path.basename(source) });
const directory = path.resolve(__dirname, "../data");
fs.mkdirSync(directory, { recursive: true });
const temporary = path.join(directory, "parsed-data-" + randomUUID() + ".tmp");
try {
  fs.writeFileSync(temporary, JSON.stringify(data));
  fs.renameSync(temporary, path.join(directory, "parsed-data.json"));
} finally {
  if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
}
console.log("Laporan tersimpan:", data.reportMonth, "·", data.totalProducts, "produk ·", data.totalDepos, "gudang.");
