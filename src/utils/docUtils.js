/**
 * Shared document utility functions.
 * Single source of truth for calculations used across pages.
 */

/* ─── Per-item calculations ───────────────────────────────────────────────── */

/** Base amount for one line item (uses stored total if available) */
const itemBase = (it) =>
  Number(it?.total ?? (Number(it?.quantity || 0) * Number(it?.price || 0)));

/** IVA amount for one line item (uses stored ivaAmount if available) */
const itemIva = (it) =>
  Number(it?.ivaAmount ?? (itemBase(it) * (Number(it?.iva || 0) / 100)));

/* ─── Document-level calculations ────────────────────────────────────────── */

/**
 * Returns { base, iva, total } for a document.
 * Used where individual breakdown is needed (e.g. Balances page).
 */
export function docTotals(doc) {
  const items = doc?.items || [];
  const base  = items.reduce((s, it) => s + itemBase(it), 0);
  const iva   = items.reduce((s, it) => s + itemIva(it),  0);
  return { base, iva, total: base + iva };
}

/**
 * Returns just the final total (base + IVA) for a document.
 * Used where only the grand total is needed (e.g. document lists).
 */
export const docTotal = (doc) => docTotals(doc).total;

/* ─── Date formatting ─────────────────────────────────────────────────────── */

/** Format any date value to Spanish locale string, or "—" if invalid. */
export function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-ES");
  } catch {
    return "—";
  }
}
