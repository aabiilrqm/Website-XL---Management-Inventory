"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ParsedData, ImportOptions } from "@/lib/excel-parser";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string }
  | { status: "success"; fileName: string; reportMonth: string }
  | { status: "error"; message: string };
interface DataContextValue {
  data: ParsedData | null; loading: boolean; error: string | null; uploadState: UploadState;
  refresh: () => Promise<void>; uploadFile: (file: File, options?: ImportOptions) => Promise<boolean>;
  resetData: () => Promise<void>;
}
const DataContext = createContext<DataContextValue | null>(null);
async function readData(): Promise<ParsedData | null> {
  const res = await fetch("/api/data", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "Gagal memuat laporan.");
  return json.data ?? null;
}
const message = (err: unknown) => err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const version = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++version.current;
    setLoading(true); setError(null);
    try { const next = await readData(); if (version.current === request) setData(next); }
    catch (err) { if (version.current === request) setError(message(err)); }
    finally { if (version.current === request) setLoading(false); }
  }, []);
  useEffect(() => {
    const request = ++version.current;
    let active = true;
    readData().then(next => { if (active && version.current === request) setData(next); })
      .catch(err => { if (active && version.current === request) setError(message(err)); })
      .finally(() => { if (active && version.current === request) setLoading(false); });
    return () => { active = false; };
  }, []);
  const uploadFile = useCallback(async (file: File, options?: ImportOptions) => {
    setUploadState({ status: "uploading", fileName: file.name });
    setError(null);
    try {
      const form = new FormData(); form.append("file", file);
      if (options) form.append("mapping", JSON.stringify(options));
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Gagal mengimpor laporan.");
      version.current++;
      setData(json.data); setLoading(false);
      setUploadState({ status: "success", fileName: file.name, reportMonth: json.data.reportMonth });
      return true;
    } catch (err) {
      setUploadState({ status: "error", message: message(err) });
      return false;
    }
  }, []);
  const resetData = useCallback(async () => {
    const request = ++version.current;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/data", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Gagal mereset laporan.");
      if (request === version.current) { setData(null); setUploadState({ status: "idle" }); }
    } catch (err) { if (request === version.current) setError(message(err)); }
    finally { if (request === version.current) setLoading(false); }
  }, []);
  return <DataContext.Provider value={{ data, loading, error, uploadState, refresh, uploadFile, resetData }}>{children}</DataContext.Provider>;
}
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData harus dipakai di dalam DataProvider.");
  return ctx;
}
