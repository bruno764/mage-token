import React from "react";
import { useNavigate } from "react-router-dom";

export default function FloatingCTA() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth")}
      className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded-full shadow-lg transition z-50"
    >
      💬 Comece Agora
    </button>
  );
}
