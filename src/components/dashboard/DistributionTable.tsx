import { distributions } from "@/lib/dummy-data";

export default function DistributionTable() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-slate-900">Distribusi Terbaru</h3>
        <p className="text-sm text-slate-500">
          Riwayat pengiriman kartu dari gudang ke toko.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3 font-semibold">Tanggal</th>
              <th className="pb-3 font-semibold">Toko</th>
              <th className="pb-3 font-semibold">Barang</th>
              <th className="pb-3 font-semibold">Jumlah</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>

          <tbody>
            {distributions.map((item) => (
              <tr
                key={`${item.date}-${item.store}-${item.item}`}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-4 text-slate-600">{item.date}</td>
                <td className="py-4 font-medium text-slate-900">
                  {item.store}
                </td>
                <td className="py-4 text-slate-600">{item.item}</td>
                <td className="py-4 text-slate-600">{item.qty}</td>
                <td className="py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      item.status === "Terkirim"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
