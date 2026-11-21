// node scripts/preprocess.cjs "report.xlsx" ["output.json"]
const fs = require("node:fs");
const { parseExcel, inspectExcel } = require("./parser-loader.cjs");
const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/preprocess.cjs report.xlsx [output.json]"); process.exit(1); }
const buffer = fs.readFileSync(file);
console.time("preprocessing");
const inspection = inspectExcel(buffer);
console.log("Detected:", JSON.stringify({ stock: inspection.suggestedStock, movement: inspection.suggestedMovement }));
const data = parseExcel(buffer, { stock: inspection.suggestedStock ?? undefined, movement: inspection.suggestedMovement, fileName: require("node:path").basename(file) });
console.timeEnd("preprocessing");
console.log(JSON.stringify({ period: data.reportMonth, products: data.totalProducts, warehouses: data.totalDepos, records: data.stockItems.length,
  total: data.stockItems.reduce((a, s) => a + (s.stock ?? 0), 0), transfers: data.movements.length,
  quality: { ...data.preprocessing, issues: data.preprocessing.issues.slice(0, 8) } }, null, 2));
if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(data, null, 2));
