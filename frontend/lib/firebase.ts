import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCL5X6al6p54ELIJmiMeEGGsF2jbVyCRz0",
  authDomain: "abas-d36ca.firebaseapp.com",
  projectId: "abas-d36ca",
  storageBucket: "abas-d36ca.firebasestorage.app",
  messagingSenderId: "727176599054",
  appId: "1:727176599054:web:b62b3fa544586759958e5f"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);