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
    const user = auth.currentUser;
    if (!user) return;

    const validade = new Date();
    validade.setMonth(validade.getMonth() + 1);

    try {
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

  const renderTabContent = () => {
    switch (activeTab) {
      case "telegram":
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold">🔮 Disparo via Telegram (Conta Real)</h3>

            <input
              placeholder="Seu número de telefone (+55...)"
              ref={telegramTokenRef}
              className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
            />

            <button
              onClick={async () => {
                const phone = telegramTokenRef.current.value;
                if (!phone) return alert("Digite seu número de telefone.");
                const res = await fetch("http://localhost:8000/start-login", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone }),
                });
                const result = await res.json();
                alert(result.status || result.error);
              }}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded font-bold text-white"
            >
              📩 Enviar código para Telegram
            </button>

            <input
              type="text"
              placeholder="Código recebido no Telegram"
              id="codeInput"
              className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
            />

            <button
              onClick={async () => {
                const phone = telegramTokenRef.current.value;
                const code = document.getElementById("codeInput").value;
                if (!code) return alert("Digite o código recebido.");
                const res = await fetch("http://localhost:8000/verify-code", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone, code }),
                });
                const result = await res.json();
                alert(result.status || result.error);
              }}
              className="bg-green-700 hover:bg-green-800 px-6 py-3 rounded font-bold text-white"
            >
              ✅ Confirmar Código
            </button>

            <textarea
              ref={messageRef}
              rows={5}
              placeholder="Escreva sua mensagem..."
              className="w-full p-4 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
            />

            <button
              onClick={async () => {
                const phone = telegramTokenRef.current.value;
                const message = messageRef.current.value;
                const recipient = prompt("Digite o @username ou número de quem vai receber:");

                if (!phone || !message || !recipient) return alert("Preencha todos os campos.");
                const res = await fetch("http://localhost:8000/send", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone, message, recipient }),
                });
                const result = await res.json();
                alert(result.status || result.error);
              }}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-bold text-white"
            >
              🚀 Enviar Mensagem
            </button>
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
        <hr className="my-4 border-gray-600" />
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
