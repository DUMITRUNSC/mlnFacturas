/**
 * BusinessContext — company profile data with Firestore/localStorage persistence.
 *
 * Auth-state changes are handled by AuthContext (single onAuthStateChanged).
 * This context reacts to `user` via useEffect([user]) — no duplicate listener.
 */
import React, { createContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import { FIREBASE_READY } from "../services/firebase.js";
import { businessSvc } from "../services/db.js";

export const BusinessContext = createContext();

const DEFAULTS = {
  companyName: "", nif: "", phone: "",
  street: "", locality: "", postalCode: "", community: "",
  holder: "", bank: "", accountNumber: "",
};

export function BusinessProvider({ children }) {
  const { user } = useAuth();

  const [business,   _setBusiness] = useState(DEFAULTS);
  const [bizLoading, setBizLoading] = useState(true);

  useEffect(() => {
    // ── Sin Firebase: modo localStorage ────────────────────────────────────
    if (!FIREBASE_READY) {
      const unsub = businessSvc.listen((data) => {
        if (data && Object.keys(data).length > 0) _setBusiness((p) => ({ ...p, ...data }));
        setBizLoading(false);
      });
      return unsub;
    }

    // ── Sin sesión activa: resetear ─────────────────────────────────────────
    if (!user) {
      _setBusiness(DEFAULTS);
      setBizLoading(false);
      return;
    }

    // ── Sesión activa: listener en tiempo real ──────────────────────────────
    const unsub = businessSvc.listen(
      (data) => {
        if (data && Object.keys(data).length > 0) _setBusiness((p) => ({ ...p, ...data }));
        setBizLoading(false);
      },
      (err) => {
        console.error("[BusinessContext]", err);
        setBizLoading(false);
      }
    );
    return unsub;
  }, [user]); // Reacts to auth state — no separate onAuthStateChanged needed

  const setBusiness = async (data) => {
    _setBusiness(data);
    await businessSvc.save(data);
  };

  return (
    <BusinessContext.Provider value={{ business, setBusiness, bizLoading }}>
      {children}
    </BusinessContext.Provider>
  );
}
