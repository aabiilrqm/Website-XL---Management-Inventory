import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import StatCard from "@/components/StatCard";

export default function Home() {
  return (
    <div>
      <Topbar />
      <Sidebar />
    </div>
  );
}
