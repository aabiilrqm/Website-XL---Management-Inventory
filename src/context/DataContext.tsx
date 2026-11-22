"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ParsedData, ImportOptions } from "@/lib/excel-parser";

import { useAuth } from "./AuthContext";
import type { ReportInfo } from "@/lib/report-archive";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

export type UploadState =
  | { status: "idle" }
  | { status: "uploading"; fileName: string }
  | { status: "success"; fileName: string; reportMonth: string }
  | { status: "error"; message: string };
interface DataContextValue {
  data: ParsedData | null; loading: boolean; error: string | null; uploadState: UploadState;
  refresh: () => Promise<void>; uploadFile: (file: File, options?: ImportOptions, period?: string) => Promise<boolean>;
  reports: ReportInfo[]; selected: string; selectReport: (id: string) => Promise<void>;
}
const DataContext = createContext<DataContextValue | null>(null);
const message = (err: unknown) => err instanceof Error ? err.message : "Terjadi kesalahan jaringan.";
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const version = useRef(0);
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportInfo[]>([]);
  const [selected, setSelected] = useState("");
  const selectReport = useCallback(async (id: string) => {
    const request = ++version.current;
    setLoading(true); setError(null);
    try {
      if (!user) { setData(null); setReports([]); setSelected(""); return; }
      const response = await authenticatedFetch("/api/data" + (id ? "?id=" + encodeURIComponent(id) : ""), { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      if (version.current === request) { setData(json.data); setReports(json.reports); setSelected(json.id ?? ""); }
    } catch (err) { if (version.current === request) setError(message(err)); }
    finally { if (version.current === request) setLoading(false); }
  }, [user]);
  const refresh = useCallback(() => selectReport(selected), [selectReport, selected]);
  useEffect(() => {
    let active = true;
    const requests = version;
    void Promise.resolve().then(() => {
      if (active) void selectReport("");
    });
    return () => {
      active = false;
      requests.current++;
    };
  }, [selectReport]);
  const uploadFile = useCallback(async (file: File, options?: ImportOptions, period?: string) => {
    setUploadState({ status: "uploading", fileName: file.name });
    setError(null);
    try {
      const form = new FormData(); form.append("file", file);
      if (period) form.append("period", period);
      if (options) form.append("mapping", JSON.stringify(options));
      const res = await authenticatedFetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "Gagal mengimpor laporan.");
      version.current++;
      setData(json.data); setSelected(json.id);
      await selectReport(json.id);
      setUploadState({ status: "success", fileName: file.name, reportMonth: json.data.reportMonth });
      return true;
    } catch (err) {
      setUploadState({ status: "error", message: message(err) });
      return false;
    }
  }, [selectReport]);
  return <DataContext.Provider value={{ data, loading, error, uploadState, refresh, uploadFile, reports, selected, selectReport }}>{children}</DataContext.Provider>;
}
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData harus dipakai di dalam DataProvider.");
  return ctx;
}
