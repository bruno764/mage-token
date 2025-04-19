import React from "react";
import { useNavigate } from "react-router-dom";
import wizard from "../assets/mascote.png";       // mascote isolado à direita
import telegramIcon from "../assets/telegram.png"; // ícone do Telegram

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1a] to-[#1a1a2e] text-white px-4 py-12 font-sans relative overflow-hidden flex flex-col items-center">
      {/* 🔮 MASCOTE ATRÁS */}
      <img
        src={wizard}
        alt="Mascote"
        className="absolute right-0 bottom-0 max-w-[380px] md:max-w-[460px] opacity-90 pointer-events-none select-none z-0"
      />

      {/* 🔠 TÍTULOS */}
      <div className="text-center z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold">Mage Token</h1>
        <p className="mt-4 text-lg md:text-xl text-gray-300">
          Automatize suas mensagens nas principais plataformas!
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="mt-6 bg-orange-500 hover:bg-orange-600 transition text-white text-lg font-semibold px-6 py-3 rounded"
        >
          Comece agora
        </button>
      </div>

      {/* 🔲 BLOCO DE RECURSOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 max-w-6xl w-full z-10">
        {/* Cadastro/Login */}
        <div className="bg-[#2d2d3a] p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Cadastro/Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-2 rounded bg-gray-800 text-white placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full mb-4 p-2 rounded bg-gray-800 text-white placeholder-gray-400"
          />
          <button className="bg-orange-500 w-full py-2 rounded hover:bg-orange-600 font-semibold">
            Registrar
          </button>
          <p className="text-sm mt-3 text-center text-gray-400">
            Já tem uma conta? Faça login
          </p>
        </div>

        {/* Recursos */}
        <div className="bg-[#2d2d3a] p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Recursos</h2>
          <img src={telegramIcon} alt="Telegram" className="w-14 h-14 mx-auto mb-3" />
          <p className="font-semibold text-blue-400 mb-2">Envio para Telegram</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Mensagens automáticas</li>
            <li>• Integrações fáceis</li>
            <li>• Relatórios detalhados</li>
          </ul>
        </div>

        {/* Planos */}
        <div className="bg-[#2d2d3a] p-6 rounded-lg shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">Planos</h2>
          <p className="text-4xl font-extrabold text-orange-400 mb-2">R$ 29</p>
          <p className="text-sm text-gray-300 mb-2">/mês</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Acesso a todas as funcionalidades</li>
            <li>• Suporte 24/7</li>
          </ul>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="text-gray-500 text-sm text-center mt-16 z-10">
        © {new Date().getFullYear()} Mage Token. Todos os direitos reservados.
      </footer>
    </div>
  );
}
