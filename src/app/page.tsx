import Image from "next/image";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatCard from "@/components/dashboard/StatCard";

export default function Home() {
  return (
    <div>
      <Topbar />
      <Sidebar />
    </div>
  );
}
