"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import {
  Bell,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

const initialNotifications = [
  {
    id: 1,
    type: "request",
    title: "Request Stok dari Gudang Maros",
    message: "Merequest VD Unlimited 2GB 28H sebanyak 500 pcs",
    time: "5 menit lalu",
    status: "pending",
    from: "Gudang Maros",
    product: "VD Unlimited 2GB 28H",
    quantity: 500,
  },
  {
    id: 2,
    type: "alert",
    title: "Peringatan Stok Menipis",
    message: "Stok VD Unlimited 4G 10GB di Gudang Makassar tersisa 8 pcs",
    time: "1 jam lalu",
    status: "warning",
    from: "Gudang Makassar",
    product: "VD Unlimited 4G 10GB",
    quantity: 8,
  },
  {
    id: 3,
    type: "request",
    title: "Request Stok dari Gudang Takalar",
    message: "Merequest VD Kuota 5GB 30H sebanyak 300 pcs",
    time: "3 jam lalu",
    status: "pending",
    from: "Gudang Takalar",
    product: "VD Kuota 5GB 30H",
    quantity: 300,
  },
  {
    id: 4,
    type: "info",
    title: "Distribusi Selesai",
    message: "Pengiriman ke Gudang Gowa telah sampai tujuan",
    time: "5 jam lalu",
    status: "completed",
    from: "Gudang Gowa",
    product: "VD UNS 3GB 7H",
    quantity: 200,
  },
  {
    id: 5,
    type: "alert",
    title: "Peringatan Stok Kritis",
    message: "Stok VD Unlimited 1GB 7H di Gudang Bulukumba tersisa 5 pcs",
    time: "1 hari lalu",
    status: "critical",
    from: "Gudang Bulukumba",
    product: "VD Unlimited 1GB 7H",
    quantity: 5,
  },
];

export default function NotifikasiPage() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [filter, setFilter] = useState("semua");

  const filteredNotif = notifications.filter((n) => {
    if (filter === "semua") return true;
    return n.type === filter;
  });

  const getIcon = (type: string, status: string) => {
    if (type === "request")
      return <Package className="h-5 w-5 text-blue-600" />;
    if (type === "alert") {
      if (status === "critical")
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      return <AlertTriangle className="h-5 w-5 text-amber-600" />;
    }
    return <CheckCircle className="h-5 w-5 text-emerald-600" />;
  };

  const getBgColor = (type: string, status: string) => {
    if (type === "request") return "bg-blue-50";
    if (type === "alert") {
      if (status === "critical") return "bg-red-50";
      return "bg-amber-50";
    }
    return "bg-emerald-50";
  };

  const handleApprove = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "approved" } : n)),
    );
    alert(`Request telah disetujui!`);
  };

  const handleReject = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    alert(`Request ditolak.`);
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
                  Notifikasi
                </h1>
                <p className="text-sm text-slate-500">
                  Peringatan stok menipis dan request dari gudang daerah
                </p>
              </div>
              <div className="flex gap-2">
                {["semua", "request", "alert", "info"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      filter === f
                        ? "bg-[#0E33BC] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {f === "semua"
                      ? "Semua"
                      : f === "request"
                        ? "Request"
                        : f === "alert"
                          ? "Peringatan"
                          : "Info"}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Notifikasi Belum Dibaca */}
            <div className="mb-6 rounded-2xl bg-[#0E33BC]/10 p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-[#0E33BC]" />
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">
                    {
                      notifications.filter(
                        (n) =>
                          n.status === "pending" ||
                          n.status === "warning" ||
                          n.status === "critical",
                      ).length
                    }
                  </span>{" "}
                  notifikasi belum ditangani
                </p>
              </div>
            </div>

            {/* List Notifikasi */}
            <div className="space-y-3">
              {filteredNotif.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div
                        className={`rounded-2xl ${getBgColor(notif.type, notif.status)} p-3 h-fit`}
                      >
                        {getIcon(notif.type, notif.status)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {notif.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {notif.time}
                          </span>
                          <span>Dari: {notif.from}</span>
                          <span>Produk: {notif.product}</span>
                          <span>Jumlah: {notif.quantity} pcs</span>
                        </div>
                      </div>
                    </div>

                    {notif.type === "request" && notif.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(notif.id)}
                          className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => handleReject(notif.id)}
                          className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                        >
                          Tolak
                        </button>
                      </div>
                    )}

                    {notif.type === "alert" && (
                      <button className="rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                        Lihat Stok
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {filteredNotif.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-3 text-slate-500">Tidak ada notifikasi</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
