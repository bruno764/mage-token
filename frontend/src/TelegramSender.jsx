import React, { useState } from 'react';

export default function TelegramSender() {
  const [usernames, setUsernames] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const lines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      setUsernames(lines);
    };
    reader.readAsText(file);
  };

  const handleSend = () => {
    if (!message || usernames.length === 0) return alert("Mensagem ou lista vazia.");
    setSending(true);

    // Simulação de envio
    setTimeout(() => {
      alert(`Mensagem enviada para ${usernames.length} usuários (simulado).`);
      setSending(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">📨 Envio Telegram</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário */}
        <div>
          <label className="block mb-2 font-semibold">Mensagem:</label>
          <textarea
            className="w-full p-4 rounded bg-gray-800 border border-gray-700 mb-6"
            rows="5"
            placeholder="Digite a mensagem a ser enviada..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <label className="block mb-2 font-semibold">Lista de usuários (.txt):</label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileUpload}
            className="mb-6 block"
          />

          <button
            onClick={handleSend}
            disabled={sending}
            className={`w-full bg-purple-600 hover:bg-purple-700 transition px-6 py-3 text-lg font-bold rounded ${sending ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {sending ? 'Enviando...' : 'Iniciar Disparo'}
          </button>
        </div>

        {/* Preview */}
        <div>
          <h2 className="text-xl font-semibold mb-2">👥 Pré-visualização ({usernames.length})</h2>
          <div className="bg-gray-800 border border-gray-700 rounded p-4 h-64 overflow-auto text-sm">
            {usernames.length === 0 ? (
              <p className="text-gray-400 italic">Nenhuma lista carregada.</p>
            ) : (
              <ul className="list-disc ml-5 space-y-1">
                {usernames.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
