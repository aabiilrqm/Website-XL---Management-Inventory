/* eslint-disable @typescript-eslint/no-require-imports -- Pengujian Node.js untuk script CommonJS .cjs. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { inspectExcel, parseExcel } = require("./parser-loader.cjs");
const { normalize, parseArgs } = require("./generate-inventory.cjs");

const root = path.resolve(__dirname, "..");
const script = path.join(__dirname, "generate-inventory.cjs");
function tempTest(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xl-generator-"));
  try { run(dir); }
  finally {
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep + "xl-generator-"));
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
function execute(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
}
function read(file) {
  const bytes = fs.readFileSync(file);
  const inspection = inspectExcel(bytes);
  assert.ok(inspection.suggestedStock);
  return parseExcel(bytes, { stock: inspection.suggestedStock, movement: null, fileName: path.basename(file) });
}
function reconcile(data, summary) {
  assert.equal(data.totalProducts, summary.products);
  assert.equal(data.totalDepos, summary.warehouses);
  assert.equal(data.stockItems.length, summary.records);
  assert.equal(data.reportMonth, summary.period);
  assert.equal(data.stockItems.reduce((sum, row) => sum + row.stock, 0), summary.totalStock);
  assert.equal(data.stockItems.reduce((sum, row) => sum + row.stock * row.price, 0), summary.totalValue);
  const counts = { Aman: 0, Menipis: 0, Kritis: 0, Habis: 0 };
  for (const row of data.stockItems) counts[row.status]++;
  assert.deepEqual(counts, summary.statuses);
  assert.equal(data.preprocessing.issueCount, 0);
  assert.equal(data.preprocessing.totalMismatches, 0);
}

test("matrix CLI handles columns beyond Z, unique products and an empty warehouse", () => tempTest(dir => {
  const file = path.join(dir, "matrix.xlsx");
  const result = execute(["--products", "65", "--warehouses", "25", "--period", "Desember 2026", "--empty-warehouses", "Bombana", "--output", file]);
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  const data = read(file);
  reconcile(data, summary);
  assert.equal(data.stockItems.length, 1625);
  assert.equal(new Set(data.stockItems.map(row => row.sku)).size, 65);
  assert.ok(data.stockItems.filter(row => row.warehouse === "BOMBANA").every(row => row.stock === 0));
  assert.ok(Object.values(summary.statuses).every(count => count > 0));
}));

test("JSON config and CLI overrides support one product at new warehouse locations", () => tempTest(dir => {
  const config = path.join(dir, "config.json");
  const file = path.join(dir, "long.xlsx");
  fs.writeFileSync(config, JSON.stringify({ products: 20, warehouses: ["Gudang Gowa", "Takalar"], format: "long", brands: ["MEREK UJI"], categories: ["PV"], minStock: 4, stockMin: 4, stockMax: 4, period: "Januari 2027", output: file }));
  const result = execute(["--config", config, "--products=1"]);
  assert.equal(result.status, 0, result.stderr);
  const data = read(file);
  reconcile(data, JSON.parse(result.stdout));
  assert.equal(data.totalProducts, 1);
  assert.deepEqual(data.stockItems.map(row => row.warehouse), ["GOWA", "TAKALAR"]);
  assert.ok(data.stockItems.every(row => row.brand === "MEREK UJI" && row.category === "PV"));
  const matrix = path.join(dir, "single-matrix.xlsx");
  assert.equal(execute(["--products", "1", "--warehouses", "Gowa,Takalar", "--output", matrix]).status, 0);
  assert.equal(read(matrix).totalDepos, 2);
}));

test("same seed reproduces data; overwrite requires force; changed seed changes stocks", () => tempTest(dir => {
  const file = path.join(dir, "seed.xlsx");
  const args = ["--products", "15", "--seed", "99", "--output", file];
  assert.equal(execute(args).status, 0);
  const beforeBytes = fs.readFileSync(file);
  const before = read(file).stockItems;
  assert.equal(execute(args).status, 1);
  assert.deepEqual(fs.readFileSync(file), beforeBytes);
  assert.equal(execute([...args, "--force"]).status, 0);
  assert.deepEqual(read(file).stockItems, before);
  assert.equal(execute([...args, "--seed", "100", "--force"]).status, 0);
  assert.notDeepEqual(read(file).stockItems.map(row => row.stock), before.map(row => row.stock));
}));

test("invalid counts, ranges, rates, names and unknown options are rejected", () => {
  for (const config of [
    { products: 0 }, { products: 1.5 }, { warehouses: [] }, { warehouses: ["Pare", "PARE-PARE"] },
    { stockMin: 200, stockMax: 100 }, { priceMin: 100, priceMax: 50 },
    { emptyPercent: 90, lowPercent: 20 }, { minStock: 3 }, { seed: -1 },
    { emptyWarehouses: ["UNKNOWN"] }, { period: "April 1999" }, { output: "data.csv" },
    { products: 100000, warehouses: 11 }, { force: "false" }, { typo: 1 },
  ]) assert.throws(() => normalize(config), undefined, JSON.stringify(config));
  assert.throws(() => parseArgs(["--typo", "5"]));
  assert.throws(() => parseArgs(["--products"]));
  assert.throws(() => parseArgs(["--force=false"]));
  assert.equal(execute(["--help"]).status, 0);
  assert.match(execute(["--products", "bad"]).stderr, /products/);
});
