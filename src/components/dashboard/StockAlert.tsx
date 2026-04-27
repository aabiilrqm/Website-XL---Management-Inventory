import { AlertTriangle } from "lucide-react";
import { lowStockItems } from "@/lib/dummy-data";

export default function StockAlert() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Peringatan Stok Rendah
          </h3>
          <p className="text-sm text-slate-500">
            Barang yang mendekati batas minimum gudang.
          </p>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
          <AlertTriangle size={22} />
        </div>
      </div>

      <div className="space-y-4">
        {lowStockItems.map((item) => {
          const percentage = Math.min((item.stock / item.threshold) * 100, 100);

          return (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <p className="font-medium text-slate-700">{item.name}</p>
                <p className="text-slate-500">
                  {item.stock} / {item.threshold}
                </p>
              </div>

              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-[#1ACAA2]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
