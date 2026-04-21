import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, FIREBASE_READY } from "../services/firebase.js";
import { businessSvc } from "../services/db.js";

export const BusinessContext = createContext();

const DEFAULTS = {
  companyName: "", nif: "", phone: "",
  street: "", locality: "", postalCode: "", community: "",
  holder: "", bank: "", accountNumber: "",
};

export function BusinessProvider({ children }) {
  const [business,    _setBusiness] = useState(DEFAULTS);
  const [bizLoading,  setBizLoading] = useState(true);

  useEffect(() => {
    // ── Sin Firebase: cargar localStorage directamente ──────────────────
    if (!FIREBASE_READY) {
      const unsub = businessSvc.listen((data) => {
        if (data && Object.keys(data).length > 0) _setBusiness((p) => ({ ...p, ...data }));
        setBizLoading(false);
      });
      return unsub;
    }

    // ── Con Firebase: esperar sesión activa ─────────────────────────────
    let unsubBiz = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsubBiz(); // cancelar listener anterior

      if (!user) {
        _setBusiness(DEFAULTS);
        setBizLoading(false);
        return;
      }

      unsubBiz = businessSvc.listen(
        (data) => {
          if (data && Object.keys(data).length > 0) _setBusiness((p) => ({ ...p, ...data }));
          setBizLoading(false);
        },
        (err) => {
          console.error("[BusinessContext]", err);
          setBizLoading(false);
        }
      );
    });

    return () => { unsubAuth(); unsubBiz(); };
  }, []);

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
