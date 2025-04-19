import React from "react";
import { useNavigate } from "react-router-dom";
import wizard from "../assets/mascote.png";
import telegramIcon from "../assets/telegram.png";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1a132b] text-white px-4 py-10 relative overflow-hidden font-sans">
      {/* 🔮 MASCOTE DIREITA */}
      <img
        src={wizard}
        alt="Bruxo"
        className="absolute bottom-0 right-0 w-[400px] md:w-[480px] pointer-events-none select-none"
      />

      {/* 🧙 TÍTULO CENTRAL */}
      <div className="text-left md:text-left max-w-5xl mx-auto z-10 relative">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-white">Mage Token</h1>
        <p className="text-xl md:text-2xl text-gray-300 max-w-xl">
          Automatize suas mensagens nas principais plataformas!
        </p>

        {/* 🔘 BOTÃO CTA */}
        <button
          onClick={() => navigate("/auth")}
          className="mt-6 bg-[#ec6a34] hover:bg-[#f07540] text-white font-semibold px-6 py-3 text-lg rounded shadow-md"
        >
          Comece agora
        </button>
      </div>

      {/* 🔳 BLOCOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 max-w-6xl mx-auto z-10 relative">
        {/* Login */}
        <div className="bg-[#2a223d] p-6 rounded-xl shadow text-left">
          <h2 className="text-xl font-bold text-white mb-4">Cadastro/Login</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          />
          <input
            type="password"
            placeholder="Senha"
            className="w-full mb-4 p-3 rounded bg-gray-800 text-white placeholder-gray-400"
          />
          <button className="bg-[#ec6a34] hover:bg-[#f07540] text-white py-2 w-full rounded font-bold">
            Registrar
          </button>
          <p className="text-sm mt-3 text-gray-400 text-center">
            Já tem uma conta? Faça login
          </p>
        </div>

        {/* Recursos */}
        <div className="bg-[#2a223d] p-6 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold mb-4">Recursos</h2>
          <img src={telegramIcon} alt="Telegram" className="w-12 h-12 mx-auto mb-2" />
          <p className="font-semibold text-blue-400 mb-3">Envio para Telegram</p>
          <ul className="text-sm text-gray-300 space-y-1 text-left">
            <li>• Mensagens automáticas</li>
            <li>• Integrações fáceis</li>
            <li>• Relatórios detalhados</li>
          </ul>
        </div>

        {/* Planos */}
        <div className="bg-[#2a223d] p-6 rounded-xl shadow text-center">
          <h2 className="text-xl font-bold mb-4">Planos</h2>
          <p className="text-4xl font-extrabold text-[#ec6a34] mb-1">R$ 29</p>
          <p className="text-gray-300 text-sm mb-3">/mês</p>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Acesso a todas as funcionalidades</li>
            <li>• Suporte 24/7</li>
          </ul>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="text-center text-sm text-gray-500 mt-14 z-10 relative">
        © {new Date().getFullYear()} Mage Token. Todos os direitos reservados.
      </footer>
    </div>
  );
}
