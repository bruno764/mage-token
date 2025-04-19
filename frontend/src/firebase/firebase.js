// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDvn9ou5izyZO63zzOByCXCP0UR6d0hM5M",
  authDomain: "mage-token.firebaseapp.com",
  projectId: "mage-token",
  storageBucket: "mage-token.appspot.com", // <--- aqui estava errado
  messagingSenderId: "373789026374",
  appId: "1:373789026374:web:8e48d2d1e792f3b5fe8247",
  measurementId: "G-L1FB6ZG216"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
