
import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in:", result.user.email);
    } catch {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", result.user.uid), {
        email: result.user.email,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex items-center justify-center flex-col gap-4">
      <h2 className="text-2xl font-bold">Mage Token - Login</h2>
      <input
        className="p-2 text-black rounded"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="p-2 text-black rounded"
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleAuth} className="bg-blue-600 px-4 py-2 rounded">Sign In / Register</button>
    </div>
  );
}
