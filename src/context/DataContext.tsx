"use client";

/**
 * DataContext.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Path : src/context/DataContext.tsx
 *
 * React Context global untuk data inventori XL.
 *
 * Cara pakai di halaman / komponen:
 *   import { useData } from "@/context/DataContext";
 *   const { data, loading, error, refresh, uploadFile, resetData } = useData();
 *
 * ─── State yang tersedia ─────────────────────────────────────────────────────
 *   data        : ParsedData | null   → seluruh data parsed dari Excel
 *   loading     : boolean             → sedang fetch / upload
 *   error       : string | null       → pesan error terakhir
 *   uploadState : UploadState         → status upload file
 *
 * ─── Action yang tersedia ────────────────────────────────────────────────────
 *   refresh()             → fetch ulang data dari GET /api/data
 *   uploadFile(file)      → POST file ke /api/upload, lalu refresh
 *   resetData()           → DELETE /api/data (hapus data, kembali ke kosong)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ParsedData } from "@/lib/excel-parser";

// ── Tipe ─────────────────────────────────────────────────────────────────────

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string }
  | { status: "success"; fileName: string; reportMonth: string }
  | { status: "error"; message: string };

interface DataContextValue {
  /** Seluruh data hasil parsing Excel. null = belum ada data. */
  data: ParsedData | null;
  /** True selama fetch awal atau refresh berlangsung. */
  loading: boolean;
  /** Pesan error fetch terakhir. null jika tidak ada error. */
  error: string | null;
  /** Status proses upload file Excel. */
  uploadState: UploadState;

  /** Fetch ulang data dari server (/api/data). */
  refresh: () => Promise<void>;
  /** Upload file .xlsx ke /api/upload lalu refresh data. */
  uploadFile: (file: File) => Promise<void>;
  /** Reset data server (DELETE /api/data) lalu clear state lokal. */
  resetData: () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });

  // ── Fetch data dari server ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data");
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error ?? "Gagal memuat data dari server.");
      }

      setData(json.data ?? null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upload file Excel ───────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (file: File) => {
      setUploadState({ status: "uploading", fileName: file.name });
      setError(null);

      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json();

        if (!json.success) {
          throw new Error(json.error ?? "Gagal mengupload file.");
        }

        setUploadState({
          status: "success",
          fileName: json.fileName,
          reportMonth: json.data?.reportMonth ?? "",
        });

        // Refresh context dengan data terbaru dari server
        await refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat upload.";
        setUploadState({ status: "error", message: msg });
        setError(msg);
      }
    },
    [refresh]
  );

  // ── Reset data ──────────────────────────────────────────────────────────────
  const resetData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/data", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error ?? "Gagal mereset data.");
      }
      setData(null);
      setUploadState({ status: "idle" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat reset.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch awal saat mount ───────────────────────────────────────────────────
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DataContext.Provider
      value={{ data, loading, error, uploadState, refresh, uploadFile, resetData }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useData harus dipakai di dalam <DataProvider>.");
  }
  return ctx;
}
