import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";
import StockAlert from "@/components/dashboard/StockAlert";
import StoreRequestList from "@/components/dashboard/StoreRequestList";
import DistributionTable from "@/components/dashboard/DistributionTable";
import { stats } from "@/lib/dummy-data";

export default function Home() {
  return (
    <main className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full">
        <Sidebar />

        <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar />

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section className="rounded-4xl bg-linear-to-r from-[#0E33BC] via-blue-700 to-slate-900 p-6 text-white shadow-sm">
              <div className="max-w-3xl">
                <p className="text-sm font-medium text-blue-100">
                  Monitoring Inventory & Distribusi
                </p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                  Kelola stok kartu dari gudang utama ke seluruh toko mitra.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                  Dashboard ini membantu admin memantau stok gudang, distribusi
                  ke toko, request stok dari pemilik toko, dan peringatan stok
                  yang mulai menipis.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="rounded-2xl bg-[#1ACAA2] px-5 py-3 text-sm font-bold text-slate-950 hover:opacity-90">
                  Tambah Data Masuk
                </button>
                <button className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                  Buat Distribusi
                </button>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((item) => (
                <StatCard
                  key={item.title}
                  title={item.title}
                  value={item.value}
                  description={item.description}
                />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <StockAlert />
              <StoreRequestList />
            </section>

            <DistributionTable />
          </div>
        </section>
      </div>
    </main>
  );
}
