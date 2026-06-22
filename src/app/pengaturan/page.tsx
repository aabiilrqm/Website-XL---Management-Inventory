"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import {
  Settings,
  Bell,
  Lock,
  Moon,
  Globe,
  Database,
  Shield,
  Save,
} from "lucide-react";
import { useState } from "react";

export default function PengaturanPage() {
  const [settings, setSettings] = useState({
    notifications: {
      stockAlert: true,
      newRequest: true,
      distributionUpdate: false,
      weeklyReport: true,
    },
    appearance: {
      darkMode: false,
      compact: false,
    },
    language: "id",
    security: {
      twoFactor: false,
      sessionTimeout: "30",
    },
  });

  const handleSave = () => {
    alert("Pengaturan berhasil disimpan!");
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
                  Pengaturan
                </h1>
                <p className="text-sm text-slate-500">
                  Konfigurasi sistem dan preferensi akun
                </p>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition"
              >
                <Save size={18} />
                Simpan Pengaturan
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Notifikasi */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-[#0E33BC]" />
                  <h3 className="text-lg font-bold text-slate-900">
                    Notifikasi
                  </h3>
                </div>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Peringatan stok menipis
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.notifications.stockAlert}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            stockAlert: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Request stok baru
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.notifications.newRequest}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            newRequest: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Update distribusi
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.notifications.distributionUpdate}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            distributionUpdate: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Laporan mingguan
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.notifications.weeklyReport}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          notifications: {
                            ...settings.notifications,
                            weeklyReport: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                </div>
              </div>

              {/* Tampilan */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Moon className="h-5 w-5 text-[#0E33BC]" />
                  <h3 className="text-lg font-bold text-slate-900">Tampilan</h3>
                </div>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">Mode Gelap</span>
                    <input
                      type="checkbox"
                      checked={settings.appearance.darkMode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            darkMode: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Tampilan Compact
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.appearance.compact}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          appearance: {
                            ...settings.appearance,
                            compact: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                </div>
              </div>

              {/* Bahasa & Keamanan */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[#0E33BC]" />
                  <h3 className="text-lg font-bold text-slate-900">Bahasa</h3>
                </div>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0E33BC] focus:outline-none"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#0E33BC]" />
                  <h3 className="text-lg font-bold text-slate-900">Keamanan</h3>
                </div>
                <div className="space-y-3">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-slate-700">
                      Autentikasi 2 Faktor
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.security.twoFactor}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            twoFactor: e.target.checked,
                          },
                        })
                      }
                      className="h-5 w-5 rounded border-slate-300 text-[#0E33BC] focus:ring-[#0E33BC]"
                    />
                  </label>
                  <div>
                    <label className="text-sm text-slate-700">
                      Session Timeout (menit)
                    </label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          security: {
                            ...settings.security,
                            sessionTimeout: e.target.value,
                          },
                        })
                      }
                      className="mt-1 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0E33BC] focus:outline-none"
                    />
                  </div>
                  <button className="w-full rounded-2xl border border-red-200 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition">
                    Ubah Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
