import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import mascot from "../assets/mascote.png";
import banner from "../assets/banner.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 shadow-lg bg-black bg-opacity-70">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Mage Token Logo" className="w-10 h-10" />
          <h1 className="text-2xl font-bold">Mage Token</h1>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 font-semibold text-sm"
        >
          Entrar
        </button>
      </header>

      {/* Hero Section */}
      <section className="text-center px-6 py-10">
        <img src={mascot} alt="Mascote" className="mx-auto w-40 h-40 mb-4" />
        <h2 className="text-3xl md:text-5xl font-bold mb-4">Automatize sua Divulgação</h2>
        <p className="text-gray-300 max-w-xl mx-auto mb-6">
          Mage Token é a solução definitiva para enviar mensagens em massa no Telegram, WhatsApp, Discord, Facebook e Twitter – de forma inteligente e indetectável!
        </p>
        <img src={banner} alt="Imagem promocional" className="rounded-xl shadow-xl mx-auto max-w-full" />
      </section>

      {/* Features */}
      <section className="px-6 py-10 bg-gray-950">
        <h3 className="text-2xl font-bold text-center mb-8">Funcionalidades</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            "Envio inteligente com delays e simulação de digitação",
            "Múltiplas contas e rotação automática",
            "Proteção contra bans e bloqueios",
            "Filtros por país, idioma e nome de usuário",
            "Estatísticas em tempo real",
            "Dashboard completo com login seguro"
          ].map((text, idx) => (
            <div key={idx} className="bg-gray-800 p-6 rounded-xl shadow-md hover:scale-105 transition">
              <p className="font-semibold">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preços */}
      <section className="px-6 py-10">
        <h3 className="text-2xl font-bold text-center mb-8">Planos</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Grátis",
              price: "R$0",
              features: ["Teste por 7 dias", "Acesso limitado", "Suporte via e-mail"],
            },
            {
              title: "Pro",
              price: "R$49/mês",
              features: ["Envios ilimitados", "Dashboard completo", "Suporte rápido"],
            },
            {
              title: "Empresarial",
              price: "R$199/mês",
              features: ["Múltiplas contas", "Prioridade no suporte", "Customizações sob medida"],
            },
          ].map((plan, idx) => (
            <div key={idx} className="bg-gray-900 p-6 rounded-xl shadow-xl text-center">
              <h4 className="text-xl font-bold mb-2">{plan.title}</h4>
              <p className="text-3xl font-extrabold text-indigo-400 mb-4">{plan.price}</p>
              <ul className="mb-4">
                {plan.features.map((feat, i) => (
                  <li key={i} className="text-sm text-gray-300">{feat}</li>
                ))}
              </ul>
              <button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded">
                Começar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="text-center text-gray-400 text-sm py-6">
        © {new Date().getFullYear()} Mage Token · Todos os direitos reservados
      </footer>
    </div>
  );
}
