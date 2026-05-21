"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { Search, Filter, Download, Package, AlertTriangle } from "lucide-react";
import { useState } from "react";

// Data dummy stok produk
const initialStockData = [
  {
    id: 1,
    product: "VD Unlimited Harian 2GB 28H",
    warehouse: "Makassar",
    stock: 12,
    minStock: 50,
    sold: 320,
    status: "Menipis",
    price: 50000,
  },
  {
    id: 2,
    product: "VD UNL 2GB 7Hr",
    warehouse: "Makassar",
    stock: 62,
    minStock: 30,
    sold: 215,
    status: "Aman",
    price: 35000,
  },
  {
    id: 3,
    product: "VD Unlimited 4G 10GB",
    warehouse: "Maros",
    stock: 8,
    minStock: 40,
    sold: 98,
    status: "Menipis",
    price: 100000,
  },
  {
    id: 4,
    product: "VD Kuota 5GB 30H",
    warehouse: "Takalar",
    stock: 45,
    minStock: 30,
    sold: 167,
    status: "Aman",
    price: 45000,
  },
  {
    id: 5,
    product: "VD UNS 3GB 7H",
    warehouse: "Gowa",
    stock: 23,
    minStock: 25,
    sold: 89,
    status: "Aman",
    price: 40000,
  },
  {
    id: 6,
    product: "VD Unlimited 1GB 7H",
    warehouse: "Bulukumba",
    stock: 5,
    minStock: 20,
    sold: 45,
    status: "Kritis",
    price: 25000,
  },
  {
    id: 7,
    product: "VD Kuota 10GB 30H",
    warehouse: "Jeneponto",
    stock: 18,
    minStock: 30,
    sold: 76,
    status: "Menipis",
    price: 85000,
  },
];

export default function StokProdukPage() {
  const [search, setSearch] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("semua");
  const [stockData, setStockData] = useState(initialStockData);

  const warehouses = [
    "semua",
    "Makassar",
    "Maros",
    "Takalar",
    "Gowa",
    "Bulukumba",
    "Jeneponto",
  ];

  const filteredData = stockData.filter((item) => {
    const matchesSearch = item.product
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesWarehouse =
      filterWarehouse === "semua" || item.warehouse === filterWarehouse;
    return matchesSearch && matchesWarehouse;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Kritis":
        return (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            Kritis
          </span>
        );
      case "Menipis":
        return (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Menipis
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Aman
          </span>
        );
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-slate-50">
      <div className="flex h-full">
        <Sidebar />
        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Stok Produk
                </h1>
                <p className="text-sm text-slate-500">
                  Kelola stok produk seluruh gudang Sulawesi Selatan
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition">
                <Download size={18} />
                Export Excel
              </button>
            </div>

            {/* Stats Ringkasan */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Total Produk</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockData.length}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Total Stok</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockData.reduce((acc, item) => acc + item.stock, 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Produk Menipis</p>
                <p className="text-2xl font-bold text-amber-600">
                  {
                    stockData.filter(
                      (item) =>
                        item.status === "Menipis" || item.status === "Kritis",
                    ).length
                  }
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <p className="text-sm text-slate-500">Total Terjual</p>
                <p className="text-2xl font-bold text-slate-900">
                  {stockData.reduce((acc, item) => acc + item.sold, 0)}
                </p>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-4 text-sm focus:border-[#0E33BC] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={filterWarehouse}
                  onChange={(e) => setFilterWarehouse(e.target.value)}
                  className="h-11 w-40 rounded-2xl border border-slate-200 pl-10 pr-4 text-sm focus:border-[#0E33BC] focus:outline-none"
                >
                  {warehouses.map((wh) => (
                    <option key={wh} value={wh}>
                      {wh === "semua" ? "Semua Gudang" : wh}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabel Stok */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Produk
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Gudang
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Stok
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Min. Stok
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Terjual
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Harga
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Status
                      </th>
                      <th className="px-5 py-4 font-semibold text-slate-600">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {item.product}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {item.warehouse}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`font-semibold ${item.stock < item.minStock ? "text-red-600" : "text-slate-900"}`}
                          >
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {item.minStock}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          {item.sold}
                        </td>
                        <td className="px-5 py-3 text-slate-600">
                          Rp {item.price.toLocaleString()}
                        </td>
                        <td className="px-5 py-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="px-5 py-3">
                          <button className="rounded-xl border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
