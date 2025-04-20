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

  const handleListContacts = async () => {
    const phone = telegramTokenRef.current.value;
    const res = await fetch(`${API_URL}/list-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const result = await res.json();
    const fetched = result.contacts || [];

    const onlyContacts = fetched.filter((c) => c.username || c.phone);
    const onlyGroups   = fetched.filter((c) => c.title);

    setContacts({
      users: onlyContacts,
      groups: onlyGroups,
    });

    setSelectedContacts([]);
    alert("📋 Lista de contatos e grupos carregada.");
  };

  // **handleSelectAll** permanece, mas não é usado diretamente no JSX
  const handleSelectAll = () => {
    const allUsers  = contacts.users.map((c) => c.username || c.phone);
    const allGroups = contacts.groups.map((g) => g.id);
    setSelectedContacts([...allUsers, ...allGroups]);
  };

  const handleBroadcast = async () => {
    const phone = telegramTokenRef.current.value;
    const message = messageRef.current.value;
    const file = fileRef.current.files[0];
    const manualNumbers =
      manualNumbersRef.current?.value
        .split("\n")
        .map((n) => n.trim())
        .filter((n) => n) || [];

    if (!message || !phone)
      return alert("⚠️ Número, mensagem e contatos obrigatórios.");

    const allRecipients = [...selectedContacts, ...manualNumbers].filter(
      Boolean
    );
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

              {/* NOVO: Selecionar e Desselecionar todos */}
              {(contacts.users.length || contacts.groups.length) > 0 && (
                <button
                  onClick={() => {
                    const all = [
                      ...contacts.users.map((c) => c.username || c.phone),
                      ...contacts.groups.map((g) => g.id),
                    ];
                    setSelectedContacts((prev) =>
                      prev.length === all.length ? [] : all
                    );
                  }}
                  className="bg-blue-600 px-4 py-2 rounded text-white font-bold"
                >
                  {selectedContacts.length ===
                  contacts.users.length + contacts.groups.length
                    ? "❌ Desselecionar Todos"
                    : "✔️ Selecionar Todos"}
                </button>
              )}
            </div>

            {/* Lista de Contatos */}
            {contacts.users.length > 0 && (
              <div className="max-h-48 overflow-y-scroll border border-gray-700 rounded p-2 bg-gray-900 mb-4">
                <h4 className="text-white text-lg font-bold mb-2">👤 Contatos</h4>
                {contacts.users.map((c, i) => {
                  const id = c.username || c.phone;
                  const label = `${c.first_name || ""} ${c.last_name || ""} ${id}`;
                  return (
                    <label
                      key={i}
                      className="flex items-center gap-2 text-white text-sm mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedContacts((prev) => [...prev, id]);
                          else
                            setSelectedContacts((prev) =>
                              prev.filter((v) => v !== id)
                            );
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Lista de Grupos */}
            {contacts.groups.length > 0 && (
              <div className="max-h-48 overflow-y-scroll border border-yellow-700 rounded p-2 bg-gray-900">
                <h4 className="text-yellow-400 text-lg font-bold mb-2">
                  👥 Grupos
                </h4>
                {contacts.groups.map((g, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-2 text-yellow-300 text-sm mb-1"
                  >
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(g.id)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedContacts((prev) => [...prev, g.id]);
                        else
                          setSelectedContacts((prev) =>
                            prev.filter((v) => v !== g.id)
                          );
                      }}
                    />
                    <span>{g.title}</span>
                  </label>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-lg font-semibold mb-1">
                📄 Números externos (um por linha)
              </h4>
              <textarea
                ref={manualNumbersRef}
                rows={4}
                placeholder="+5599999999999"
                className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
              />
            </div>

            <textarea
              ref={messageRef}
              rows={5}
              placeholder="Escreva sua mensagem..."
              className="w-full p-4 rounded bg-gray-800 text-white placeholder-gray-400 resize-none"
            />

            <input
              ref={fileRef}
              type="file"
              className="w-full p-3 bg-gray-800 text-white rounded"
            />

            <button
              onClick={handleBroadcast}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-bold text-white"
            >
              📢 Enviar para contatos selecionados
            </button>
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
      <div className="w-64 bg-[#1c152b] p-6 space-y-4 shadow-xl">
        <h2 className="text-xl font-bold mb-6">📡 Plataformas</h2>
        <button
          onClick={() => setActiveTab("telegram")}
          className="w-full bg-gray-800 hover:bg-purple-700 py-2 rounded"
        >
          Telegram
        </button>
        <button
          onClick={() => setActiveTab("whatsapp")}
          className="w-full bg-gray-800 hover:bg-green-600 py-2 rounded"
        >
          WhatsApp
        </button>
        <button
          onClick={() => setActiveTab("facebook")}
          className="w-full bg-gray-800 hover:bg-blue-600 py-2 rounded"
        >
          Facebook
        </button>
        <button
          onClick={() => setActiveTab("discord")}
          className="w-full bg-gray-800 hover:bg-indigo-600 py-2 rounded"
        >
          Discord
        </button>
        <button
          onClick={() => setActiveTab("x")}
          className="w-full bg-gray-800 hover:bg-sky-600 py-2 rounded"
        >
          X (Twitter)
        </button>
        <hr className="my-4 border-gray-600" />
        <button
          onClick={() => setActiveTab("estatisticas")}
          className="w-full bg-gray-800 hover:bg-cyan-600 py-2 rounded"
        >
          📊 Estatísticas
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className="w-full bg-gray-800 hover:bg-orange-600 py-2 rounded"
        >
          📜 Histórico
        </button>
        <button
          onClick={() => setActiveTab("upgrade")}
          className="w-full bg-yellow-600 hover:bg-yellow-700 py-2 rounded"
        >
          💳 Upgrade de Plano
        </button>
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

      <div className="flex-1 p-8">
        <div className="bg-[#1c152b] p-6 rounded-xl mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">👤 Bem-vindo</h1>
          {userData ? (
            <>
              <p>
                <span className="font-bold">Email:</span> {userData.email}
              </p>
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
