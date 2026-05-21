"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import StockAlert from "@/components/dashboard/StockAlert";
import StoreRequestList from "@/components/dashboard/StoreRequestList";
import DistributionTable from "@/components/dashboard/DistributionTable";
import { stats } from "@/lib/dummy-data";

// Grafik menggunakan recharts (install dulu: npm install recharts)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Data dummy untuk grafik
const cityOrderData = [
  { name: "Makassar", order: 1842 },
  { name: "Maros", order: 845 },
  { name: "Takalar", order: 621 },
  { name: "Bulukumba", order: 432 },
  { name: "Gowa", order: 378 },
  { name: "Jeneponto", order: 256 },
];

const productDistribution = [
  { name: "VD Unlimited", value: 45, color: "#0E33BC" },
  { name: "VD Kuota", value: 28, color: "#1ACAA2" },
  { name: "VD UNS", value: 18, color: "#3B82F6" },
  { name: "Lainnya", value: 9, color: "#94A3B8" },
];

const stockByWarehouse = [
  {
    product: "VD Unlimited Harian 2GB 28H",
    warehouse: "Makassar",
    stock: 12,
    sold: 320,
    status: "Menipis",
  },
  {
    product: "VD UNL 2GB 7Hr",
    warehouse: "Makassar",
    stock: 62,
    sold: 215,
    status: "Aman",
  },
  {
    product: "VD Unlimited 4G 10GB",
    warehouse: "Maros",
    stock: 8,
    sold: 98,
    status: "Menipis",
  },
  {
    product: "VD Kuota 5GB 30H",
    warehouse: "Takalar",
    stock: 45,
    sold: 167,
    status: "Aman",
  },
  {
    product: "VD UNS 3GB 7H",
    warehouse: "Gowa",
    stock: 23,
    sold: 89,
    status: "Aman",
  },
];

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-slate-50">
      <div className="flex h-full">
        <Sidebar />

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            {/* Header Dashboard */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dashboard Analitik
              </h1>
              <p className="text-sm text-slate-500">Data per April 2026</p>
            </div>

            {/* Stat Cards - 4 kolom */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <StatCard key={item.title} {...item} />
              ))}
            </section>

            {/* Bar Chart + Pie Chart - 2 kolom */}
            <section className="grid gap-6 xl:grid-cols-2">
              {/* Total Order per Kota */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Total Order per Kota (April 2026)
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Berdasarkan data distribusi
                </p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={cityOrderData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#CBD5E1" }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "16px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar dataKey="order" fill="#0E33BC" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Distribusi Produk */}
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">
                  Distribusi Produk
                </h3>
                <p className="mb-4 text-sm text-slate-500">
                  Berdasarkan volume pengiriman
                </p>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={productDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent = 0 }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                    >
                      {productDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Tabel Stok Produk per Gudang */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900">
                Stok Produk per Gudang
              </h3>
              <p className="mb-4 text-sm text-slate-500">
                Data real-time stok seluruh gudang Sulawesi Selatan
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-3 font-semibold">Produk</th>
                      <th className="pb-3 font-semibold">Gudang</th>
                      <th className="pb-3 font-semibold">Stok</th>
                      <th className="pb-3 font-semibold">Terjual</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockByWarehouse.map((item, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-3 font-medium text-slate-900">
                          {item.product}
                        </td>
                        <td className="py-3 text-slate-600">
                          {item.warehouse}
                        </td>
                        <td className="py-3 text-slate-600">{item.stock}</td>
                        <td className="py-3 text-slate-600">{item.sold}</td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              item.status === "Menipis"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alert dan Request */}
            <section className="grid gap-6 xl:grid-cols-2">
              <StockAlert />
              <StoreRequestList />
            </section>

            {/* Tabel Distribusi */}
            <DistributionTable />
          </div>
        </section>
      </div>
    </main>
  );
}
