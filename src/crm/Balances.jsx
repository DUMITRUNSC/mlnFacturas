import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { docTotals, formatDate as safeDate } from "../utils/docUtils.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

function fmtEur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
}
function fmtFecha(v) {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

/* ─── Stat card grande ───────────────────────────────────────────────────── */
function BigStat({ label, value, icon, iconBg, iconColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={2} strokeLinecap="round">
          {icon}
        </svg>
      </div>
      <p className="text-3xl font-black text-gray-900 tabular-nums leading-none">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-2 leading-tight">{label}</p>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
          <div className="flex gap-4 items-center">
            <div className="w-11 h-11 rounded-xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-100 rounded-lg w-2/5" />
              <div className="h-4 bg-gray-50 rounded-lg w-1/4" />
            </div>
            <div className="h-6 bg-gray-100 rounded-lg w-24 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Factura card (móvil) ───────────────────────────────────────────────── */
function FacturaCard({ doc, onDelete }) {
  const { base, iva, total } = docTotals(doc);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3 mx-4">
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-black text-lg flex items-center justify-center shrink-0">
          {initials(doc.clienteNombre)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-900 leading-tight truncate">{doc.clienteNombre || "Sin nombre"}</p>
          <p className="text-sm text-gray-400 mt-1">Nº {doc.numero || "—"} · {fmtFecha(doc.fecha)}</p>
        </div>
      </div>

      <div className="mx-4 mb-4 bg-emerald-50 rounded-2xl px-5 py-4">
        <p className="text-sm font-medium text-emerald-700 mb-1">Total facturado</p>
        <p className="text-3xl font-black text-gray-900 tabular-nums">{fmtEur(total)}</p>
        <div className="flex gap-4 mt-2">
          <p className="text-xs text-gray-400">Base: <span className="font-semibold text-gray-600">{fmtEur(base)}</span></p>
          <p className="text-xs text-gray-400">IVA: <span className="font-semibold text-gray-600">{fmtEur(iva)}</span></p>
        </div>
      </div>

      <div className="px-4 pb-4">
        <button onClick={onDelete}
          className="w-full h-12 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          Eliminar esta factura
        </button>
      </div>
    </div>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function Balances() {
  const { facturas, removeFactura, loading } = useData();
  const [confirm, setConfirm] = useState(null);

  const emitidas = useMemo(() => facturas.filter(f => f.facturada === true), [facturas]);

  const { totalBase, totalIva, totalFinal } = useMemo(() => {
    const totalBase = emitidas.reduce((s, d) => s + docTotals(d).base, 0);
    const totalIva  = emitidas.reduce((s, d) => s + docTotals(d).iva,  0);
    return { totalBase, totalIva, totalFinal: totalBase + totalIva };
  }, [emitidas]);

  const handleDelete = async (id) => {
    await removeFactura(id);
    setConfirm(null);
    toast.success("Factura eliminada");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ToastContainer position="bottom-center" toastClassName="!rounded-2xl !text-base !font-semibold !shadow-xl" />

      {confirm && (
        <ConfirmDialog
          message={`¿Seguro que quieres eliminar la factura de "${confirm.clienteNombre}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ══ CABECERA ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Balances</h1>
        <p className="text-base text-gray-500 mt-1">
          {loading ? "Cargando…" : `${emitidas.length} factura${emitidas.length !== 1 ? "s" : ""} emitida${emitidas.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ══ CONTENIDO ══ */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">

        {/* Estadísticas */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <BigStat
            label="Facturas emitidas"
            value={loading ? "—" : emitidas.length}
            iconBg="bg-emerald-100"
            iconColor="#059669"
            icon={<><path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/></>}
          />
          <BigStat
            label="Total facturado (con IVA)"
            value={loading ? "—" : fmtEur(totalFinal)}
            iconBg="bg-violet-100"
            iconColor="#7c3aed"
            icon={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}
          />
          <BigStat
            label="Base imponible (sin IVA)"
            value={loading ? "—" : fmtEur(totalBase)}
            iconBg="bg-blue-100"
            iconColor="#2563eb"
            icon={<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>}
          />
          <BigStat
            label="IVA total ingresado"
            value={loading ? "—" : fmtEur(totalIva)}
            iconBg="bg-amber-100"
            iconColor="#d97706"
            icon={<><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>}
          />
        </div>

        {/* Lista de facturas */}
        <div className="px-4 mb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Detalle de facturas emitidas</p>
        </div>

        {loading ? (
          <Skeleton />
        ) : emitidas.length === 0 ? (
          <div className="mx-4 bg-white rounded-2xl border border-gray-100 py-16 px-6 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.5} strokeLinecap="round">
                <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">Sin facturas emitidas</p>
            <p className="text-base text-gray-400 leading-relaxed max-w-xs mx-auto">
              Cuando emitas una factura aparecerá aquí con su importe y datos
            </p>
          </div>
        ) : (
          <>
            {/* Móvil: tarjetas */}
            <div className="md:hidden">
              {emitidas.map(doc => (
                <FacturaCard key={doc.id} doc={doc}
                  onDelete={() => setConfirm({ id: doc.id, clienteNombre: doc.clienteNombre })}
                />
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Número</th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Base</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">IVA</th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-5 py-4 w-40" />
                  </tr>
                </thead>
                <tbody>
                  {emitidas.map(doc => {
                    const { base, iva, total } = docTotals(doc);
                    return (
                      <tr key={doc.id} className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/30 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                              {initials(doc.clienteNombre)}
                            </div>
                            <p className="text-base font-semibold text-gray-900">{doc.clienteNombre || "—"}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{doc.numero || "—"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600">{fmtFecha(doc.fecha)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-base tabular-nums text-gray-700">{fmtEur(base)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-base tabular-nums text-gray-400">{fmtEur(iva)}</span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="text-base font-bold tabular-nums text-gray-900">{fmtEur(total)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <button onClick={() => setConfirm({ id: doc.id, clienteNombre: doc.clienteNombre })}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors">
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td colSpan={3} className="px-5 py-4 text-sm font-bold text-gray-700">Totales</td>
                    <td className="px-5 py-4 text-right font-bold text-base tabular-nums text-gray-800">{fmtEur(totalBase)}</td>
                    <td className="px-5 py-4 text-right font-bold text-base tabular-nums text-gray-800">{fmtEur(totalIva)}</td>
                    <td className="px-5 py-4 text-right font-black text-base tabular-nums text-gray-900">{fmtEur(totalFinal)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
