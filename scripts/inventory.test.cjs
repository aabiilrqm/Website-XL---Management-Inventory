const { test } = require("node:test");
const assert = require("node:assert/strict");
const XLSX = require("xlsx");
const { parseExcel, inspectExcel, parseNumber } = require("./parser-loader.cjs");
function file(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
test("Indonesian/English number formats, accounting negatives and unknown values", () => {
  for (const [v, n] of [["1.234",1234], ["1,234",1234], ["Rp 1.234,50",1234.5], ["1,234.50",1234.5], ["(12)",-12], ["-",0], ["",null], ["#REF!",null], ["12pcs",null]]) assert.equal(parseNumber(v), n);
});
test("existing sample workbooks remain compatible, including QTY.1 and TGL.1 headers", () => {
  const fs=require("node:fs"), path=require("node:path");
  for (const name of ["sample-stok-xl.xlsx","laporan-stok-user.xlsx"]) {
    const data=parseExcel(fs.readFileSync(path.resolve(__dirname,"../sample",name)));
    assert.ok(data.stockItems.length > 0); assert.ok(data.movements.length > 0, name);
  }
});
test("renamed sheets, moved/reordered headers, new warehouses, subtotal and duplicates", () => {
  const buffer = file({ "April renamed": [[], ["Periode April 2026"], ["Brand", "Produk", "DEPO Jayapura", "DEPO Ambon", "Total", "Harga Satuan"], ["XL","Voucher A",100,20,120,500], ["XL","Voucher A",100,20,120,500], ["XL","Voucher B",5,-2,100,700], ["","GRAND TOTAL",105,18,220,0]] });
  const data = parseExcel(buffer, { movement: null });
  assert.equal(data.reportMonth, "April 2026"); assert.equal(data.totalDepos, 2); assert.equal(data.totalProducts, 2);
  assert.equal(data.stockItems.reduce((a,s)=>a+(s.stock??0),0), 123);
  assert.equal(data.preprocessing.duplicateRows,1); assert.equal(data.preprocessing.totalMismatches,1); assert.equal(data.preprocessing.negativeStocks,1);
  assert.equal(data.stockItems[0].minStock, null); assert.equal(data.stockItems[0].status,"Belum dinilai");
});
test("long table preserves missing vs zero, product/warehouse minima and prices", () => {
  const data = parseExcel(file({ Inventory: [["Warehouse","SKU","Product Name","Closing Stock","Minimum Stock","Unit Price"], ["Pare","01","A",0,5,1000], ["LuWu Timur","02","B","bad",8,2000], ["Ambon","03","C",10,20,null], ["Ambon","03","C",11,6,null]] }), { movement: null });
  assert.equal(data.stockItems[0].warehouse,"PARE-PARE"); assert.equal(data.stockItems[1].warehouse,"LUTIM");
  assert.equal(data.stockItems[0].status,"Habis"); assert.equal(data.stockItems[1].stock,null); assert.equal(data.preprocessing.invalidValues,1);
  assert.equal(data.stockItems[2].status,"Menipis"); assert.equal(data.stockItems[3].status,"Aman");
  assert.equal(data.stockItems[2].price,null); assert.equal(data.totalProducts,3);
});
test("side-by-side production and transfers use the right product, quantity and date", () => {
  const buffer = file({ Snapshot: [["Nama Produk","MAKASSAR","MAROS","TOTAL"],["A",10,5,15]],
    "Changed transfer": [["TGL","DEPO","Product ID","PRODUK","QTY",null,null,null,"TGL","DEPO ASAL","DEPO TUJUAN","Product ID","Produk Name","QTY","Status PO XL"],
      [45000,"Maros","p1","Production",999,null,null,null,46114,"Makassar","Maros","t1","A",20,"Completed"],
      [45000,"Maros","p1","Production",999,null,null,null,46114,"Makassar","Maros","t1","A",20,"Completed"]] });
  const inspection=inspectExcel(buffer); assert.equal(inspection.suggestedMovement.columns.product,"M"); assert.equal(inspection.suggestedMovement.columns.quantity,"N");
  const data=parseExcel(buffer); assert.equal(data.movements.length,2); assert.equal(data.movements[0].date,"2026-04-02"); assert.equal(data.movements[0].quantity,20);
  assert.equal(data.stockItems.reduce((a,s)=>a+s.stock,0),15); assert.equal(data.stockItems[0].sold,null);
});
test("manual mapping supports unknown labels and refuses overlapping totals / empty imports", () => {
  const buffer=file({ Custom:[["Barang dagang","Tempat simpan","Saldo fisik"],["A","Ambon",50]] });
  assert.equal(inspectExcel(buffer).suggestedStock,null);
  const stock={sheet:"Custom",headerRow:1,layout:"long",columns:{product:"A",warehouse:"B",quantity:"C"},warehouseColumns:[]};
  assert.equal(parseExcel(buffer,{stock,movement:null}).stockItems[0].stock,50);
  assert.throws(()=>parseExcel(buffer,{stock:{...stock,layout:"matrix",columns:{product:"A",total:"C"},warehouseColumns:[{column:"C",warehouse:"Ambon"}]},movement:null}),/merangkap/);
  assert.throws(()=>parseExcel(file({ Empty:[["Produk","Gudang","Stok"],["A","Ambon",null]] }),{movement:null}),/tidak menghasilkan/);
});
test("vertically merged two-row headers", () => {
  const wb=XLSX.utils.book_new(); const sheet=XLSX.utils.aoa_to_sheet([["Nama Produk","Gudang A","Gudang B"],[null,"Stok","Stok"],["A",15,7]]);
  sheet["!merges"]=[{s:{r:0,c:0},e:{r:1,c:0}}];
  XLSX.utils.book_append_sheet(wb,sheet,"Matrix");
  const data=parseExcel(XLSX.write(wb,{type:"buffer",bookType:"xlsx"}),{movement:null});
  assert.equal(data.stockItems.reduce((a,s)=>a+s.stock,0),22);
});
test("matrix minima can differ by warehouse for the same product", () => {
  const buffer=file({ Matrix:[["Produk","Gudang A","Minimum A","Gudang B","Minimum B"],["A",10,20,10,5]] });
  const stock={sheet:"Matrix",headerRow:1,layout:"matrix",columns:{product:"A"},warehouseColumns:[{column:"B",warehouse:"A",minimumColumn:"C"},{column:"D",warehouse:"B",minimumColumn:"E"}]};
  const data=parseExcel(buffer,{stock,movement:null});
  assert.equal(data.stockItems[0].status,"Menipis"); assert.equal(data.stockItems[1].status,"Aman");
});
test("detect warehouse-specific minimum headers without treating them as stock", () => {
  const buffer=file({ Matrix:[["Nama Produk","MAKASSAR","Minimum Makassar","MAROS","Min Stok Maros","TOTAL"],["A",10,20,10,5,20]] });
  const data=parseExcel(buffer,{movement:null});
  assert.equal(data.totalDepos,2); assert.equal(data.stockItems[0].minStock,20); assert.equal(data.stockItems[1].minStock,5);
  assert.equal(data.stockItems[0].status,"Menipis"); assert.equal(data.stockItems[1].status,"Aman");
});
test("formula with no cached result is unknown rather than zero", () => {
  const wb=XLSX.utils.book_new(); const sheet=XLSX.utils.aoa_to_sheet([["Produk","Gudang A","Gudang B"],["A",10,0]]);
  sheet.C2={t:"n",f:"MISSING!A1"}; XLSX.utils.book_append_sheet(wb,sheet,"Formulas");
  const data=parseExcel(XLSX.write(wb,{type:"buffer",bookType:"xlsx"}),{movement:null});
  assert.equal(data.stockItems[1].stock,null); assert.equal(data.stockItems[1].status,"Periksa");
});
test("atomic storage replaces a complete snapshot and preview rendering uses imported rows", () => {
  const fs=require("node:fs"), path=require("node:path"), os=require("node:os"), vm=require("node:vm"), ts=require("typescript");
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"xl-inventory-test-"));
  try {
    const holder={exports:{}};
    const code=ts.transpileModule(fs.readFileSync(path.resolve(__dirname,"../src/lib/store.ts"),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
    vm.runInNewContext(code,{module:holder,exports:holder.exports,require,JSON,process:{cwd:()=>root}});
    const data=parseExcel(file({ Stock:[["Produk","Gudang","Stok","Minimum Stok"],["Barang nyata","Makassar",0,100]] }),{movement:null});
    holder.exports.saveData(data); assert.deepEqual(holder.exports.loadData().stockItems,data.stockItems);
    holder.exports.saveData({...data,reportMonth:"Mei 2026"}); assert.equal(holder.exports.loadData().reportMonth,"Mei 2026");
    assert.deepEqual(fs.readdirSync(path.join(root,"data")),["parsed-data.json"]);
    holder.exports.clearData(); assert.equal(holder.exports.loadData(),null);
    const Module=require("node:module");
    const cache=new Map();
    let query="";
    function loadComponent(filename) {
      if (cache.has(filename)) return cache.get(filename).exports;
      const mod=new Module(filename,module); mod.filename=filename; mod.paths=Module._nodeModulePaths(path.dirname(filename));
      cache.set(filename,mod);
      const nativeRequire=mod.require.bind(mod);
      mod.require=spec=> {
        if (spec==="@/context/DataContext") return {useData:()=>({data,loading:false,error:null,refresh:async()=>{}})};
        if (spec==="@/lib/stock-status") return require("./parser-loader.cjs");
        if (spec==="next/navigation") return {useSearchParams:()=>new URLSearchParams(query)};
        if (spec.startsWith("./")) return loadComponent(path.resolve(path.dirname(filename),spec+".tsx"));
        return nativeRequire(spec);
      };
      const compiled=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
      mod._compile(compiled,filename);
      return mod.exports;
    }
    const component=loadComponent(path.resolve(__dirname,"../src/components/dashboard/InventoryDashboard.tsx")).default;
    const React=require("react");
    const render=view=>require("react-dom/server").renderToStaticMarkup(React.createElement(component,{view}));
    const html=render("stock");
    assert.ok(html.includes("Barang nyata")); assert.ok(html.includes("Habis")); assert.ok(html.includes("MAKASSAR")); assert.ok(!html.includes("VD Unlimited"));
    const overview=render("overview");
    assert.ok(overview.includes("Total gudang")); assert.ok(overview.includes("Kondisi persediaan"));
    assert.ok(!overview.includes("Barang nyata")); assert.ok(!overview.includes("<table"));
    const warehouse=render("warehouse");
    assert.ok(warehouse.includes("MAKASSAR")); assert.ok(warehouse.includes("Rekap per gudang"));
    assert.ok(!warehouse.includes("Barang nyata")); assert.ok(warehouse.includes("gudang=MAKASSAR"));
    for (const output of [html,overview,warehouse]) assert.ok(!output.includes("Transfer antar-gudang"));
    query="gudang=MAROS";
    assert.ok(!render("stock").includes("Barang nyata"));
    assert.ok(render("stock").includes("Tidak ada stok sesuai filter."));
  } finally {
    // Only remove the verified temporary test directory created above.
    assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep+"xl-inventory-test-"));
    fs.rmSync(root,{recursive:true,force:true});
  }
});
