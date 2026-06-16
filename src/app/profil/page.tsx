"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Camera,
  Save,
} from "lucide-react";
import { useState } from "react";

export default function ProfilPage() {
  const [profile, setProfile] = useState({
    name: "Andi Saputra",
    email: "andi.saputra@xl.co.id",
    phone: "0812-3456-7890",
    position: "Kepala Gudang Makassar",
    warehouse: "Gudang Makassar",
    address: "Jl. Urip Sumoharjo No. 123, Makassar, Sulawesi Selatan",
    joinDate: "1 Januari 2020",
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    setIsEditing(false);
    alert("Profil berhasil disimpan!");
  };

  return (
    <main className="h-screen overflow-hidden bg-slate-50">
      <div className="flex h-full">
        <Sidebar />
        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 overflow-y-auto p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
              <p className="text-sm text-slate-500">
                Kelola informasi akun dan data diri Anda
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Sidebar Profil */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                <div className="relative mx-auto h-28 w-28">
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#0E33BC] text-4xl font-bold text-white">
                    AS
                  </div>
                  <button className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-md border border-slate-200">
                    <Camera size={16} className="text-slate-600" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-bold text-slate-900">
                  {profile.name}
                </h2>
                <p className="text-sm text-slate-500">{profile.position}</p>
                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Bergabung sejak</p>
                  <p className="text-sm font-medium text-slate-900">
                    {profile.joinDate}
                  </p>
                </div>
              </div>

              {/* Form Profil */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">
                    Informasi Pribadi
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Edit Profil
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
                      >
                        <Save size={16} />
                        Simpan
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <User size={16} /> Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Mail size={16} /> Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Phone size={16} /> Telepon
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <Building size={16} /> Posisi
                    </label>
                    <input
                      type="text"
                      value={profile.position}
                      onChange={(e) =>
                        setProfile({ ...profile, position: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin size={16} /> Gudang
                    </label>
                    <input
                      type="text"
                      value={profile.warehouse}
                      onChange={(e) =>
                        setProfile({ ...profile, warehouse: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <MapPin size={16} /> Alamat
                    </label>
                    <textarea
                      value={profile.address}
                      onChange={(e) =>
                        setProfile({ ...profile, address: e.target.value })
                      }
                      disabled={!isEditing}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
