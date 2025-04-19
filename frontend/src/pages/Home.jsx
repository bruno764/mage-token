import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("telegram");
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "telegram":
        return <div>🔮 Sistema de disparo via Telegram</div>;
      case "whatsapp":
        return <div>📱 Integração com WhatsApp</div>;
      case "facebook":
        return <div>📘 Facebook Sender</div>;
      case "discord":
        return <div>🎮 Bot para Discord</div>;
      case "x":
        return <div>🐦 Auto Reply / Auto DM no X</div>;
      case "estatisticas":
        return <div>📊 Estatísticas e Relatórios</div>;
      case "historico":
        return <div>🕓 Histórico de Campanhas</div>;
      default:
        return <div>Selecione uma plataforma.</div>;
    }
  };

  if (loading) return <div className="text-white text-center py-20">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex font-sans">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#1c152b] p-6 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6">📡 Plataformas</h2>
        <button onClick={() => setActiveTab("telegram")} className="w-full bg-gray-800 hover:bg-purple-700 py-2 rounded">Telegram</button>
        <button onClick={() => setActiveTab("whatsapp")} className="w-full bg-gray-800 hover:bg-green-600 py-2 rounded">WhatsApp</button>
        <button onClick={() => setActiveTab("facebook")} className="w-full bg-gray-800 hover:bg-blue-600 py-2 rounded">Facebook</button>
        <button onClick={() => setActiveTab("discord")} className="w-full bg-gray-800 hover:bg-indigo-600 py-2 rounded">Discord</button>
        <button onClick={() => setActiveTab("x")} className="w-full bg-gray-800 hover:bg-sky-600 py-2 rounded">X (Twitter)</button>
        <hr className="my-4 border-gray-600" />
        <button onClick={() => setActiveTab("estatisticas")} className="w-full bg-gray-800 hover:bg-cyan-600 py-2 rounded">📊 Estatísticas</button>
        <button onClick={() => setActiveTab("historico")} className="w-full bg-gray-800 hover:bg-orange-600 py-2 rounded">📜 Histórico</button>
        <button
          onClick={() => {
            auth.signOut();
            navigate("/auth");
          }}
          className="w-full mt-8 bg-red-600 hover:bg-red-700 transition py-2 rounded font-bold text-white"
        >
          Sair
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-8">
        <div className="bg-[#1c152b] p-6 rounded-xl mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">👤 Bem-vindo</h1>
          {userData ? (
            <>
              <p><span className="font-bold">Email:</span> {userData.email}</p>
              <p>
                <span className="font-bold">Plano:</span>{" "}
                {userData.isPremium ? "Premium" : "Grátis"}
              </p>
              <p>
                <span className="font-bold">Criado em:</span>{" "}
                {new Date(userData.createdAt).toLocaleString()}
              </p>
              {userData.isPremium && userData.validUntil && (
                <p>
                  <span className="font-bold">Válido até:</span>{" "}
                  {new Date(userData.validUntil).toLocaleDateString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400">Dados não encontrados.</p>
          )}
        </div>

        <div className="bg-[#1a1a2e] p-6 rounded-xl shadow-md min-h-[300px]">
          <h2 className="text-xl font-bold mb-4">🔧 Área de Controle</h2>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
