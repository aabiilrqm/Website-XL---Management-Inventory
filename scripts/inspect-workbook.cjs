// Usage: node scripts/inspect-workbook.cjs "path/to/report.xlsx"
// Read only the first 12 rows; do not import or change the source workbook.
const XLSX = require("xlsx");
const workbook = XLSX.readFile(process.argv[2], {
  sheetRows: 12, cellFormula: false, cellStyles: false,
});
for (const name of workbook.SheetNames.filter(name => !process.argv[3] || name.toLowerCase().includes(process.argv[3].toLowerCase()))) {
  const sheet = workbook.Sheets[name];
  const populated = new Map();
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith("!") || cell.v == null || cell.v === "") continue;
    const { r, c } = XLSX.utils.decode_cell(address);
    if (!populated.has(r)) populated.set(r, []);
    populated.get(r).push([c, cell.v]);
  }
  console.log(JSON.stringify({
    name, range: sheet["!fullref"] || sheet["!ref"],
    rows: [...populated].sort(([a], [b]) => a - b).slice(0, 5).map(([row, cells]) => ({
      row: row + 1,
      cells: cells.sort(([a], [b]) => a - b).map(([col, value]) => [XLSX.utils.encode_col(col), value]),
    })),
  }));
}
