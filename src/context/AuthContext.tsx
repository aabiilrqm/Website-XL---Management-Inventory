// contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function syncSessionCookie(user: User | null) {
  const token = user ? await user.getIdToken() : "";
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `firebase-auth-token=${token}; Path=/; Max-Age=${user ? 3600 : 0}; SameSite=Lax${secure}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      void syncSessionCookie(user).catch(() => {
        document.cookie = "firebase-auth-token=; Path=/; Max-Age=0; SameSite=Lax";
      });
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncSessionCookie(result.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(userCredential.user, { displayName: name });
    await syncSessionCookie(userCredential.user);

    // Simpan data tambahan ke Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name,
      email,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
  };

  const logout = async () => {
    await signOut(auth);
    await syncSessionCookie(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
