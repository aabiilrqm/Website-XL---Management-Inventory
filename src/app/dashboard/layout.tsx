// app/dashboard/layout.tsx
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <main className="h-screen overflow-hidden bg-slate-50">
        <div className="flex h-full">
          <Sidebar />
          <section className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
            <Topbar />
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}
