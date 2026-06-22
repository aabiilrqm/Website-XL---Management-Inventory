// scripts/seed.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import dotenv from "dotenv";

// Load environment variables dari .env.local
dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi Firebase (jika belum ada)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Data dummy yang akan di-seed
const dummyStocks = [
  {
    product: "VD Unlimited Harian 2GB 28H",
    warehouse: "Makassar",
    stock: 12,
    minStock: 50,
    sold: 320,
    status: "Menipis",
    price: 50000,
  },
  {
    product: "VD UNL 2GB 7Hr",
    warehouse: "Makassar",
    stock: 62,
    minStock: 30,
    sold: 215,
    status: "Aman",
    price: 35000,
  },
  // ... tambahkan data lain sesuai kebutuhan
];

async function seed() {
  try {
    const stocksCollection = collection(db, "stocks");
    for (const stock of dummyStocks) {
      await addDoc(stocksCollection, stock);
      console.log(`✅ Added: ${stock.product}`);
    }
    console.log("🎉 Seeding selesai!");
  } catch (error) {
    console.error("❌ Error seeding:", error);
  }
}

seed();
