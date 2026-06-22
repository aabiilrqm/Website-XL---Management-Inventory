// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCollection } from "@/lib/firestore";
import StatCard from "@/components/dashboard/StatCard";
// ... import lainnya

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalOrder: 0,
    totalRevenue: "Rp 0",
    lowStock: 0,
    activeWarehouses: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      // Ambil data dari Firestore
      const products = await getCollection<any>("products");
      const warehouses = await getCollection<any>("warehouses");

      // Hitung statistik
      const totalStock = products.reduce((acc, p) => acc + p.stock, 0);
      const lowStockCount = products.filter((p) => p.stock < p.minStock).length;

      setStats({
        totalOrder: totalStock,
        totalRevenue: "Rp 4,2M", // bisa hitung dari data penjualan
        lowStock: lowStockCount,
        activeWarehouses: warehouses.filter((w) => w.active).length,
      });
    };

    fetchData();
  }, []);

  // ... render dashboard
}
