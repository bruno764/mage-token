import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        console.warn("Usuário não encontrado no Firestore.");
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) return <div className="text-white text-center py-20">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white px-6 py-10 font-sans">
      <div className="max-w-xl mx-auto bg-[#1c152b] p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">👤 Meu Painel</h1>

        {userData ? (
          <>
            <p><span className="font-bold">Email:</span> {userData.email}</p>
            <p><span className="font-bold">Plano:</span> {userData.isPremium ? "Premium" : "Grátis"}</p>
            <p><span className="font-bold">Criado em:</span> {new Date(userData.createdAt).toLocaleString()}</p>
          </>
        ) : (
          <p className="text-gray-400 text-center">Dados não encontrados.</p>
        )}

        <button
          onClick={() => {
            auth.signOut();
            navigate("/auth");
          }}
          className="mt-6 w-full bg-orange-500 hover:bg-orange-600 transition py-3 rounded font-bold text-white"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
