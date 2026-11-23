"use client";


import Workspace from "@/components/dashboard/Workspace";
import InventoryDashboard from "@/components/dashboard/InventoryDashboard";

export default function GudangPage() {
  return (
    <Workspace>
            <InventoryDashboard view="warehouse" />
          </Workspace>
  );
}
