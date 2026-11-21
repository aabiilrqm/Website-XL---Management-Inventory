"use client";

import { Suspense } from "react";
import { useData } from "@/context/DataContext";
import InventoryOverview from "./InventoryOverview";
import ProductStock from "./ProductStock";
import WarehouseSummary from "./WarehouseSummary";
import { fieldClass, panel } from "./inventory-ui";

const pageInfo = {
  overview: ["Dashboard", "Ringkasan utama persediaan dari seluruh gudang."],
  stock: ["Stok Produk", "Rincian stok, minimum, dan harga setiap produk per gudang."],
  warehouse: ["Gudang", "Rekap persediaan dan kondisi stok di setiap lokasi gudang."],
};

export default function InventoryDashboard({ view = "overview" }: { view?: keyof typeof pageInfo }) {
  const { data, loading, error, refresh } = useData();
  const [title, description] = pageInfo[view];
  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      {data && <p className="mt-2 text-xs text-slate-400">Periode {data.reportMonth} · Berdasarkan laporan yang diunggah</p>}
    </div>
    {error && <div role="alert" className={panel}>
      <p className="text-sm text-red-700">{error}</p>
      <button onClick={() => void refresh()} className={fieldClass + " mt-3"}>Coba lagi</button>
    </div>}
    {loading && !data ? <p role="status" className={panel}>Memuat laporan…</p>
      : !data || data.schemaVersion !== 2 ? <div className={panel}>
        <h2 className="font-semibold text-slate-900">Belum ada laporan yang dapat ditampilkan</h2>
        <p className="mt-2 text-sm text-slate-600">{data ? "Unggah ulang laporan untuk memperbarui format data." : "Gunakan Upload Excel di bagian atas untuk mulai melihat data persediaan."}</p>
      </div>
      : <Suspense fallback={<p role="status" className={panel}>Memuat rincian…</p>}>
        {view === "overview" ? <InventoryOverview data={data} />
          : view === "stock" ? <ProductStock key={data.lastUpdated} data={data} />
          : <WarehouseSummary key={data.lastUpdated} data={data} />}
      </Suspense>}
  </div>;
}
