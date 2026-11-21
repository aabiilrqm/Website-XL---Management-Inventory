// Exercise real Next.js route handlers without replacing the active report.
// node scripts/smoke-upload.cjs "report.xlsx" [http://localhost:3000]
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
async function main() {
  const base = process.argv[3] ?? "http://localhost:3000";
  const bytes = fs.readFileSync(process.argv[2]);
  const stored = path.resolve(__dirname, "../data/parsed-data.json");
  const before = fs.existsSync(stored) ? fs.readFileSync(stored) : null;
  async function post(action, mapping) {
    const form = new FormData();
    form.append("file", new Blob([bytes]), path.basename(process.argv[2]));
    form.append("action", action);
    if (mapping) form.append("mapping", JSON.stringify(mapping));
    const res = await fetch(base + "/api/upload", { method: "POST", body: form });
    const json = await res.json();
    assert.equal(res.status, 200, json.error);
    assert.equal(json.success, true);
    return json;
  }
  const { inspection } = await post("inspect");
  const { data } = await post("preview", { stock: inspection.suggestedStock, movement: inspection.suggestedMovement });
  assert.equal(data.schemaVersion, 2);
  assert.ok(data.stockItems.length > 0);
  assert.ok(data.stockItems.every(s => s.sources.length));
  const after = fs.existsSync(stored) ? fs.readFileSync(stored) : null;
  assert.deepEqual(after, before, "Preview must not overwrite the saved report");
  const template = await fetch(base + "/api/upload/template");
  assert.equal(template.status, 200);
  const { parseExcel } = require("./parser-loader.cjs");
  const templateData = parseExcel(Buffer.from(await template.arrayBuffer()), { movement: null });
  assert.equal(templateData.stockItems.length, 2);
  assert.equal(templateData.stockItems[1].status, "Menipis");
  const invalid = new FormData(); invalid.append("file", new Blob(["not excel"]), "invalid.xlsx"); invalid.append("action", "preview");
  const invalidResponse = await fetch(base + "/api/upload", { method: "POST", body: invalid });
  assert.equal(invalidResponse.status, 422);
  assert.deepEqual(fs.existsSync(stored) ? fs.readFileSync(stored) : null, before);
  for (const route of ["/", "/gudang", "/stok-produk"]) {
    const res = await fetch(base + route);
    assert.equal(res.status, 200, route);
    const html = await res.text();
    assert.ok(!html.includes('"digest":"'), "No server rendering error: " + route);
  }
  console.log(JSON.stringify({ ok: true, period: data.reportMonth, products: data.totalProducts, warehouses: data.totalDepos, records: data.stockItems.length, negativeStocks: data.preprocessing.negativeStocks, transfers: data.movements.length }));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
