// lib/firestore.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// Generic function untuk mendapatkan semua dokumen dari koleksi
export async function getCollection<T>(collectionName: string): Promise<T[]> {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}

// Get single document
export async function getDocument<T>(
  collectionName: string,
  id: string,
): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

// Add document
export async function addDocument(collectionName: string, data: any) {
  return await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
  });
}

// Update document
export async function updateDocument(
  collectionName: string,
  id: string,
  data: any,
) {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

// Delete document
export async function deleteDocument(collectionName: string, id: string) {
  await deleteDoc(doc(db, collectionName, id));
}

// Query dengan filter
export async function queryCollection<T>(
  collectionName: string,
  field: string,
  operator: any,
  value: any,
): Promise<T[]> {
  const q = query(
    collection(db, collectionName),
    where(field, operator, value),
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T);
}
