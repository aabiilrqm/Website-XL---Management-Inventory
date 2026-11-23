"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, LayoutGrid, Moon, RotateCcw } from "lucide-react";
import Workspace from "@/components/dashboard/Workspace";
import { panel } from "@/components/dashboard/inventory-ui";

const STORAGE_KEY = "xl-inventory-ui-prefs";

interface UiPrefs {
  darkMode: boolean;
  compact: boolean;
}

const DEFAULT_PREFS: UiPrefs = {
  darkMode: false,
  compact: false,
};

function applyPrefs(prefs: UiPrefs) {
  if (typeof document === "undefined") return;
  if (prefs.darkMode) document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");

  if (prefs.compact) document.documentElement.setAttribute("data-compact", "true");
  else document.documentElement.removeAttribute("data-compact");
}

function savePrefs(prefs: UiPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors
  }
}

export default function PengaturanPage() {
  const [prefs, setPrefs] = useState<UiPrefs>(DEFAULT_PREFS);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as Partial<UiPrefs>;
        const next: UiPrefs = {
          darkMode: Boolean(parsed.darkMode),
          compact: Boolean(parsed.compact),
        };
        setPrefs(next);
        applyPrefs(next);
      } catch {
        // Ignore storage errors
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function updatePrefs(next: UiPrefs, label: string) {
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
    setStatusMessage(label);
    window.setTimeout(() => {
      setStatusMessage((current) => (current === label ? "" : current));
    }, 2800);
  }

  const isModified = prefs.darkMode || prefs.compact;

  return (
    <Workspace>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0E33BC]">
              Preferensi Aplikasi
            </p>
            <h1 className="mt-1 font-extrabold text-slate-900">Pengaturan</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sesuaikan tema dan kepadatan tampilan dashboard. Perubahan diterapkan dan disimpan otomatis.
            </p>
          </div>

          {isModified && (
            <button
              type="button"
              onClick={() => updatePrefs(DEFAULT_PREFS, "Pengaturan dikembalikan ke default")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#0E33BC] hover:text-[#0E33BC]"
            >
              <RotateCcw size={13} aria-hidden="true" />
              Reset Default
            </button>
          )}
        </div>

        {statusMessage && (
          <div
            role="status"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700"
          >
            <CheckCircle2 size={15} aria-hidden="true" />
            {statusMessage}
          </div>
        )}

        <section className={panel + " space-y-5"}>
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#0E33BC]">
              <Moon size={19} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tampilan</h2>
              <p className="text-xs text-slate-500">
                Aktifkan atau nonaktifkan preferensi tampilan di seluruh halaman.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Mode Gelap */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">Mode Gelap</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      prefs.darkMode
                        ? "bg-[#0E33BC] text-white"
                        : "bg-slate-200/80 text-slate-500"
                    }`}
                  >
                    {prefs.darkMode ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Gunakan permukaan gelap bernuansa navy untuk kenyamanan di ruangan minim cahaya.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.darkMode}
                aria-label="Aktifkan Mode Gelap"
                onClick={() => {
                  const next = { ...prefs, darkMode: !prefs.darkMode };
                  updatePrefs(
                    next,
                    next.darkMode ? "Mode Gelap diaktifkan" : "Mode Gelap dinonaktifkan",
                  );
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  prefs.darkMode ? "bg-[#0E33BC]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`switch-knob inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform ${
                    prefs.darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Tampilan Compact */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <LayoutGrid size={14} className="text-[#09A9A7]" aria-hidden="true" />
                    Tampilan Compact
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      prefs.compact
                        ? "bg-[#09A9A7] text-white"
                        : "bg-slate-200/80 text-slate-500"
                    }`}
                  >
                    {prefs.compact ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  Perkecil jarak kartu, header, dan baris tabel agar lebih banyak data terlihat dalam satu layar.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.compact}
                aria-label="Aktifkan Tampilan Compact"
                onClick={() => {
                  const next = { ...prefs, compact: !prefs.compact };
                  updatePrefs(
                    next,
                    next.compact
                      ? "Tampilan Compact diaktifkan"
                      : "Tampilan Compact dinonaktifkan",
                  );
                }}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  prefs.compact ? "bg-[#0E33BC]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`switch-knob inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform ${
                    prefs.compact ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      </div>
    </Workspace>
  );
}
