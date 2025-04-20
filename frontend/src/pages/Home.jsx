// 🔧 Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const API_URL = "https://mage-token-production.up.railway.app";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("telegram");
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState({ users: [], groups: [] });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [sessionAuthorized, setSessionAuthorized] = useState(false);
  const [codeHash, setCodeHash] = useState("");
  const navigate = useNavigate();

  const messageRef = useRef();
  const fileRef = useRef();
  const telegramTokenRef = useRef();
  const manualNumbersRef = useRef();

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

  const handleCheckSession = async () => {
    const phone = telegramTokenRef.current.value;
    const res = await fetch(`${API_URL}/check-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const result = await res.json();
    setSessionAuthorized(result.authorized);
    alert(result.authorized ? "✅ Sessão ATIVA" : "❌ Sessão INATIVA");
  };

  // === DEBUGGED handleListContacts ===
  const handleListContacts = async () => {
    const phone = telegramTokenRef.current.value;
    const res = await fetch(`${API_URL}/list-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const result = await res.json();
    const fetched = result.contacts || [];

    // DEBUG: exibe o JSON puro no console e no alert
    console.log("RAW CONTACTS:", fetched);
    alert("RAW CONTACTS:\n" + JSON.stringify(fetched, null, 2));

    // filtros originais mantidos para não quebrar a UI
    const onlyContacts = fetched.filter((c) => c.username || c.phone);
    const onlyGroups   = fetched.filter((c) => c.title);

    setContacts({ users: onlyContacts, groups: onlyGroups });
    setSelectedContacts([]);
    alert("📋 Lista de contatos e grupos carregada.");
  };

  const handleBroadcast = async () => {
    const phone = telegramTokenRef.current.value;
    const message = messageRef.current.value;
    const file = fileRef.current.files[0];
    const manualNumbers =
      manualNumbersRef.current?.value
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean) || [];

    if (!message || !phone)
      return alert("⚠️ Número, mensagem e contatos obrigatórios.");

    const allRecipients = [...selectedContacts, ...manualNumbers].filter(Boolean);
    if (allRecipients.length === 0)
      return alert("⚠️ Nenhum destinatário válido encontrado.");

    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("message", message);
    formData.append("recipients", allRecipients.join(","));
    if (file) formData.append("file", file);

    const res = await fetch(`${API_URL}/send-broadcast`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    alert(result.status || result.error);
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
                if (!phone) return alert("Digite o número de telefone.");
                const res = await fetch(`${API_URL}/start-login`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone }),
                });
                const result = await res.json();
                if (result.phone_code_hash) setCodeHash(result.phone_code_hash);
                alert(result.status || result.error);
              }}
              className="bg-yellow-500 px-4 py-2 rounded text-white font-bold"
            >
              📩 Enviar Código
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
                if (!code || !codeHash) return alert("Código ou hash ausente.");
                const res = await fetch(`${API_URL}/verify-code`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ phone, code, phone_code_hash: codeHash }),
                });
                const result = await res.json();
                if (result.status) {
                  alert(result.status);
                  setSessionAuthorized(true);
                } else {
                  alert(result.error);
                }
              }}
              className="bg-green-600 px-4 py-2 rounded text-white font-bold"
            >
              ✅ Confirmar Código
            </button>

            {sessionAuthorized && (
              <div className="text-green-400 font-semibold">🟢 Conectado</div>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={handleCheckSession}
                className="bg-purple-500 px-4 py-2 rounded text-white font-bold"
              >
                🔍 Verificar Sessão
              </button>
              <button
                onClick={handleListContacts}
                className="bg-cyan-600 px-4 py-2 rounded text-white font-bold"
              >
                📇 Listar Contatos
              </button>
            </div>

            {/* ... restante do renderTabContent permanece igual ... */}
          </div>
        );

      // casos whatsapp, facebook, etc...
      default:
        return <div>Selecione uma plataforma.</div>;
    }
  };

  if (loading) return <div className="text-white text-center py-20">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex font-sans">
      <div className="w-64 bg-[#1c152b] p-6 space-y-4 shadow-xl">
        {/* menu lateral */}
      </div>
      <div className="flex-1 p-8">
        {/* cabeçalho e painel de boas-vindas */}
        <div className="bg-[#1a1a2e] p-6 rounded-xl shadow-md min-h-[300px]">
          <h2 className="text-xl font-bold mb-4">🔧 Área de Controle</h2>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
