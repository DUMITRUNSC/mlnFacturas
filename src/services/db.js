/**
 * Data access layer — Firestore with automatic localStorage fallback.
 *
 * All public API is identical whether Firebase is configured or not.
 * Components never import from firebase directly.
 */
import { db, FIREBASE_READY } from "./firebase.js";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, getDoc, writeBatch,
  serverTimestamp, Timestamp,
} from "firebase/firestore";

/* ─── Serialization ──────────────────────────────────────────────────────── */

/** Clean undefined values (Firestore rejects them) and convert Dates → ISO */
function serialize(data) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => {
      if (v === undefined) return null;
      if (v instanceof Date) return v.toISOString();
      return v;
    })
  );
}

/** Convert stored ISO strings back to Date objects for 'fecha' fields */
function deserialize(data) {
  if (!data) return data;
  const out = { ...data };
  if (typeof out.fecha === "string" && out.fecha) {
    const dt = new Date(out.fecha);
    if (!isNaN(dt.getTime())) out.fecha = dt;
  }
  return out;
}

/* ─── localStorage helpers (fallback) ───────────────────────────────────── */
const LS_KEYS = {
  facturas:      "facturas",
  presupuestos:  "presupuestos",
  borradores:    "savedInvoices",
  business:      "businessData",
};

const ls = {
  getAll:  (key) => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } },
  setAll:  (key, arr) => localStorage.setItem(key, JSON.stringify(arr)),
  getOne:  (key) => { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } },
  setOne:  (key, val) => localStorage.setItem(key, JSON.stringify(val)),

  upsert(key, item) {
    const arr = this.getAll(key);
    const idx = arr.findIndex((d) => d.id === item.id);
    if (idx >= 0) arr[idx] = item; else arr.push(item);
    this.setAll(key, arr);
  },
  remove(key, id) {
    this.setAll(key, this.getAll(key).filter((d) => d.id !== id));
  },
};

/* ─── Generic Firestore collection CRUD ─────────────────────────────────── */
function makeCollection(colName, lsKey) {
  return {
    /** Subscribe to real-time updates. Returns unsubscribe fn. */
    listen(cb, onError) {
      if (!FIREBASE_READY) {
        cb(ls.getAll(lsKey).map(deserialize));
        return () => {};
      }
      return onSnapshot(
        collection(db, colName),
        (snap) => cb(snap.docs.map((d) => deserialize({ id: d.id, ...d.data() }))),
        onError
      );
    },

    /** Create or update a document (uses doc.id as Firestore doc ID). */
    async upsert(data) {
      const clean = serialize(data);
      if (FIREBASE_READY) {
        await setDoc(doc(db, colName, clean.id), { ...clean, _updatedAt: serverTimestamp() }, { merge: true });
      }
      // Always keep localStorage in sync (offline cache + fallback)
      ls.upsert(lsKey, clean);
    },

    /** Delete a document by id. */
    async remove(id) {
      if (FIREBASE_READY) await deleteDoc(doc(db, colName, id));
      ls.remove(lsKey, id);
    },

    /** One-off get (no listener). */
    async getById(id) {
      if (FIREBASE_READY) {
        const snap = await getDoc(doc(db, colName, id));
        return snap.exists() ? deserialize({ id: snap.id, ...snap.data() }) : null;
      }
      return ls.getAll(lsKey).find((d) => d.id === id) || null;
    },
  };
}

/* ─── Collections ────────────────────────────────────────────────────────── */
export const facturasSvc     = makeCollection("facturas",     LS_KEYS.facturas);
export const presupuestosSvc = makeCollection("presupuestos", LS_KEYS.presupuestos);
export const borradoresSvc   = makeCollection("borradores",   LS_KEYS.borradores);

/* ─── Business config (single document) ─────────────────────────────────── */
export const businessSvc = {
  async get() {
    if (FIREBASE_READY) {
      const snap = await getDoc(doc(db, "config", "business"));
      return snap.exists() ? snap.data() : null;
    }
    return ls.getOne(LS_KEYS.business);
  },

  async save(data) {
    const clean = serialize(data);
    if (FIREBASE_READY) {
      await setDoc(doc(db, "config", "business"), { ...clean, _updatedAt: serverTimestamp() });
    }
    ls.setOne(LS_KEYS.business, clean);
  },

  listen(cb, onError) {
    if (!FIREBASE_READY) {
      cb(ls.getOne(LS_KEYS.business) || {});
      return () => {};
    }
    return onSnapshot(doc(db, "config", "business"), (snap) => cb(snap.exists() ? snap.data() : {}), onError);
  },
};

/* ─── Migration: localStorage → Firestore (runs once) ───────────────────── */
export async function migrateLocalStorageToFirebase() {
  if (!FIREBASE_READY) return { migrated: 0 };
  const MIGRATION_KEY = "_fb_migrated_v1";
  if (localStorage.getItem(MIGRATION_KEY)) return { migrated: 0 };

  const batch = writeBatch(db);
  let count = 0;

  const migrate = (lsKey, colName) => {
    const items = ls.getAll(lsKey);
    items.forEach((item) => {
      if (!item.id) return;
      batch.set(doc(db, colName, item.id), { ...serialize(item), _migratedAt: serverTimestamp() }, { merge: true });
      count++;
    });
  };

  migrate(LS_KEYS.facturas,     "facturas");
  migrate(LS_KEYS.presupuestos, "presupuestos");
  migrate(LS_KEYS.borradores,   "borradores");

  const biz = ls.getOne(LS_KEYS.business);
  if (biz) {
    batch.set(doc(db, "config", "business"), { ...serialize(biz), _migratedAt: serverTimestamp() }, { merge: true });
    count++;
  }

  if (count > 0) await batch.commit();
  localStorage.setItem(MIGRATION_KEY, "1");
  return { migrated: count };
}
