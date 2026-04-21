import React, { createContext, useContext, useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, FIREBASE_READY } from "../services/firebase.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(FIREBASE_READY); // wait for Firebase to resolve
  const [authError,   setAuthError]   = useState("");

  useEffect(() => {
    if (!FIREBASE_READY) return; // sin Firebase → sin auth
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      const msgs = {
        "auth/invalid-credential":    "Email o contraseña incorrectos.",
        "auth/user-not-found":        "No existe ningún usuario con ese email.",
        "auth/wrong-password":        "Contraseña incorrecta.",
        "auth/too-many-requests":     "Demasiados intentos. Espera unos minutos.",
        "auth/network-request-failed":"Sin conexión a internet.",
      };
      setAuthError(msgs[e.code] || "Error al iniciar sesión. Inténtalo de nuevo.");
      throw e;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, authLoading, authError, login, logout, FIREBASE_READY }}>
      {children}
    </AuthContext.Provider>
  );
}
