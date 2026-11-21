// Compile just the pure preprocessing module for Node tests / local CLI.
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/lib/excel-parser.ts");
const statusFilename = path.resolve(__dirname, "../src/lib/stock-status.ts");
const statusModule = new Module(statusFilename, module);
statusModule.filename = statusFilename;
statusModule.paths = Module._nodeModulePaths(path.dirname(statusFilename));
statusModule._compile(ts.transpileModule(fs.readFileSync(statusFilename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, statusFilename);
require.cache[statusFilename] = statusModule;
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText.replaceAll('require("./stock-status")', 'require("./stock-status.ts")');
const mod = new Module(filename, module);
mod.filename = filename;
mod.paths = Module._nodeModulePaths(path.dirname(filename));
mod._compile(compiled, filename);
module.exports = mod.exports;
