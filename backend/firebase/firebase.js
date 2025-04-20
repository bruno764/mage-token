import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS_JSON);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(credentials),
  });
}

export const db = admin.firestore();
