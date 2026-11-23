"use client";

import { useState } from "react";
import {
  Building,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  User,
} from "lucide-react";
import Workspace from "@/components/dashboard/Workspace";
import { useAuth } from "@/context/AuthContext";
import { fieldClass, panel } from "@/components/dashboard/inventory-ui";

export default function ProfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.displayName || "Andi Saputra",
    email: user?.email || "andi.saputra@xl.co.id",
    phone: "0812-3456-7890",
    position: "Kepala Gudang Makassar",
    warehouse: "Gudang Makassar",
    address: "Jl. Urip Sumoharjo No. 123, Makassar, Sulawesi Selatan",
    joinDate: "1 Januari 2020",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const initials =
    profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "XL";

  const handleSave = () => {
    setIsEditing(false);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 3200);
  };

  return (
    <Workspace>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0E33BC]">
              Akun Pengguna
            </p>
            <h1 className="mt-1 font-extrabold text-slate-900">Profil Saya</h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola informasi akun dan identitas operasional gudang Anda.
            </p>
          </div>
          {savedNotice && (
            <div
              role="status"
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              Perubahan profil berhasil disimpan
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Sidebar Profil */}
          <section className={panel + " flex flex-col items-center text-center"}>
            <div className="relative mt-2 h-28 w-28">
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#091F66] via-[#0E33BC] to-[#09A9A7] text-3xl font-extrabold text-white shadow-lg shadow-[#0E33BC]/25">
                {initials}
              </div>
              <button
                type="button"
                aria-label="Ubah foto profil"
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-[#0E33BC] hover:text-[#0E33BC]"
              >
                <Camera size={15} aria-hidden="true" />
              </button>
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              {profile.name}
            </h2>
            <p className="text-xs font-medium text-slate-500">{profile.position}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-[#EEF3FF] px-3 py-1 text-[11px] font-semibold text-[#0E33BC]">
              {profile.warehouse}
            </span>

            <div className="mt-6 w-full rounded-2xl bg-slate-50 p-3.5 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Bergabung Sejak
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800">
                {profile.joinDate}
              </p>
            </div>
          </section>

          {/* Form Profil */}
          <section className={panel + " lg:col-span-2"}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Informasi Pribadi
                </h2>
                <p className="text-xs text-slate-500">
                  Perbarui data kontak dan penugasan gudang Anda.
                </p>
              </div>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#0E33BC] hover:text-[#0E33BC]"
                >
                  <Pencil size={13} aria-hidden="true" />
                  Edit Profil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E33BC] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#0A2796]"
                  >
                    <Save size={14} aria-hidden="true" />
                    Simpan
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} className="text-[#0E33BC]" aria-hidden="true" />
                  Nama Lengkap
                </span>
                <input
                  type="text"
                  autoComplete="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Mail size={14} className="text-[#0E33BC]" aria-hidden="true" />
                  Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  disabled={!isEditing}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={14} className="text-[#0E33BC]" aria-hidden="true" />
                  Telepon
                </span>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  <Building size={14} className="text-[#0E33BC]" aria-hidden="true" />
                  Posisi
                </span>
                <input
                  type="text"
                  value={profile.position}
                  onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                  disabled={!isEditing}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#09A9A7]" aria-hidden="true" />
                  Gudang Utama
                </span>
                <input
                  type="text"
                  value={profile.warehouse}
                  onChange={(e) => setProfile({ ...profile, warehouse: e.target.value })}
                  disabled={!isEditing}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-semibold text-slate-700 sm:col-span-2">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#09A9A7]" aria-hidden="true" />
                  Alamat Kantor / Gudang
                </span>
                <textarea
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className={fieldClass + " py-2.5 disabled:bg-slate-50 disabled:text-slate-500"}
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </Workspace>
  );
}
