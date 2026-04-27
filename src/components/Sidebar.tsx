import {
  LayoutDashboard,
  Package,
  Store,
  Truck,
  ClipboardList,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Inventory",
    icon: Package,
  },
  {
    label: "Toko Mitra",
    icon: Store,
  },
  {
    label: "Distribusi",
    icon: Truck,
  },
  {
    label: "Request Stok",
    icon: ClipboardList,
  },
  {
    label: "Pengaturan",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0E33BC] text-lg font-bold text-white">
            XL
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Inventory XL</h1>
            <p className="text-sm text-slate-500">Makassar Warehouse</p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                item.active
                  ? "bg-[#0E33BC] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 rounded-3xl bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Role Aktif</p>
        <p className="mt-1 text-sm text-slate-500">
          Admin gudang dapat melihat stok utama, request toko, dan distribusi.
        </p>
      </div>
    </aside>
  );
}
