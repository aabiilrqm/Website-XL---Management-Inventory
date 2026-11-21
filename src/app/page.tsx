"use client";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import InventoryDashboard from "@/components/dashboard/InventoryDashboard";
export default function Home() {
  return <main className="h-screen overflow-hidden bg-slate-50"><div className="flex h-full">
    <Sidebar /><section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden"><Topbar />
      <div className="flex-1 overflow-y-auto p-6"><InventoryDashboard /></div>
    </section>
  </div></main>;
}
