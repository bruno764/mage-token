import React from "react";
import { useNavigate } from "react-router-dom";
import wizard from "../assets/mascote.png";
import telegramIcon from "../assets/telegram.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-[#0f0a1a] text-white px-4 py-10 overflow-hidden font-sans">
      {/* 🔮 FUNDO GRADIENTE */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-800/20 via-transparent to-transparent animate-pulse z-0" />

      {/* 🔮 MASCOTE DIREITA */}
      <img
        src={wizard}
        alt="Mascote"
        className="absolute top-10 right-0 w-[400px] md:w-[480px] xl:w-[520px] pointer-events-none select-none z-10"
      />

      {/* 🔠 TÍTULO E DESCRIÇÃO */}
      <div className="max-w-6xl mx-auto z-20 relative text-left pb-4 mb-8">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">Mage Token</h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl">
          Plataforma completa para automação de mensagens no Telegram, WhatsApp, Facebook, Discord e X.
        </p>

        <button
          onClick={() => navigate("/auth")}
          className="mt-6 ml-2 md:ml-0 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 text-lg rounded-full shadow-md transition"
        >
          Comece agora
        </button>
      </div>

      {/* 🔳 SEÇÕES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 max-w-6xl mx-auto relative z-20">
        {/* LOGIN */}
        <div className="bg-[#1c152b] p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cadastro/Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full mb-4 p-3 rounded bg-gray-800 text-white placeholder-gray-400 focus:outline-none"
          />
          <button className="bg-orange-500 hover:bg-orange-600 text-white py-2 w-full rounded font-bold">
            Registrar
          </button>
          <p className="text-sm mt-3 text-gray-400 text-center">
            Já tem uma conta? Faça login
          </p>
        </div>

        {/* RECURSOS */}
        <div className="bg-[#1c152b] p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Recursos</h2>
          <img src={telegramIcon} alt="Telegram" className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold text-blue-400 mb-3">Automação Multiplataforma</p>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Envio para Telegram, WhatsApp, Facebook, X e Discord</li>
            <li>• Filtros inteligentes e rotação de contas</li>
            <li>• Relatórios e estatísticas completas</li>
          </ul>
        </div>

        {/* PLANOS */}
        <div className="bg-[#1c152b] p-6 rounded-2xl shadow-lg text-center">
          <h2 className="text-xl font-bold mb-4">Planos</h2>
          <p className="text-4xl font-extrabold text-orange-400 mb-1">R$ 29</p>
          <p className="text-gray-300 text-sm mb-3">por mês</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Acesso total a todas as funções</li>
            <li>• Atualizações inclusas</li>
            <li>• Suporte técnico 24/7</li>
          </ul>
        </div>
      </div>

      {/* RODAPÉ */}
      <footer className="text-center text-sm text-gray-500 mt-16 relative z-20">
        © {new Date().getFullYear()} Mage Token. Todos os direitos reservados.
      </footer>

      {/* FLOATING CTA */}
      <button
        onClick={() => navigate("/auth")}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-xl transition z-50"
      >
        💬 Comece Agora
      </button>
    </div>
  );
}
