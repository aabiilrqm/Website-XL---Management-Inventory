"use client";

/**
 * UploadButton.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Path : src/components/dashboard/UploadButton.tsx
 *
 * Tombol upload file Excel (.xlsx) yang bisa diletakkan di mana saja.
 * Menggunakan DataContext untuk proses upload dan menampilkan status.
 *
 * Cara pakai:
 *   import UploadButton from "@/components/dashboard/UploadButton";
 *   <UploadButton />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef } from "react";
import { Upload, CheckCircle, Loader2, AlertCircle, X } from "lucide-react";
import { useData } from "@/context/DataContext";

export default function UploadButton() {
  const { uploadState, uploadFile, resetData } = useData();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input agar file yang sama bisa diupload ulang
    e.target.value = "";
    await uploadFile(file);
  };

  const handleClick = () => inputRef.current?.click();

  // ── Render berdasarkan status ─────────────────────────────────────────────

  if (uploadState.status === "uploading") {
    return (
      <div className="flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
        <Loader2 size={16} className="animate-spin" />
        <span>Memproses <strong>{uploadState.fileName}</strong>…</span>
      </div>
    );
  }

  if (uploadState.status === "success") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          <CheckCircle size={16} />
          <span>
            Data <strong>{uploadState.reportMonth}</strong> aktif
          </span>
        </div>
        <button
          onClick={resetData}
          title="Reset data"
          className="rounded-2xl border border-slate-200 p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (uploadState.status === "error") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-700">
          <AlertCircle size={16} />
          <span>Upload gagal</span>
        </div>
        <button
          onClick={handleClick}
          className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
        >
          <Upload size={16} />
          Coba Lagi
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // idle
  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition"
      >
        <Upload size={16} />
        Upload Excel
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
