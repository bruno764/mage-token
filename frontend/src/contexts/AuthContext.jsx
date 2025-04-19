// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 impede flicker ao recarregar

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false); // 👈 libera a renderização após detectar
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children} {/* Evita mostrar a interface antes do auth */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
