"use client";

import { auth } from "./firebase";

function returnToLogin() {
  document.cookie = "firebase-auth-token=; Path=/; Max-Age=0; SameSite=Lax";
  window.location.assign("/login");
}

/** Wait for persisted sign-in, then retry an expired token once. */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) {
    returnToLogin();
    throw new Error("Silakan masuk untuk mengunggah dan melihat laporan.");
  }

  async function send(forceRefresh: boolean) {
    const token = await user!.getIdToken(forceRefresh);
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  }

  try {
    let response = await send(false);
    if (response.status === 401) response = await send(true);
    return response;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (["auth/user-token-expired", "auth/invalid-user-token", "auth/user-disabled"].includes(code ?? "")) {
      returnToLogin();
      throw new Error("Sesi login berakhir. Silakan masuk kembali.");
    }
    throw error;
  }
}
