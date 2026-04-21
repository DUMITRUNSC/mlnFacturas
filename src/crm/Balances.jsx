import React, { useState, useMemo } from "react";
import { useData } from "../context/DataContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const safeBase = (it) => Number(it?.total ?? (Number(it?.quantity||0) * Number(it?.price||0)));
const safeIva  = (it) => Number(it?.ivaAmount ?? safeBase(it) * (Number(it?.iva||0) / 100));
const safeDate = (v)  => {
  try { const d = v instanceof Date ? v : new Date(v); return isNaN(d) ? "—" : d.toLocaleDateString("es-ES"); } catch { return "—"; }
};
function docTotals(doc) {
  const base = (doc.items||[]).reduce((s,it) => s + safeBase(it), 0);
  const iva  = (doc.items||[]).reduce((s,it) => s + safeIva(it),  0);
  return { base, iva, total: base + iva };
}

function StatCard({ label, value, accent }) {
  const bar = { blue:"bg-blue-500", emerald:"bg-emerald-500", amber:"bg-amber-500", violet:"bg-violet-500" };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className={`w-6 h-1 rounded-full mb-3 ${bar[accent]}`} />
      <p className="text-lg md:text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-slate-700 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[...Array(4)].map((_,i) => (
        <div key={i} className="p-4 animate-pulse flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/4" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile card ────────────────────────────────────────────────────────── */
function FacturaCard({ doc, onDelete }) {
  const { base, iva, total } = docTotals(doc);
  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{doc.clienteNombre || "—"}</p>
          <p className="text-xs text-slate-500 mt-0.5">{doc.numero || "—"} · {safeDate(doc.fecha)}</p>
        </div>
        <p className="shrink-0 font-bold text-slate-900 text-sm tabular-nums">{total.toFixed(2)} €</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-slate-500">
          <span>Base: <b className="text-slate-700">{base.toFixed(2)} €</b></span>
          <span>IVA: <b className="text-slate-700">{iva.toFixed(2)} €</b></span>
        </div>
        <button onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 active:bg-red-200">
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function Balances() {
  const { facturas, removeFactura, loading } = useData();
  const [confirm, setConfirm] = useState(null);

  const emitidas = useMemo(() => facturas.filter(f => f.facturada === true), [facturas]);

  const { totalBase, totalIva, totalFinal } = useMemo(() => {
    const totalBase = emitidas.reduce((s,d) => s + docTotals(d).base, 0);
    const totalIva  = emitidas.reduce((s,d) => s + docTotals(d).iva,  0);
    return { totalBase, totalIva, totalFinal: totalBase + totalIva };
  }, [emitidas]);

  const handleDelete = async (id) => {
    await removeFactura(id);
    setConfirm(null);
    toast.success("Factura eliminada");
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <ToastContainer position="bottom-center" />
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar la factura de "${confirm.clienteNombre}"?`}
          onConfirm={() => handleDelete(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Stats — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Facturas emitidas" value={loading ? "—" : emitidas.length}                  accent="blue"    />
        <StatCard label="Base imponible"    value={loading ? "—" : `${totalBase.toFixed(2)} €`}      accent="emerald" />
        <StatCard label="IVA total"         value={loading ? "—" : `${totalIva.toFixed(2)} €`}       accent="amber"   />
        <StatCard label="Total facturado"   value={loading ? "—" : `${totalFinal.toFixed(2)} €`}     accent="violet"  />
      </div>

      {/* Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Facturas emitidas</h2>
          <p className="text-xs text-slate-500 mt-0.5">Solo documentos con estado "Facturado"</p>
        </div>

        {loading ? <Skeleton /> : emitidas.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No hay facturas emitidas todavía.</p>
            <p className="text-xs text-slate-400 mt-1">Usa "Emitir Factura" para registrarlas aquí.</p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden">
              {emitidas.map(doc => (
                <FacturaCard key={doc.id} doc={doc}
                  onDelete={() => setConfirm({ id: doc.id, clienteNombre: doc.clienteNombre })}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Número","Cliente","Fecha","Base","IVA","Total",""].map((h,i) => (
                      <th key={i} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${i>=3?"text-right":"text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {emitidas.map(doc => {
                    const { base, iva, total } = docTotals(doc);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{doc.numero||"—"}</td>
                        <td className="px-5 py-3 text-slate-700">{doc.clienteNombre||"—"}</td>
                        <td className="px-5 py-3 text-slate-500">{safeDate(doc.fecha)}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700">{base.toFixed(2)} €</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-500">{iva.toFixed(2)} €</td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900">{total.toFixed(2)} €</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => setConfirm({ id: doc.id, clienteNombre: doc.clienteNombre })}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200">
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Totales</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-800">{totalBase.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-800">{totalIva.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-slate-900">{totalFinal.toFixed(2)} €</td>
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
