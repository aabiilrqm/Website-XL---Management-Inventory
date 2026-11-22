import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { createHash, randomUUID } from "node:crypto";
import type { ParsedData } from "./excel-parser";

function app() {
  const key = process.cwd() + "/serviceAccountKey.json";
  return getApps()[0] ?? initializeApp({ credential: existsSync(key) ? cert(key) : applicationDefault() });
}

export async function authenticated(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  try {
    return (await getAuth(app()).verifyIdToken(token)).uid;
  } catch (error) {
    console.error("[Firebase token verification]", (error as { code?: string }).code ?? "unknown");
    return null;
  }
}

function reports() { return getFirestore(app()).collection("inventoryReports"); }
export interface ReportInfo { id: string; month: string; file: string; uploaded: string }

export async function archive(data: ParsedData, legacy = false, original?: Buffer) {
  const json = JSON.stringify(data);
  const id = legacy ? createHash("sha256").update(json).digest("hex") : randomUUID();
  const ref = reports().doc(id);
  if (legacy && (await ref.get()).exists) return id;
  const bytes = gzipSync(json);
  const size = 500000;
  const count = Math.ceil(bytes.length / size);
  // Publish metadata only after all pieces are durable. Readers only list published reports.
  for (let i = 0; i < count; i++) {
    await ref.collection("parts").doc(String(i)).set({ bytes: bytes.subarray(i * size, (i + 1) * size) });
  }
  if (original) {
    for (let offset = 0; offset < original.length; offset += size) {
      await ref.collection("workbook").doc(String(offset / size)).set({ bytes: original.subarray(offset, offset + size) });
    }
  }
  await ref.set({ month: data.reportMonth, uploaded: data.lastUpdated, file: data.preprocessing.fileName, originalBytes: original?.length ?? 0, count });
  return id;
}

export async function listReports(): Promise<ReportInfo[]> {
  const snapshot = await reports().orderBy("uploaded", "desc").select("month", "file", "uploaded").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportInfo));
}

export async function readReport(id: string) {
  const ref = reports().doc(id);
  const meta = await ref.get();
  if (!meta.exists) return null;
  const parts = await ref.collection("parts").get();
  const bytes = parts.docs.sort((a,b) => Number(a.id)-Number(b.id)).map(doc => doc.get("bytes") as Buffer);
  if (bytes.length !== meta.get("count")) throw new Error("Arsip laporan belum lengkap.");
  return JSON.parse(gunzipSync(Buffer.concat(bytes)).toString()) as ParsedData;
}
