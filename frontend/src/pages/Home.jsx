import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("telegram");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const messageRef = useRef();
  const typeRef = useRef();
  const fileRef = useRef();
  const telegramTokenRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
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
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUpgrade = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const validade = new Date();
      validade.setMonth(validade.getMonth() + 1);

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        ...userData,
        isPremium: true,
        validUntil: validade.toISOString(),
      });

      setUserData((prev) => ({
        ...prev,
        isPremium: true,
        validUntil: validade.toISOString(),
      }));
    } catch (err) {
      console.error("Erro ao ativar plano premium:", err);
    }
  };

  const handleConnectTelegram = async () => {
    const telegramToken = telegramTokenRef.current.value;
    const user = auth.currentUser;
    if (!telegramToken) return alert("Insira o token do seu Bot do Telegram.");
    if (!user) return alert("Usuário não autenticado.");

    try {
      const response = await fetch("https://mage-token-backend-production.up.railway.app/api/connect-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          telegramToken,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("✅ Telegram conectado com sucesso!");
      } else {
        alert("❌ Erro ao conectar Telegram.");
      }
    } catch (err) {
      console.error("Erro:", err);
      alert("❌ Erro ao conectar Telegram.");
    }
  };

  const handleStartCampaign = async () => {
    const message = messageRef.current.value;
    const type = typeRef.current.value;
    const file = fileRef.current.files[0];
    const user = auth.currentUser;

    if (!user) return alert("Usuário não autenticado.");
    if (!message) return alert("Escreva uma mensagem.");
    if (!type) return alert("Escolha um tipo de envio.");

    const formData = new FormData();
    formData.append("message", message);
    formData.append("type", type);
    formData.append("uid", user.uid);
    if (file) formData.append("file", file);

    try {
      const response = await fetch("https://mage-token-backend-production.up.railway.app/api/send-telegram", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      alert("✅ Campanha iniciada: " + result.status);
    } catch (err) {
      console.error("Erro ao enviar:", err);
      alert("❌ Erro ao iniciar campanha.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "telegram":
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">🔮 Disparo via Telegram</h3>

            <input
              ref={telegramTokenRef}
              placeholder="Seu token do bot do Telegram"
              className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
            />
            <button
              onClick={handleConnectTelegram}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-bold text-white"
            >
              🔗 Conectar Telegram
            </button>

            <textarea
              ref={messageRef}
              rows={5}
              placeholder="Escreva sua mensagem aqui..."
              className="w-full p-4 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
            />

            <div className="grid md:grid-cols-2 gap-4">
              <select ref={typeRef} className="bg-gray-800 text-white p-3 rounded">
                <option value="pv">Privado (PV)</option>
                <option value="grupo">Grupo</option>
                <option value="resposta">Resposta a mensagens</option>
              </select>

              <input
                ref={fileRef}
                type="file"
                className="bg-gray-800 text-white p-3 rounded cursor-pointer"
              />
            </div>

            <div className="flex gap-4 mt-4">
              <button
                onClick={handleStartCampaign}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded font-bold"
              >
                ▶️ Iniciar Envio
              </button>
              <button className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold">
                ⛔ Parar Campanha
              </button>
            </div>
          </div>
        );
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
      case "upgrade":
        return (
          <div>
            <h3 className="text-2xl font-bold mb-4">💳 Upgrade de Plano</h3>
            {userData?.isPremium ? (
              <div className="text-green-400">
                Você já é um membro <strong>Premium</strong>! <br />
                Validade:{" "}
                <span className="text-white font-semibold">
                  {new Date(userData.validUntil).toLocaleDateString()}
                </span>
              </div>
            ) : (
              <>
                <p className="text-gray-300 mb-4">
                  Faça upgrade e tenha acesso a todas as plataformas sem limites,
                  com suporte prioritário e ferramentas exclusivas.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="bg-orange-500 hover:bg-orange-600 px-6 py-3 rounded font-bold"
                >
                  Ativar Premium (R$ 49/mês)
                </button>
              </>
            )}
          </div>
        );
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
        <button onClick={() => setActiveTab("upgrade")} className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded">💳 Upgrade de Plano</button>
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
              <p><span className="font-bold">Plano:</span> {userData.isPremium ? "Premium" : "Grátis"}</p>
              <p><span className="font-bold">Criado em:</span> {new Date(userData.createdAt).toLocaleString()}</p>
              {userData.isPremium && userData.validUntil && (
                <p><span className="font-bold">Válido até:</span> {new Date(userData.validUntil).toLocaleDateString()}</p>
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
