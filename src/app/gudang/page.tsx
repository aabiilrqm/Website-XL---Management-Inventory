"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Users,
  Package,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

const initialWarehouses = [
  {
    id: 1,
    name: "Gudang Makassar",
    location: "Jl. Urip Sumoharjo No. 123, Makassar",
    phone: "0411-123456",
    manager: "Andi Saputra",
    stockCount: 1245,
    active: true,
  },
  {
    id: 2,
    name: "Gudang Maros",
    location: "Jl. Poros Maros No. 45, Maros",
    phone: "0411-789012",
    manager: "Budi Santoso",
    stockCount: 876,
    active: true,
  },
  {
    id: 3,
    name: "Gudang Takalar",
    location: "Jl. Sultan Hasanuddin No. 78, Takalar",
    phone: "0418-345678",
    manager: "Citra Dewi",
    stockCount: 543,
    active: true,
  },
  {
    id: 4,
    name: "Gudang Gowa",
    location: "Jl. Sultan Alauddin No. 90, Gowa",
    phone: "0411-901234",
    manager: "Darmawan",
    stockCount: 432,
    active: true,
  },
  {
    id: 5,
    name: "Gudang Bulukumba",
    location: "Jl. Andi Mappanyukki No. 21, Bulukumba",
    phone: "0413-567890",
    manager: "Erna Wati",
    stockCount: 234,
    active: false,
  },
  {
    id: 6,
    name: "Gudang Jeneponto",
    location: "Jl. Poros Jeneponto No. 34, Jeneponto",
    phone: "0419-123789",
    manager: "Fahmi Rizal",
    stockCount: 187,
    active: true,
  },
];

export default function GudangPage() {
  const [warehouses, setWarehouses] = useState(initialWarehouses);

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
                <h1 className="text-2xl font-bold text-slate-900">Gudang</h1>
                <p className="text-sm text-slate-500">
                  Kelola data gudang XL di Sulawesi Selatan
                </p>
              </div>
              <button className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition">
                <Plus size={18} />
                Tambah Gudang
              </button>
            </div>

            {/* Stats */}
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2">
                    <MapPin className="h-5 w-5 text-[#0E33BC]" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Gudang</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {warehouses.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-green-50 p-2">
                    <Package className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Stok</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {warehouses
                        .reduce((acc, w) => acc + w.stockCount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2">
                    <Users className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Gudang Aktif</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {warehouses.filter((w) => w.active).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">
                      Rata-rata Stok/Gudang
                    </p>
                    <p className="text-2xl font-bold text-slate-900">
                      {Math.round(
                        warehouses.reduce((acc, w) => acc + w.stockCount, 0) /
                          warehouses.length,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid Gudang */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-[#0E33BC]/10 p-2">
                        <MapPin className="h-5 w-5 text-[#0E33BC]" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {warehouse.name}
                        </h3>
                        {warehouse.active ? (
                          <span className="text-xs text-emerald-600">
                            ● Aktif
                          </span>
                        ) : (
                          <span className="text-xs text-red-600">
                            ● Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit size={16} />
                      </button>
                      <button className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">
                        Alamat:
                      </span>{" "}
                      {warehouse.location}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">
                        Telepon:
                      </span>{" "}
                      {warehouse.phone}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">
                        Kepala Gudang:
                      </span>{" "}
                      {warehouse.manager}
                    </p>
                    <p className="text-slate-600">
                      <span className="font-medium text-slate-700">
                        Jumlah Stok:
                      </span>{" "}
                      {warehouse.stockCount.toLocaleString()} unit
                    </p>
                  </div>

                  <button className="mt-4 w-full rounded-2xl border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
                    Lihat Detail Stok
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
