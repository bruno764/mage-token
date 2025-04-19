import React from "react";
import { useNavigate } from "react-router-dom";

export default function FloatingCTA() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/auth")}
      className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 ease-in-out z-50 text-sm md:text-base"
    >
      🔥 Comece Agora
    </button>
  );
}
