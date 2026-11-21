import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const outputDir = path.dirname(fileURLToPath(import.meta.url));
const warehouses = ['MAKASSAR', 'Maros', 'BULUKUMBA', 'BONE', 'PARE-PARE', 'PALOPO', 'LUTIM', 'WONOMULYO', 'KENDARI', 'BOMBANA'];
const products = [
  ['SP', 'XL', 'SP XL Reguler 10K', 10000, 100],
  ['SP', 'XL', 'SP XL Xtra Combo 5GB 30 Hari', 25000, 60],
  ['SP', 'XL', 'SP XL Xtra Combo 10GB 30 Hari', 45000, 50],
  ['PV', 'XL', 'Voucher XL Flex Mini 3GB 3 Hari', 12000, 80],
  ['PV', 'XL', 'Voucher XL Flex Mini 8GB 7 Hari', 25000, 70],
  ['PV', 'XL', 'Voucher XL Flex Max 20GB 30 Hari', 65000, 40],
  ['PV', 'XL', 'Voucher XL Xtra Combo 15GB 30 Hari', 55000, 50],
  ['PV', 'XL', 'Voucher Kosong XL', 500, 200],
  ['SP', 'AXIS', 'SP AXIS Reguler 10K', 10000, 100],
  ['SP', 'AXIS', 'SP AXIS Bronet 5GB 30 Hari', 22000, 60],
  ['SP', 'AXIS', 'SP AXIS Bronet 10GB 30 Hari', 40000, 50],
  ['PV', 'AXIS', 'Voucher AXIS AIGO Mini 2GB 3 Hari', 9000, 80],
  ['PV', 'AXIS', 'Voucher AXIS AIGO Mini 5GB 5 Hari', 17000, 70],
  ['PV', 'AXIS', 'Voucher AXIS AIGO Bronet 12GB 30 Hari', 45000, 40],
  ['PV', 'AXIS', 'Voucher AXIS AIGO Bronet 20GB 30 Hari', 65000, 40],
  ['PV', 'AXIS', 'Voucher Kosong AXIS', 500, 200],
  ['SP', 'SMARTFREN', 'SP Smartfren Reguler 10K', 10000, 100],
  ['SP', 'SMARTFREN', 'SP Smartfren Kuota 6GB 30 Hari', 25000, 60],
  ['SP', 'SMARTFREN', 'SP Smartfren Kuota 15GB 30 Hari', 50000, 50],
  ['PV', 'SMARTFREN', 'Voucher Smartfren Kuota 3GB 3 Hari', 10000, 80],
  ['PV', 'SMARTFREN', 'Voucher Smartfren Kuota 8GB 7 Hari', 22000, 70],
  ['PV', 'SMARTFREN', 'Voucher Smartfren Kuota 20GB 30 Hari', 60000, 40],
  ['PV', 'SMARTFREN', 'Voucher Smartfren Unlimited 28 Hari', 85000, 40],
  ['PV', 'SMARTFREN', 'Voucher Kosong Smartfren', 500, 200],
];

const wb = Workbook.create();
const sheet = wb.worksheets.add('SUMMARY PER BO');
sheet.showGridLines = false;
sheet.tabColor = '#0E33BC';
const lastDataRow = products.length + 4;
const totalRow = lastDataRow + 1;
sheet.getRange(`B1:T${totalRow}`).format.font = { name: 'Arial', size: 10, color: '#1E293B' };
sheet.getRange(`B1:T${totalRow}`).format.verticalAlignment = 'center';
sheet.getRange(`B1:T${totalRow}`).format.rowHeight = 24;
sheet.getRange('A1:A29').format.columnWidth = 3;
sheet.getRange('B1:D29').format.columnWidth = 10;
sheet.getRange('E1:E29').format.columnWidth = 24;
sheet.getRange('F1:F29').format.columnWidth = 55;
sheet.getRange('G1:Q29').format.columnWidth = 14;
sheet.getRange('R1:R29').format.columnWidth = 17;
sheet.getRange('S1:S29').format.columnWidth = 22;
sheet.getRange('T1:T29').format.columnWidth = 18;
sheet.mergeCells('B1:T1');
sheet.getRange('B1').values = [['LAPORAN STOK PHYSICAL']];
sheet.getRange('B1').format.font = { name: 'Arial', size: 15, bold: true, color: '#0E33BC' };
sheet.getRange('B1:T1').format.rowHeight = 32;
sheet.mergeCells('B2:T2');
sheet.getRange('B2').values = [['Periode: November 2026']];
sheet.mergeCells('B3:T3');
sheet.getRange('B3').values = [['Data simulasi untuk uji unggah. Nama paket, harga, dan jumlah stok merupakan contoh.']];
sheet.getRange('B3').format.font = { name: 'Arial', size: 10, italic: true, color: '#64748B' };
sheet.getRange('B4:T4').values = [['SP/PV', 'BRAND', 'P/NP', 'PRODUCT ID', 'NAMA PRODUK', ...warehouses, 'TOTAL', 'Harga Satuan', 'Total Amount', 'Minimum Stok']];
sheet.getRange('B4:T4').format = {
  fill: '#0E33BC', font: { name: 'Arial', size: 10, bold: true, color: '#FFFFFF' },
  horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true, rowHeight: 36,
  borders: { insideVertical: { style: 'thin', color: '#FFFFFF' } },
};

const records = products.map(([category, brand, name, price, minimum], i) => {
  const stock = warehouses.map((_, j) => {
    if (j === 9 || (i + j * 3) % 13 === 0) return 0;
    const mode = (i * 3 + j * 5) % 10;
    if (mode === 0 || mode === 1) return Math.max(1, Math.floor(minimum * 0.15));
    if (mode === 2 || mode === 3) return Math.floor(minimum * 0.65);
    return minimum + ((i + 1) * 83 + j * 47) % 700;
  });
  const sku = `DEMO-${brand === 'SMARTFREN' ? 'SF' : brand}-${String(i % 8 + 1).padStart(3, '0')}`;
  return { category, brand, name, price, minimum, sku, stock };
});
sheet.getRange(`B5:T${lastDataRow}`).values = records.map(r => [r.category, r.brand, 'NP', r.sku, r.name, ...r.stock, null, r.price, null, r.minimum]);
sheet.getRange(`E5:E${lastDataRow}`).setNumberFormat('@');
sheet.getRange(`G5:Q${totalRow}`).setNumberFormat('#,##0');
sheet.getRange(`R5:S${totalRow}`).setNumberFormat('"Rp "#,##0');
sheet.getRange(`T5:T${lastDataRow}`).setNumberFormat('#,##0');
sheet.getRange('Q5').formulas = [['=SUM(G5:P5)']];
sheet.getRange(`Q5:Q${lastDataRow}`).fillDown();
sheet.getRange('S5').formulas = [['=Q5*R5']];
sheet.getRange(`S5:S${lastDataRow}`).fillDown();
for (let row = 5; row <= lastDataRow; row++) {
  if (row % 2 === 0) sheet.getRange(`B${row}:T${row}`).format.fill = '#F1F5F9';
}
sheet.getRange(`G5:T${totalRow}`).format.horizontalAlignment = 'right';
sheet.getRange(`G5:P${lastDataRow}`).conditionalFormats.addCustom('G5=0', { fill: '#FEE2E2', font: { color: '#B91C1C' } });
sheet.getRange(`G5:P${lastDataRow}`).conditionalFormats.addCustom('AND(G5>0,G5<$T5*0.3)', { fill: '#FFEDD5', font: { color: '#9A3412' } });
sheet.getRange(`G5:P${lastDataRow}`).conditionalFormats.addCustom('AND(G5>=$T5*0.3,G5<$T5)', { fill: '#FEF3C7', font: { color: '#92400E' } });
sheet.getRange(`F${totalRow}`).values = [['GRAND TOTAL']];
for (const column of ['G','H','I','J','K','L','M','N','O','P','Q','S']) {
  sheet.getRange(`${column}${totalRow}`).formulas = [[`=SUM(${column}5:${column}${lastDataRow})`]];
}
sheet.getRange(`B${totalRow}:T${totalRow}`).format.fill = '#E2E8F0';
sheet.getRange(`B${totalRow}:T${totalRow}`).format.font = { name: 'Arial', size: 10, bold: true, color: '#0F172A' };
sheet.getRange(`B${totalRow}:T${totalRow}`).format.borders = { top: { style: 'thin', color: '#94A3B8' } };
sheet.freezePanes.freezeRows(4);
sheet.freezePanes.freezeColumns(6);
wb.recalculate();

console.log((await wb.inspect({kind:'table', range:'SUMMARY PER BO!E4:T7', include:'values,formulas', tableMaxRows:4, tableMaxCols:16, maxChars:3500})).ndjson);
console.log((await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options:{useRegex:true,maxResults:30},maxChars:1500})).ndjson);
for (const [name, range] of [['preview-title','B1:T4'], ['preview-products','B1:J13'], ['preview-warehouses','K4:T13'], ['preview-totals','F25:T29']]) {
  const preview = await wb.render({sheetName:sheet.name,range,scale:1.5,format:'png'});
  await fs.writeFile(path.join(outputDir, `${name}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const fileName = 'contoh-stok-november-2026.xlsx';
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(path.join(outputDir,fileName));
const expected = {
  products: products.length, warehouses: warehouses.length, records: records.length * warehouses.length,
  stock: records.reduce((total,r) => total+r.stock.reduce((a,b)=>a+b,0),0),
  value: records.reduce((total,r) => total+r.stock.reduce((a,b)=>a+b,0)*r.price,0),
  byWarehouse: Object.fromEntries(warehouses.map((name,j)=>[name.toUpperCase(),records.reduce((sum,r)=>sum+r.stock[j],0)])),
  statuses: {},
};
for (const r of records) for (const stock of r.stock) {
  const status = stock === 0 ? 'Habis' : stock < r.minimum * 0.3 ? 'Kritis' : stock < r.minimum ? 'Menipis' : 'Aman';
  expected.statuses[status] = (expected.statuses[status] ?? 0) + 1;
}
await fs.writeFile(path.join(outputDir,'expected.json'),JSON.stringify(expected,null,2));
console.log(JSON.stringify({fileName,...expected}));
