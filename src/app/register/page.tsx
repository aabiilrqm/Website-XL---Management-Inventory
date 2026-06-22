"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, confirmPassword);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      // Firebase error codes
      if (err.code === "auth/email-already-in-use") {
        setError("Email sudah digunakan.");
      } else if (err.code === "auth/weak-password") {
        setError("Password minimal 6 karakter.");
      } else {
        setError("Gagal mendaftar. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Daftar Akun</h1>
          <p className="text-sm text-slate-500">
            Buat akun untuk mengakses dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0E33BC] focus:outline-none"
              placeholder="admin@xl.co.id"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-[#0E33BC] focus:outline-none"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#0E33BC] py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-[#0E33BC] hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
