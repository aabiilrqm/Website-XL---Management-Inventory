// app/dashboard/layout.tsx
"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

import Workspace from "@/components/dashboard/Workspace";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Workspace>{children}</Workspace>
    </ProtectedRoute>
  );
}
