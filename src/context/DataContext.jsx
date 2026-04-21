import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, FIREBASE_READY } from "../services/firebase.js";
import {
  facturasSvc, presupuestosSvc, borradoresSvc,
  migrateLocalStorageToFirebase,
} from "../services/db.js";

const DataContext = createContext(null);
export const useData = () => useContext(DataContext);

export function DataProvider({ children }) {
  const [facturas,     setFacturas]     = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [borradores,   setBorradores]   = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [fbStatus,     setFbStatus]     = useState(FIREBASE_READY ? "connecting" : "local");
  const [error,        setError]        = useState(null);

  useEffect(() => {
    // ── Sin Firebase: cargar localStorage directamente ──────────────────
    if (!FIREBASE_READY) {
      const u1 = facturasSvc.listen(    (d) => setFacturas(d));
      const u2 = presupuestosSvc.listen((d) => setPresupuestos(d));
      const u3 = borradoresSvc.listen(  (d) => setBorradores(d));
      setLoading(false);
      setFbStatus("local");
      return () => { u1(); u2(); u3(); };
    }

    // ── Con Firebase: esperar sesión activa antes de abrir listeners ─────
    let unsubData = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      // Cerrar listeners anteriores si los había
      unsubData();

      if (!user) {
        // No hay sesión — limpiar datos y esperar
        setFacturas([]);
        setPresupuestos([]);
        setBorradores([]);
        setLoading(false);
        setFbStatus("local");
        return;
      }

      // Sesión activa → abrir listeners en tiempo real
      setLoading(true);
      setFbStatus("connecting");
      let ready = 0;

      const onReady = () => {
        ready++;
        if (ready >= 3) {
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

      const u1 = facturasSvc.listen(    (d) => { setFacturas(d);     onReady(); }, onErr);
      const u2 = presupuestosSvc.listen((d) => { setPresupuestos(d); onReady(); }, onErr);
      const u3 = borradoresSvc.listen(  (d) => { setBorradores(d);   onReady(); }, onErr);

      unsubData = () => { u1(); u2(); u3(); };

      // Migrar localStorage → Firestore la primera vez
      migrateLocalStorageToFirebase()
        .then(({ migrated }) => {
          if (migrated > 0) console.info(`[Firebase] Migrados ${migrated} registros de localStorage.`);
        })
        .catch(console.warn);
    });

    return () => {
      unsubAuth();
      unsubData();
    };
  }, []);

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
