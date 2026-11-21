"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import { Moon, Save } from "lucide-react";
import { useState } from "react";

export default function PengaturanPage() {
  const [settings, setSettings] = useState({
    appearance: {
      darkMode: false,
      compact: false,
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
                  Preferensi tampilan aplikasi
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

            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
