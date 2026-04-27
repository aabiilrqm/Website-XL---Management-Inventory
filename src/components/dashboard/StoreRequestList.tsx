import { storeRequests } from "@/lib/dummy-data";

export default function StoreRequestList() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Request Stok Toko
          </h3>
          <p className="text-sm text-slate-500">
            Permintaan stok dari pemilik toko.
          </p>
        </div>

        <button className="rounded-2xl bg-[#0E33BC] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          Lihat Semua
        </button>
      </div>

      <div className="space-y-3">
        {storeRequests.map((request) => (
          <div
            key={`${request.store}-${request.item}`}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{request.store}</p>
                <p className="mt-1 text-sm text-slate-500">{request.item}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Jumlah: {request.qty}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  request.status === "Diproses"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {request.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
