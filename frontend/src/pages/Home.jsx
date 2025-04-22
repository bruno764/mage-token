// 🔧 Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

const API_URL = "https://mage-token-production.up.railway.app";

export default function Home() {
  const [scheduledAt, setScheduledAt] = useState("");
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("telegram");
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState({ users: [], groups: [] });
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [sessionAuthorized, setSessionAuthorized] = useState(false);
  const [sessionStatus, setSessionStatus] = useState("none"); // 'none' | 'active' | 'inactive'
  const [codeHash, setCodeHash] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const navigate = useNavigate();

  const messageRef = useRef();
  const fileRef = useRef();
  const telegramTokenRef = useRef();
  const manualNumbersRef = useRef();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/auth")
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
  useEffect(() => {
    const fetchBroadcastHistory = async () => {
      try {
        const phone = telegramTokenRef.current?.value;
        if (!phone) return;
        const res = await fetch(`${API_URL}/broadcast-history?phone=${phone}`);
        const json = await res.json();
        console.log("Histórico recebido:", json.items);
        setBroadcastHistory(json.items || []);
      } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        alert("Erro ao buscar histórico de envios.");
      }
    };
  
    if (activeTab === "telegram" && telegramTokenRef.current?.value) {
      fetchBroadcastHistory();
    }    
  }, [activeTab]);
  
  

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
    if (!phone) return alert("Informe o número.");
  
    try {
      const res = await fetch(`${API_URL}/check-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
  
      const result = await res.json();
      if (result.authorized) {
        setSessionStatus("active");
        alert("✅ Sessão ATIVA");
      } else {
        setSessionStatus("inactive");
        alert("❌ Sessão INATIVA");
      }
    } catch (err) {
      console.error("Erro ao verificar sessão:", err);
      setSessionStatus("none");
      alert("Erro ao verificar sessão.");
    }
  };
  

  const handleListContacts = async () => {
    const phone = telegramTokenRef.current.value;
    const usersRes = await fetch(`${API_URL}/list-contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const groupsRes = await fetch(`${API_URL}/list-dialogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const usersJson = await usersRes.json();
    const groupsJson = await groupsRes.json();

    const onlyContacts = (usersJson.contacts || []).filter(
      (c) => c.username || c.phone
    );
    const onlyGroups = (groupsJson.dialogs || []).filter((d) =>
      ["group", "supergroup", "channel"].includes(d.chat?.type)
    );

    setContacts({ users: onlyContacts, groups: onlyGroups });
    setSelectedContacts([]);
    alert("📋 Lista de usuários e grupos carregada.");
  };

  // Envio imediato
  const handleSendNow = async () => {
    const phone = telegramTokenRef.current.value;
    const message = messageRef.current.value;
    const file = fileRef.current.files[0];
    const manualNumbers =
      manualNumbersRef.current?.value
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean) || [];

    if (!message || !phone) {
      return alert("⚠️ Número, mensagem e contatos obrigatórios.");
    }
    const allRecipients = [...selectedContacts, ...manualNumbers].filter(Boolean);
    if (allRecipients.length === 0) {
      return alert("⚠️ Nenhum destinatário válido encontrado.");
    }

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

  // Agendamento
  const handleSchedule = async () => {
    const phone = telegramTokenRef.current.value;
    const message = messageRef.current.value;
    const file = fileRef.current.files[0];
    const manualNumbers =
      manualNumbersRef.current?.value
        .split("\n")
        .map((n) => n.trim())
        .filter(Boolean) || [];
  
    if (!message || !phone || !scheduledAt) {
      return alert("⚠️ Número, mensagem, contatos e data de agendamento obrigatórios.");
    }
  
    const allRecipients = [...selectedContacts, ...manualNumbers].filter(Boolean);
    if (allRecipients.length === 0) {
      return alert("⚠️ Nenhum destinatário válido encontrado.");
    }
  
    // ✅ Converte para UTC
    const utcScheduledAt = new Date(scheduledAt).toISOString();
  
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("message", message);
    formData.append("recipients", allRecipients.join(","));
    formData.append("send_at", utcScheduledAt); // 👈 aqui vai em UTC
    if (file) formData.append("file", file);
  
    const res = await fetch(`${API_URL}/schedule-broadcast`, {
      method: "POST",
      body: formData,
    });
    const result = await res.json();
    if (result.job_id) {
      alert(`⏰ Envio agendado para ${new Date(scheduledAt).toLocaleString()}`);
      setScheduledAt("");
    } else {
      alert(result.detail || result.error);
    }
  };
  

  const handleEnviarCodigo = async () => {
    const phone = telegramTokenRef.current.value;
    if (!phone) return alert("Digite o número de telefone.");
    try {
      const res = await fetch(`${API_URL}/start-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const result = await res.json();
      if (res.ok) {
        if (result.phone_code_hash) setCodeHash(result.phone_code_hash);
        alert(result.status);
      } else {
        alert(result.detail || "Erro desconhecido ao enviar código.");
      }
    } catch (error) {
      alert(`Erro ao enviar requisição: ${error.message}`);
    }
  };

  const renderTabContent = () => {
    if (activeTab !== "telegram") {
      const placeholders = {
        whatsapp: "📱 Integração com WhatsApp",
        facebook: "📘 Facebook Sender",
        discord: "🎮 Bot para Discord",
        x: "🐦 Auto Reply / Auto DM no X",
        estatisticas: "📊 Estatísticas e Relatórios",
        historico: "🕓 Histórico Geral de Campanhas",
      };
      return <div>{placeholders[activeTab] || "Selecione uma plataforma."}</div>;
    }
  
    // Conteúdo da aba Telegram (Disparo + Histórico)
    
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold">🔮 Disparo via Telegram (Conta Real)</h3>

        <input
          placeholder="Seu número de telefone (+55...)"
          ref={telegramTokenRef}
          className="w-full p-3 rounded bg-gray-800 text-white placeholder-gray-400"
        />

        <button
  onClick={handleEnviarCodigo}
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
        <div className="flex items-center gap-2">
  <button
    onClick={handleCheckSession}
    className="bg-purple-500 px-4 py-2 rounded text-white font-bold"
  >
    🔍 Verificar Sessão
  </button>

  {sessionStatus === "active" && (
    <span className="text-green-400 font-bold">🟢 Ativa</span>
  )}
  {sessionStatus === "inactive" && (
    <span className="text-red-400 font-bold">🔴 Inativa</span>
  )}
  {sessionStatus === "none" && (
    <span className="text-gray-400 font-bold">⚪️ Desconhecida</span>
  )}
</div>
<button
    onClick={handleListContacts}
    className="bg-cyan-600 px-4 py-2 rounded text-white font-bold"
  >
    📇 Listar Contatos & Grupos
  </button>

  <button
    onClick={() => {
      const phone = telegramTokenRef.current?.value;
      if (phone) {
        fetch(`${API_URL}/broadcast-history?phone=${phone}`)
          .then((res) => res.json())
          .then((json) => setBroadcastHistory(json.items || []))
          .catch(() => alert("Erro ao atualizar histórico"));
      }
    }}
    className="bg-gray-600 px-4 py-2 rounded text-white font-bold"
  >
    🔄 Atualizar Histórico
  </button>
  
  {broadcastHistory.length > 0 && (
  <div className="mt-8 space-y-4">
    <h4 className="text-xl font-bold">📜 Histórico de Envios</h4>
    {broadcastHistory.map((item, i) => {
      const total = (item.recipients || "").split(",").filter(Boolean).length;
      const errorCount = item.errors ? Object.keys(item.errors).length : 0;
      const successCount = total - errorCount;

      return (
        <div key={i} className="border border-gray-700 rounded p-4 bg-gray-900">
          <p><strong>Mensagem:</strong> {item.message}</p>
          <p><strong>Status:</strong> {item.status === "sent" ? "✅ Enviado" : "🕓 Pendente"}</p>
          <p><strong>Agendado para:</strong> {new Date(item.send_at._seconds * 1000).toLocaleString()}</p>
          <div className="mt-1">
            <span className="text-green-400 font-semibold">✔️ Sucesso: {successCount}</span>{" "}
            <span className="text-red-400 font-semibold ml-4">❌ Erros: {errorCount}</span>
          </div>
        </div>
      );
    })}
  </div>
)}

</div> {/* fecha o flex gap-2 flex-wrap */}


        {/* Marcar contatos / grupos */}
        <div className="flex gap-2 flex-wrap">
          {contacts.users.length > 0 && (
            <button
              onClick={() => {
                const allC = contacts.users.map((c) => c.username || c.phone);
                setSelectedContacts((prev) =>
                  allC.every((id) => prev.includes(id))
                    ? prev.filter((id) => !allC.includes(id))
                    : [...new Set([...prev, ...allC])]
                );
              }}
              className="bg-indigo-600 px-4 py-2 rounded text-white font-bold"
            >
              {contacts.users.every((c) =>
                selectedContacts.includes(c.username || c.phone)
              )
                ? "❌ Desmarcar Contatos"
                : "✔️ Marcar Contatos"}
            </button>
          )}
          {contacts.groups.length > 0 && (
            <button
              onClick={() => {
                const allG = contacts.groups.map((g) => g.chat.id);
                setSelectedContacts((prev) =>
                  allG.every((id) => prev.includes(id))
                    ? prev.filter((id) => !allG.includes(id))
                    : [...new Set([...prev, ...allG])]
                );
              }}
              className="bg-yellow-600 px-4 py-2 rounded text-white font-bold"
            >
              {contacts.groups.every((g) =>
                selectedContacts.includes(g.chat.id)
              )
                ? "❌ Desmarcar Grupos"
                : "✔️ Marcar Grupos"}
            </button>
          )}
        </div>

        {/* Data/hora agendamento */}
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="p-2 rounded bg-gray-800 text-white"
          />
          <span className="text-gray-400">⏰ Agendar Envio</span>
        </div>

        {/* Lista de contatos e grupos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-48 overflow-y-auto border border-gray-700 rounded p-2 bg-gray-900">
            <h4 className="text-white font-bold mb-2">👤 Contatos</h4>
            {contacts.users.map((c, i) => {
              const id = c.username || c.phone;
              return (
                <label
                  key={i}
                  className="flex items-center gap-2 text-white text-sm mb-1"
                >
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(id)}
                    onChange={(e) =>
                      e.target.checked
                        ? setSelectedContacts((prev) => [...prev, id])
                        : setSelectedContacts((prev) =>
                            prev.filter((v) => v !== id)
                          )
                    }
                  />
                  <span>
                    {c.first_name} {c.last_name || ""} ({id})
                  </span>
                </label>
              );
            })}
          </div>
          <div className="h-48 overflow-y-auto border border-yellow-700 rounded p-2 bg-gray-900">
            <h4 className="text-yellow-400 font-bold mb-2">👥 Grupos</h4>
            {contacts.groups.map((g, i) => (
              <label
                key={i}
                className="flex items-center gap-2 text-yellow-300 text-sm mb-1"
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(g.chat.id)}
                  onChange={(e) =>
                    e.target.checked
                      ? setSelectedContacts((prev) => [...prev, g.chat.id])
                      : setSelectedContacts((prev) =>
                          prev.filter((v) => v !== g.chat.id)
                        )
                  }
                />
                <span>{g.chat.title}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Números externos */}
        <div>
          <h4 className="font-semibold mb-1">
            📄 Números externos (um por linha)
          </h4>
          <textarea
            ref={manualNumbersRef}
            rows={3}
            placeholder="+55..."
            className="w-full p-2 bg-gray-800 rounded text-white"
          />
        </div>

        {/* Mensagem */}
<textarea
  ref={messageRef}
  rows={4}
  placeholder="Escreva sua mensagem..."
  className="w-full p-3 bg-gray-800 rounded text-white"
/>

{/* Templates de Mensagem */}
<div className="space-y-2">
  <h4 className="font-semibold">📂 Templates de Mensagem</h4>
  <select
    onChange={(e) => {
      if (e.target.value) {
        messageRef.current.value = e.target.value;
      }
    }}
    className="w-full p-2 rounded bg-gray-800 text-white"
  >
    <option value="">-- Selecione um Template --</option>
    {(JSON.parse(localStorage.getItem("templates") || "[]")).map((tpl, i) => (
      <option key={i} value={tpl}>{tpl.substring(0, 50)}...</option>
    ))}
  </select>

  <div className="flex gap-2">
    <button
      onClick={() => {
        const text = messageRef.current.value.trim();
        if (!text) return alert("⚠️ Mensagem vazia");
        const current = JSON.parse(localStorage.getItem("templates") || "[]");
        localStorage.setItem("templates", JSON.stringify([...current, text]));
        alert("✅ Template salvo!");
      }}
      className="bg-blue-700 px-4 py-1 rounded text-white text-sm font-bold"
    >
      💾 Salvar Template Atual
    </button>
    <button
      onClick={() => {
        if (confirm("Tem certeza que deseja apagar todos os templates?")) {
          localStorage.removeItem("templates");
          alert("🗑️ Templates apagados");
        }
      }}
      className="bg-red-700 px-4 py-1 rounded text-white text-sm font-bold"
    >
      🗑️ Apagar Todos
    </button>
  </div>
</div>

{/* Upload de arquivo */}
<input
  ref={fileRef}
  type="file"
  className="w-full p-2 bg-gray-800 rounded"
/>


        {/* Botões de ação */}
        <div className="flex gap-4">
          <button
            onClick={handleSendNow}
            className="bg-blue-600 px-6 py-2 rounded text-white font-bold"
          >
            📢 Enviar Agora
          </button>
          <button
            onClick={handleSchedule}
            className="bg-green-600 px-6 py-2 rounded text-white font-bold"
          >
            ⏰ Agendar Envio
          </button>
        </div>
      </div>
    );
  };

  if (loading) return <div className="text-white text-center py-20">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 text-white flex font-sans">
      {/* Sidebar */}
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
          className="w-full mt-8 bg-red-600 hover:bg-red-700 py-2 rounded font-bold"
        >
          Sair
        </button>
      </div>

      {/* Conteúdo principal */}
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
