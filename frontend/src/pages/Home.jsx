import React from 'react';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white px-6 py-8">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold">📡 Mage Token</h1>
        <button
          className="bg-red-500 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl mb-6 font-semibold">Choose a Platform</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <PlatformButton name="Telegram" color="bg-purple-600" />
        <PlatformButton name="WhatsApp" color="bg-green-600" />
        <PlatformButton name="Facebook" color="bg-blue-800" />
        <PlatformButton name="Discord" color="bg-indigo-700" />
        <PlatformButton name="Twitter/X" color="bg-black" />
        <PlatformButton name="Settings" color="bg-gray-700" />
      </div>
    </div>
  );
}

function PlatformButton({ name, color }) {
  return (
    <button
      className={`w-full py-6 rounded-xl text-lg font-semibold shadow-md transition transform hover:scale-105 ${color}`}
      onClick={() => alert(`${name} module coming soon!`)}
    >
      {name}
    </button>
  );
}
