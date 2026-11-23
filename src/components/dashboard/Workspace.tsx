"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserRound,
  Warehouse,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UploadButton from "./UploadButton";

const sections = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stok-produk", label: "Stok Produk", icon: Package },
  { href: "/gudang", label: "Gudang", icon: Warehouse },
] as const;

export default function Workspace({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const displayName =
    user?.displayName?.trim() || user?.email?.split("@")[0] || "Akun";
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "XL";

  return (
    <div className="workspace">
      <header className="workspace-header">
        <div className="workspace-bar">
          <Link href="/" className="brand">
            <span className="xl-mark" aria-hidden="true">
              XL
            </span>
            <span className="brand-name">
              Inventory <span className="brand-accent">XL</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="section-tabs">
            {sections.map(({ href, label, icon: Icon }) => {
              const active =
                path === href || (href === "/" && path === "/dashboard");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    size={15}
                    aria-hidden="true"
                    className={active ? "text-[#0E33BC]" : "opacity-75"}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="workspace-tools">
            <UploadButton />

            <div className="account-menu" ref={menuRef}>
              <button
                type="button"
                className="account-trigger"
                aria-label="Menu akun"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0E33BC] text-xs font-bold text-white"
                >
                  {initials}
                </span>
                <span className="hidden max-w-28 truncate text-slate-700 lg:inline">
                  {displayName}
                </span>
                <ChevronDown
                  size={14}
                  aria-hidden="true"
                  className={`text-slate-400 transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {menuOpen && (
                <div className="account-options" role="menu">
                  {user?.email && (
                    <div className="mb-1 border-b border-slate-100 px-3 py-2">
                      <p className="truncate text-xs font-semibold text-slate-800">
                        {displayName}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  )}
                  <Link
                    href="/profil"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={15} aria-hidden="true" />
                    Profil Saya
                  </Link>
                  <Link
                    href="/pengaturan"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings size={15} aria-hidden="true" />
                    Pengaturan
                  </Link>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    type="button"
                    role="menuitem"
                    className="!text-rose-600 hover:!bg-rose-50"
                    onClick={async () => {
                      setMenuOpen(false);
                      await logout();
                      router.push("/login");
                    }}
                  >
                    <LogOut size={15} aria-hidden="true" />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="workspace-content animate-fade-up">{children}</main>
    </div>
  );
}
