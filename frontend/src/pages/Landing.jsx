import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white min-h-screen font-sans">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-6 border-b border-gray-800">
        <h1 className="text-2xl font-extrabold tracking-wide text-purple-500">Mage Token</h1>
        <button
          onClick={() => navigate("/auth")}
          className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded font-semibold"
        >
          Login
        </button>
      </header>

      {/* Hero */}
      <section className="text-center py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
          O sistema de disparo de mensagens mais indetectável do mercado.
        </h2>
        <p className="text-gray-300 mb-8 text-lg">
          Telegram, WhatsApp, Discord, Facebook, X (Twitter) — tudo em um só lugar. Escale sua comunicação com segurança e tecnologia real.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="bg-purple-600 hover:bg-purple-700 transition px-6 py-3 text-lg rounded font-bold"
        >
          Comece Agora
        </button>
      </section>

      {/* Sobre o Projeto */}
      <section className="bg-gray-900 py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6 text-purple-400">O que é o Mage Token?</h3>
          <p className="text-gray-300 text-lg">
            Mage Token é uma plataforma SaaS focada em automação segura e indetectável de mensagens em múltiplas redes. Ideal para quem quer divulgar,
            captar clientes ou escalar projetos sem medo de bloqueio ou ban.
          </p>
        </div>
      </section>

      {/* Recursos */}
      <section className="py-20 px-6 max-w-6xl mx-auto grid md:grid-cols-3 gap-10 text-center">
        {[
          ["💬 Multiplataforma", "Integração com Telegram, WhatsApp, Discord, Facebook e X (Twitter)."],
          ["🛡️ Indetectável", "Delays aleatórios, simulação de digitação, múltiplas contas e muito mais."],
          ["📊 Painel Profissional", "Dashboard com estatísticas de envio, controle por conta e logs salvos."],
        ].map(([icon, title, desc], i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-8 shadow hover:shadow-lg transition">
            <div className="text-4xl mb-4">{icon}</div>
            <h4 className="text-xl font-bold mb-2 text-purple-300">{title}</h4>
            <p className="text-gray-400">{desc}</p>
          </div>
        ))}
      </section>

      {/* Planos */}
      <section className="bg-gray-950 py-20 px-6">
        <h3 className="text-center text-3xl font-bold mb-12 text-purple-400">Planos</h3>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            ["Starter", "1 conta / 300 msg/dia", "R$49/mês"],
            ["Pro", "3 contas / 1000 msg/dia", "R$149/mês"],
            ["Agency", "10 contas / 5.000 msg/dia", "R$399/mês"],
          ].map(([name, desc, price], i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 text-center border border-purple-700 hover:scale-105 transition">
              <h4 className="text-2xl font-bold mb-2">{name}</h4>
              <p className="text-gray-300 mb-4">{desc}</p>
              <p className="text-purple-400 text-xl font-semibold">{price}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rodapé */}
      <footer className="text-center py-6 border-t border-gray-800 text-gray-500 text-sm">
        © {new Date().getFullYear()} Mage Token. Todos os direitos reservados.
      </footer>
    </div>
  );
}
