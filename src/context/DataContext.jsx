/**
 * DataContext — real-time Firestore listeners with localStorage fallback.
 *
 * Auth-state changes are handled by AuthContext (single onAuthStateChanged).
 * This context reacts to `user` via useEffect([user]) — no duplicate listener.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { FIREBASE_READY } from "../services/firebase.js";
import {
  facturasSvc, presupuestosSvc, borradoresSvc,
  migrateLocalStorageToFirebase,
} from "../services/db.js";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [facturas,     setFacturas]     = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [borradores,   setBorradores]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fbStatus,     setFbStatus]     = useState(FIREBASE_READY ? "connecting" : "local");
  const [error,        setError]        = useState(null);

  useEffect(() => {
    // ── Sin Firebase: modo localStorage ────────────────────────────────────
    if (!FIREBASE_READY) {
      const u1 = facturasSvc.listen(    (d) => setFacturas(d));
      const u2 = presupuestosSvc.listen((d) => setPresupuestos(d));
      const u3 = borradoresSvc.listen(  (d) => setBorradores(d));
      setLoading(false);
      setFbStatus("local");
      return () => { u1(); u2(); u3(); };
    }

    // ── Sin sesión activa: limpiar y esperar ────────────────────────────────
    if (!user) {
      setFacturas([]);
      setPresupuestos([]);
      setBorradores([]);
      setFbStatus("local");
      setLoading(false);
      return;
    }

    // ── Sesión activa: abrir listeners en tiempo real ───────────────────────
    setLoading(true);
    setFbStatus("connecting");

    // Track which collections have delivered their first snapshot.
    // Using a Set ensures each collection is counted only once,
    // even though Firestore listeners fire on every data change.
    const initialized = new Set();
    const onReady = (key) => {
      initialized.add(key);
      if (initialized.size >= 3) {
        setLoading(false);
        setFbStatus("connected");
      }
    };
    const onErr = (e) => {
      console.error("[DataContext]", e);
      setError(e?.message || "Error de Firebase");
      setFbStatus("error");
      setLoading(false);
    };

    const u1 = facturasSvc.listen(    (d) => { setFacturas(d);     onReady("facturas");     }, onErr);
    const u2 = presupuestosSvc.listen((d) => { setPresupuestos(d); onReady("presupuestos"); }, onErr);
    const u3 = borradoresSvc.listen(  (d) => { setBorradores(d);   onReady("borradores");   }, onErr);

    // Migrate localStorage → Firestore once (no-op if already done)
    migrateLocalStorageToFirebase()
      .then(({ migrated }) => {
        if (migrated > 0) console.info(`[Firebase] Migrados ${migrated} registros de localStorage.`);
      })
      .catch(console.warn);

    return () => { u1(); u2(); u3(); };
  }, [user]); // Reacts to auth state — no separate onAuthStateChanged needed

  /* ── CRUD callbacks ─────────────────────────────────────────────────────── */
  const upsertFactura      = useCallback((data) => facturasSvc.upsert(data),      []);
  const removeFactura      = useCallback((id)   => facturasSvc.remove(id),        []);
  const getFacturaById     = useCallback((id)   => facturasSvc.getById(id),       []);

  const upsertPresupuesto  = useCallback((data) => presupuestosSvc.upsert(data),  []);
  const removePresupuesto  = useCallback((id)   => presupuestosSvc.remove(id),    []);
  const getPresupuestoById = useCallback((id)   => presupuestosSvc.getById(id),   []);

  const upsertBorrador     = useCallback((data) => borradoresSvc.upsert(data),    []);
  const removeBorrador     = useCallback((id)   => borradoresSvc.remove(id),      []);
  const getBorradorById    = useCallback((id)   => borradoresSvc.getById(id),     []);

  const findDocById = useCallback((id) =>
    facturas.find((d)     => d.id === id) ||
    presupuestos.find((d) => d.id === id) ||
    borradores.find((d)   => d.id === id) ||
    null,
  [facturas, presupuestos, borradores]);

  return (
    <DataContext.Provider value={{
      facturas, presupuestos, borradores,
      loading, fbStatus, error,
      upsertFactura,     removeFactura,     getFacturaById,
      upsertPresupuesto, removePresupuesto, getPresupuestoById,
      upsertBorrador,    removeBorrador,    getBorradorById,
      findDocById,
    }}>
      {children}
    </DataContext.Provider>
  );
}
