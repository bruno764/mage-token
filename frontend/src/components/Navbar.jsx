import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { Link as ScrollLink } from "react-scroll";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: "Início", to: "hero" },
    { name: "Funcionalidades", to: "features" },
    { name: "Planos", to: "planos" },
  ];

  return (
    <nav className="bg-black/80 backdrop-blur sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Mage Token" className="w-10 h-10" />
          <h1 className="text-xl font-extrabold text-purple-400">Mage Token</h1>
        </div>

        <div className="hidden md:flex gap-6 items-center">
          {navItems.map((item) => (
            <ScrollLink
              key={item.name}
              to={item.to}
              smooth={true}
              duration={500}
              className="cursor-pointer text-white hover:text-purple-400 transition font-medium"
            >
              {item.name}
            </ScrollLink>
          ))}
          <button
            onClick={() => navigate("/auth")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold text-sm"
          >
            Entrar
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4">
          {navItems.map((item) => (
            <ScrollLink
              key={item.name}
              to={item.to}
              smooth={true}
              duration={500}
              className="block text-white py-2 border-b border-gray-700 cursor-pointer"
              onClick={() => setMenuOpen(false)}
            >
              {item.name}
            </ScrollLink>
          ))}
          <button
            onClick={() => navigate("/auth")}
            className="mt-4 bg-purple-600 hover:bg-purple-700 w-full text-white px-4 py-2 rounded font-semibold text-sm"
          >
            Entrar
          </button>
        </div>
      )}
    </nav>
  );
}
