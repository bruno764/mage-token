// 🔧 Home.jsx
import React, { useEffect, useState, useRef } from "react";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
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
  const [sessionStatus, setSessionStatus] = useState("none");
  const [codeHash, setCodeHash] = useState("");
  const [broadcastHistory, setBroadcastHistory] = useState([]);
  const [tooltipBlocked, setTooltipBlocked] = useState(false);
  const [successLinkMessage, setSuccessLinkMessage] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [newTemplateName, setNewTemplateName] = useState("");
  const navigate = useNavigate();
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [finalResult, setFinalResult] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isRecurring, setIsRecurring] = useState(false);
  const [cron, setCron] = useState(""); // para o campo cron
  const [recurringType, setRecurringType] = useState("");
  const [recurringTime, setRecurringTime] = useState("07:00");
  const [customCron, setCustomCron] = useState("");
  const [recurrenceType, setRecurrenceType] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState("");
  

  
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
        const tokenResult = await user.getIdTokenResult(true);
        const isExpired = Date.now() > tokenResult.expirationTime;

        if (isExpired) {
          await auth.signOut();
          navigate("/auth");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (err) {
        console.error("Erro ao verificar token:", err);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const itemsPerPage = 8;

const paginated = broadcastHistory.slice(
  currentPage * itemsPerPage,
  (currentPage + 1) * itemsPerPage
);
const totalPages = Math.ceil(broadcastHistory.length / itemsPerPage);

  useEffect(() => {
    const fetchBroadcastHistory = async () => {
      try {
        const phone = telegramTokenRef.current?.value;
        if (!phone) return;
        const res = await fetch(`${API_URL}/broadcast-history?phone=${phone}`);
        const json = await res.json();
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

  useEffect(() => {
    const fetchTemplates = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const ref = collection(db, "users", user.uid, "templates");
      const snap = await getDocs(ref);
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(items);
    };
    fetchTemplates();
  }, []);

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
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/check-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });

      const result = await res.json();
      if (result.detail === "Este número está vinculado a outra conta.") {
        setTooltipBlocked(true);
        setSessionStatus("none");
        return;
      }

      if (result.authorized) {
        setSessionStatus("active");
        setSessionAuthorized(true);
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

  const renderTooltipBlocked = () => {
    if (!tooltipBlocked) return null;
    return (
      <div className="text-red-500 text-sm font-semibold">
        🚫 Este número está vinculado a outra conta. Você não pode usá-lo aqui.
      </div>
    );
  };

  const renderSuccessLinkMessage = () => {
    if (!successLinkMessage) return null;
    return (
      <div className="text-green-400 text-sm font-semibold mb-2">
        ✅ Número vinculado com sucesso à sua conta!
      </div>
    );
  };

  
  

  const handleListContacts = async () => {
    const phone = telegramTokenRef.current.value;
    try {
      const token = await auth.currentUser.getIdToken(); // 🔐 envia token
      const usersRes = await fetch(`${API_URL}/list-contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });
  
      if (!usersRes.ok) {
        const err = await usersRes.json();
        throw new Error(err.detail || "Erro ao buscar contatos");
      }
  
      const groupsRes = await fetch(`${API_URL}/list-dialogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone }),
      });
  
      if (!groupsRes.ok) {
        const err = await groupsRes.json();
        throw new Error(err.detail || "Erro ao buscar grupos");
      }
  
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
    } catch (error) {
      console.error("Erro ao listar contatos/grupos:", error.message);
      alert("❌ Ação não permitida: " + error.message);
    }
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
  
    const token = await auth.currentUser.getIdToken();
    setIsSending(true);
    setProgress({ current: 0, total: allRecipients.length });
    setFinalResult(null);
  
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("message", message);
    formData.append("recipients", allRecipients.join(","));
    if (file) formData.append("file", file);
  
    try {
      const res = await fetch(`${API_URL}/send-broadcast`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });
      const result = await res.json();
  
      // Simulação: result deve conter .success e .errors
      const success = result.success || allRecipients.length; // ajuste se precisar
      const errorCount = result.errors ? Object.keys(result.errors).length : 0;
  
      setFinalResult({ success, errors: errorCount });
    } catch (err) {
      alert("Erro ao enviar mensagens.");
    } finally {
      setIsSending(false);
    }
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
  
    const token = await auth.currentUser.getIdToken();
    const formData = new FormData();
    formData.append("phone", phone);
    formData.append("message", message);
    formData.append("recipients", allRecipients.join(","));
    formData.append("send_at", new Date(scheduledAt).toISOString()); // UTC
  
    if (file) formData.append("file", file);
  
    // 👇 se for recorrente, adiciona o cron
    if (isRecurring) {
      if (!cron.trim()) {
        return alert("⚠️ Campo CRON obrigatório para envios recorrentes.");
      }
      let cron = "";
if (recurringType === "daily") {
  const [h, m] = recurringTime.split(":");
  cron = `${m} ${h} * * *`;
} else if (recurringType === "weekly") {
  const [h, m] = recurringTime.split(":");
  cron = `${m} ${h} * * 1`; // toda segunda-feira
} else if (recurringType === "monthly") {
  const [h, m] = recurringTime.split(":");
  cron = `${m} ${h} 1 * *`; // dia 1 de cada mês
} else if (recurringType === "custom") {
  cron = customCron;
}
formData.append("cron", cron);
      formData.append("cron", cron);
      
    }
  
    // 👇 endpoint muda de acordo com o tipo
    const endpoint = isRecurring ? "schedule-recurring" : "schedule-broadcast";
  
    try {
      const res = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const result = await res.json();
  
      if (res.ok) {
        if (isRecurring) {
          alert("🔁 Envio recorrente agendado com sucesso!");
        } else {
          alert(`⏰ Envio agendado para ${new Date(scheduledAt).toLocaleString()}`);
          setScheduledAt("");
        }
      } else {
        alert(result.detail || result.error);
      }
    } catch (err) {
      alert("Erro ao agendar envio.");
    }
  };
  

  const handleEnviarCodigo = async () => {
    const phone = telegramTokenRef.current.value;
    if (!phone) return alert("Digite o número de telefone.");
  
    try {
      const token = await auth.currentUser.getIdToken(); // 🔐 Pega o token do Firebase
  
      const res = await fetch(`${API_URL}/start-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    
        {/* ✅ Aqui está certo */}
        {renderTooltipBlocked()}
        {renderSuccessLinkMessage()}
    
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
              body: JSON.stringify({ phone, code, phone_code_hash: codeHash, uid: auth.currentUser?.uid }),
            });
            const result = await res.json();
            if (result.status) {
              alert(result.status);
              setSessionAuthorized(true);
              setSuccessLinkMessage(true);
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

<div className="flex flex-wrap gap-2">
  <div className="flex items-center gap-2 w-auto">
    <button
      onClick={handleCheckSession}
      className="bg-purple-500 px-4 py-2 rounded text-white font-bold w-auto"
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

  {sessionStatus === "active" && (
  <button
  onClick={async () => {
    const phone = telegramTokenRef.current.value;
    if (!phone) return alert("Informe o número.");
  
    const user = auth.currentUser;
    if (!user) return alert("Usuário não autenticado.");
  
    const token = await user.getIdToken(); // ✅ PEGA O TOKEN
  
    const res = await fetch(`${API_URL}/unlink-phone`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // ✅ ENVIA O TOKEN AQUI
      },
      body: JSON.stringify({ phone }),
    });
  
    const result = await res.json();
    if (res.ok) {
      alert("📴 Número desvinculado com sucesso.");
      setSessionAuthorized(false);
      setSessionStatus("none");
    } else {
      alert(result.detail || "Erro ao desvincular.");
    }
  }}
  
    className="bg-red-500 px-4 py-2 rounded text-white font-bold"
  >
    🔓 Desvincular Número
  </button>
)}

  <button
    onClick={handleListContacts}
    className="bg-cyan-600 px-4 py-2 rounded text-white font-bold w-auto"
  >
    📇 Listar Contatos & Grupos
  </button>

  <button
  onClick={async () => {
    const phone = telegramTokenRef.current?.value;
    if (phone) {
      const token = await auth.currentUser.getIdToken(); // ✅ agora funciona
      fetch(`${API_URL}/broadcast-history?phone=${encodeURIComponent(phone)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
          .then((res) => res.json())
          .then((json) => setBroadcastHistory(json.items || []))
          .catch(() => alert("Erro ao atualizar histórico"));
      }
    }}
    className="bg-gray-600 px-4 py-2 rounded text-white font-bold w-auto"
  >
    🔄 Atualizar Histórico
  </button>
  
  {broadcastHistory.length > 0 && (
  <div className="mt-6">
    <h4 className="text-xl font-bold mb-4">📜 Histórico de Envios</h4>
    
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {paginated.map((item, i) => {
        const total = (item.recipients || "").split(",").filter(Boolean).length;
        const errorCount = item.errors ? Object.keys(item.errors).length : 0;
        const successCount = total - errorCount;

        return (
          <div key={i} className="rounded-lg shadow-md bg-[#1f1f2e] border border-gray-700 p-4">
            <div className="flex justify-between items-center mb-2">
              <h5 className="text-white font-bold">📨 Disparo {(currentPage * itemsPerPage) + i + 1}</h5>
              <span className={`text-sm px-2 py-1 rounded ${item.status === "sent" ? "bg-green-700 text-white" : "bg-yellow-700 text-white"}`}>
                {item.status === "sent" ? "✅ Enviado" : "⏳ Pendente"}
              </span>
            </div>

            <div className="text-sm text-gray-300">
              <strong>Mensagem:</strong>{" "}
              <div className="relative">
                <p className={`whitespace-pre-line ${item.showFull ? "" : "line-clamp-3"} transition-all duration-300`}>
                  {item.message}
                </p>
                {item.message.length > 150 && (
                  <button
                    className="text-blue-400 text-xs mt-1 underline"
                    onClick={() => {
                      const updated = [...broadcastHistory];
                      updated[(currentPage * itemsPerPage) + i].showFull = !item.showFull;
                      setBroadcastHistory(updated);
                    }}
                  >
                    {item.showFull ? "Mostrar menos" : "Mostrar mais"}
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-400">
              <strong>Agendado para:</strong>{" "}
              {item.send_at?._seconds
                ? new Date(item.send_at._seconds * 1000).toLocaleString("pt-BR")
                : "Data inválida"}
            </p>
            <div className="mt-2 text-sm">
              <span className="text-green-400 mr-4">✔️ Sucesso: {successCount}</span>
              <span className="text-red-400">❌ Erros: {errorCount}</span>
            </div>
            {item.cron && (
  <button
    className="text-red-400 text-xs mt-2 underline"
    onClick={async () => {
      const confirm = window.confirm("Deseja cancelar esse envio recorrente?");
      if (!confirm) return;

      const token = await auth.currentUser.getIdToken();
      await fetch(`${API_URL}/cancel-recurring`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ job_id: item.id }),
      });

      alert("Agendamento recorrente cancelado.");
      // Atualiza o histórico se quiser após isso
    }}
  >
    ❌ Cancelar Envio Recorrente
  </button>
)}


            {item.errors && (
              <details className="mt-2">
                <summary className="text-red-300 cursor-pointer">Ver detalhes dos erros</summary>
                <ul className="list-disc list-inside text-sm mt-1 text-red-200">
                  {Object.entries(item.errors).map(([dest, err], j) => (
                    <li key={j}><strong>{dest}:</strong> {err}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>

    {/* Navegação entre páginas fora do map */}
    <div className="flex justify-center items-center gap-4 mt-6">
      <button
        disabled={currentPage === 0}
        onClick={() => setCurrentPage(p => p - 1)}
        className="bg-gray-700 px-4 py-2 rounded text-white disabled:opacity-40"
      >
        ◀ Anterior
      </button>
      <span className="text-white font-semibold">
        Página {currentPage + 1} de {totalPages}
      </span>
      <button
        disabled={currentPage >= totalPages - 1}
        onClick={() => setCurrentPage(p => p + 1)}
        className="bg-gray-700 px-4 py-2 rounded text-white disabled:opacity-40"
      >
        Próxima ▶
      </button>
    </div>
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

        <div className="mt-2 space-y-2">
  <label className="flex items-center gap-2 text-white text-sm">
    <input
      type="checkbox"
      checked={isRecurring}
      onChange={(e) => setIsRecurring(e.target.checked)}
    />
    🔁 Tornar este envio recorrente?
  </label>

  {isRecurring && (
  <>
    <label className="text-white text-sm font-semibold mt-2 block">🔁 Repetição:</label>
    <select
      value={recurringType}
      onChange={(e) => {
        const type = e.target.value;
        setRecurringType(type);

        if (type === "daily") {
          const [h, m] = recurringTime.split(":");
          setCron(`${m || "0"} ${h || "7"} * * *`);
        } else if (type === "weekly") {
          const [h, m] = recurringTime.split(":");
          setCron(`${m || "0"} ${h || "7"} * * 1`);
        } else if (type === "monthly") {
          const [h, m] = recurringTime.split(":");
          setCron(`${m || "0"} ${h || "7"} 1 * *`);
        } else {
          setCron("");
        }
      }}
      className="w-full p-2 bg-gray-800 text-white rounded"
    >
      <option value="">-- Selecione o tipo de repetição --</option>
      <option value="daily">🗓️ Todo dia</option>
      <option value="weekly">📅 Toda semana</option>
      <option value="monthly">📆 Todo mês</option>
      <option value="custom">⏱️ A cada X minutos/horas</option>
    </select>

    {recurringType === "custom" && (
      <>
        <input
          type="text"
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="Cron (ex: */5 * * * *)"
          className="w-full p-2 bg-gray-800 text-white rounded mt-1"
        />
        <p className="text-sm text-gray-400 mt-1">
          Exemplos:
          <br />• A cada 5 min: <code className="text-blue-300">*/5 * * * *</code>
          <br />• A cada 1h: <code className="text-blue-300">0 * * * *</code>
          <br />• A cada 2h: <code className="text-blue-300">0 */2 * * *</code>
        </p>
      </>
    )}

    {["daily", "weekly", "monthly"].includes(recurringType) && (
      <input
        type="time"
        value={recurringTime}
        onChange={(e) => {
          const [h, m] = e.target.value.split(":");
          setRecurringTime(e.target.value);

          if (recurringType === "daily") {
            setCron(`${m} ${h} * * *`);
          } else if (recurringType === "weekly") {
            setCron(`${m} ${h} * * 1`);
          } else if (recurringType === "monthly") {
            setCron(`${m} ${h} 1 * *`);
          }
        }}
        className="w-full p-2 bg-gray-800 text-white rounded mt-2"
      />
    )}
  </>
)}



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

{/* Templates de Mensagem */ }
<div className="space-y-2">
  <h4 className="font-semibold">📂 Templates de Mensagem</h4>

  <select
    onChange={(e) => {
      const tpl = templates.find(t => t.id === e.target.value);
      if (tpl) messageRef.current.value = tpl.message;
    }}
    className="w-full p-2 rounded bg-gray-800 text-white"
  >
    <option value="">-- Selecione um Template --</option>
    {templates.map(tpl => (
      <option key={tpl.id} value={tpl.id}>
        {tpl.name}
      </option>
    ))}
  </select>

  <input
    value={newTemplateName}
    onChange={(e) => setNewTemplateName(e.target.value)}
    placeholder="Nome do Template"
    className="w-full p-2 rounded bg-gray-800 text-white"
  />

  <div className="flex gap-2">
    <button
      onClick={async () => {
        const user = auth.currentUser;
        const name = newTemplateName.trim();
        const message = messageRef.current.value.trim();
        if (!user || !name || !message) {
          return alert("⚠️ Nome e mensagem obrigatórios.");
        }

        const ref = collection(db, "users", user.uid, "templates");
        await addDoc(ref, {
          name,
          message,
          created_at: serverTimestamp(),
        });

        const snap = await getDocs(ref);
        setTemplates(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setNewTemplateName("");
        alert("✅ Template salvo!");
      }}
      className="bg-blue-700 px-4 py-1 rounded text-white text-sm font-bold"
    >
      💾 Salvar Template
    </button>

    <button
      onClick={async () => {
        const user = auth.currentUser;
        if (!user) return;
        if (!confirm("Apagar todos os templates?")) return;

        const ref = collection(db, "users", user.uid, "templates");
        const snap = await getDocs(ref);
        for (const docSnap of snap.docs) {
          await deleteDoc(doc(db, "users", user.uid, "templates", docSnap.id));
        }
        setTemplates([]);
        alert("🗑️ Templates apagados");
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
      {isSending && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white text-center py-3 shadow-lg">
    🔄 Enviando mensagens: {progress.current} / {progress.total}
  </div>
)}

{finalResult && (
  <>
    <div className="fixed top-14 left-0 right-0 z-50 bg-green-700 text-white text-center py-3 shadow-lg">
      ✅ Disparo concluído: {finalResult.success} sucesso, {finalResult.errors} erro(s)
      <br />
      <span className="text-sm text-yellow-200">
        Verifique o histórico para detalhes.
      </span>
    </div>
    <button
      onClick={() => setFinalResult(null)}
      className="absolute top-1 right-3 text-white text-xl font-bold"
    >
      ×
    </button>
  </>
)}


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
