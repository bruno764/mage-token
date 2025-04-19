import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function Auth() {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setError("");

    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", result.user.uid), {
          email: result.user.email,
          createdAt: new Date().toISOString(),
          isPremium: false,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Erro ao autenticar. Verifique suas credenciais.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center px-4">
      <div className="bg-[#1c152b] w-full max-w-md p-8 rounded-xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-white">
          {isRegistering ? "Criar Conta" : "Entrar"}
        </h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="w-full mb-6 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleAuth}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 transition py-3 rounded text-white font-bold mb-4"
        >
          {loading ? "Carregando..." : isRegistering ? "Registrar" : "Entrar"}
        </button>

        <p className="text-gray-400 text-center text-sm">
          {isRegistering ? (
            <>
              Já tem uma conta?{" "}
              <button
                onClick={() => setIsRegistering(false)}
                className="text-orange-400 font-semibold underline"
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              Ainda não tem conta?{" "}
              <button
                onClick={() => setIsRegistering(true)}
                className="text-orange-400 font-semibold underline"
              >
                Registrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
