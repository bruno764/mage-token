import React from 'react';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">📡 Mage Token - Platforms</h1>
        <button
          className="bg-red-600 px-4 py-2 rounded"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6 text-center">
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
      className={`text-white py-6 rounded-xl text-xl font-semibold ${color}`}
      onClick={() => alert(`${name} module coming soon!`)}
    >
      {name}
    </button>
  );
}
