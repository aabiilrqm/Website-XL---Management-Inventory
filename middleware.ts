// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("firebase-auth-token")?.value;

  // Jika tidak ada token dan sedang mengakses halaman protected, redirect ke login
  const protectedPaths = [
    "/",
    "/stok-produk",
    "/gudang",
    "/notifikasi",
    "/profil",
    "/pengaturan",
  ];
  const pathname = request.nextUrl.pathname;

  if (protectedPaths.includes(pathname) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Jika sudah login dan mengakses login/register, redirect ke dashboard
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
