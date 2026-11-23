"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart3, Eye, EyeOff, Loader2, ShieldCheck, Warehouse } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      if (code === "auth/invalid-credential") {
        setError("Email atau password salah.");
      } else {
        setError("Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <aside className="auth-brand">
        <div className="flex items-center gap-3">
          <span className="xl-mark" aria-hidden="true">
            XL
          </span>
          <span className="text-sm font-semibold tracking-wide text-blue-100/90">
            XL AXIATA · INVENTARIS
          </span>
        </div>

        <div className="my-auto py-8">
          <strong>Inventory XL</strong>
          <p className="mt-3 max-w-md leading-relaxed">
            Pantau stok produk, analisis kesehatan persediaan, dan distribusi antar gudang Sulawesi Selatan dalam satu tampilan modern.
          </p>

          <div className="mt-8 hidden flex-wrap gap-2.5 lg:flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <BarChart3 size={14} aria-hidden="true" />
              Grafik Interaktif
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Warehouse size={14} aria-hidden="true" />
              Multi-Gudang
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <ShieldCheck size={14} aria-hidden="true" />
              Audit Data Excel
            </span>
          </div>
        </div>

        <p className="hidden text-xs text-blue-200/75 lg:block">
          Regional Sulawesi Selatan · Manajemen Stok Terpadu
        </p>
      </aside>

      <main className="auth-form">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0E33BC]">
            Selamat Datang Kembali
          </p>
          <h1 className="mt-1 font-extrabold text-slate-900">Masuk ke Akun</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Akses dashboard manajemen persediaan XL
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 transition hover:border-slate-300 focus:border-[#0E33BC] focus:outline-none"
              placeholder="admin@xl.co.id"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-11 text-sm text-slate-900 transition hover:border-slate-300 focus:border-[#0E33BC] focus:outline-none"
                placeholder="Masukkan password"
              />
              <button
                type="button"
                aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0E33BC] py-3 text-sm font-semibold text-white shadow-sm shadow-[#0E33BC]/25 transition hover:bg-[#0A2796] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                Memproses…
              </>
            ) : (
              <>
                Masuk
                <ArrowRight size={16} aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#0E33BC] hover:underline"
          >
            Daftar sekarang
          </Link>
        </p>
      </main>
    </div>
  );
}
