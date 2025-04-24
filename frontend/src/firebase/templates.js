import { auth, db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

// Salvar template
export async function saveTemplate(name, message) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");

  const ref = collection(db, "users", user.uid, "templates");
  await addDoc(ref, {
    name,
    message,
    created_at: serverTimestamp(),
  });
}

// Listar templates
export async function getTemplates() {
  const user = auth.currentUser;
  if (!user) return [];
  const ref = collection(db, "users", user.uid, "templates");
  const snap = await getDocs(ref);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Excluir template
export async function deleteTemplate(templateId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  const ref = doc(db, "users", user.uid, "templates", templateId);
  await deleteDoc(ref);
}
