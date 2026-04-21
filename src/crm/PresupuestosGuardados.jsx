import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function safeDate(d) {
  try {
    if (!d) return "—";
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("es-ES");
  } catch { return "—"; }
}

function docTotal(doc) {
  const base = (doc.items || []).reduce((s, x) => s + Number(x.quantity || 0) * Number(x.price || 0), 0);
  const iva  = (doc.items || []).reduce((s, x) =>
    s + Number(x.ivaAmount ?? (Number(x.quantity || 0) * Number(x.price || 0) * (Number(x.iva || 0) / 100))), 0);
  return base + iva;
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-slate-700 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 rounded-xl">Cancelar</button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl">Eliminar</button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function DocCard({ doc, onEdit, onPdf, onConvertir, onDelete }) {
  const total = docTotal(doc);
  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{doc.clienteNombre || "Sin nombre"}</p>
          <p className="text-xs text-slate-500 mt-0.5">{doc.numero || "—"} · {safeDate(doc.fecha)}</p>
        </div>
        <p className="shrink-0 font-bold text-slate-900 text-sm tabular-nums">{total.toFixed(2)} €</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit}    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 active:bg-blue-200">Editar</button>
        <button onClick={onPdf}     className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 active:bg-slate-200">PDF</button>
        <button onClick={onConvertir} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 active:bg-emerald-200">→ Factura</button>
        <button onClick={onDelete}  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 active:bg-red-200 ml-auto">Eliminar</button>
      </div>
    </div>
  );
}

export default function PresupuestosGuardadas() {
  const navigate = useNavigate();
  const { presupuestos, upsertBorrador, removePresupuesto, loading } = useData();
  const [confirm, setConfirm] = useState(null);

  const handleEliminar = async (id) => {
    await removePresupuesto(id);
    setConfirm(null);
    toast.success("Presupuesto eliminado");
  };

  const handleConvertir = async (doc) => {
    await upsertBorrador({
      ...doc,
      id: doc.id || crypto.randomUUID(),
      facturada: false,
      documentType: "factura",
      createdAt: doc.createdAt || Date.now(),
    });
    toast.success("Convertido — aparece en Borradores");
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <ToastContainer position="bottom-center" />
      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar el presupuesto "${confirm.numero || "sin número"}"?`}
          onConfirm={() => handleEliminar(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Presupuestos</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? "Cargando…" : `${presupuestos.length} documento${presupuestos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={() => navigate("/presupuestos")}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700">
            + Nuevo
          </button>
        </div>

        {loading ? <Skeleton /> : presupuestos.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No hay presupuestos guardados.</p>
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden">
              {presupuestos.map((doc) => (
                <DocCard key={doc.id} doc={doc}
                  onEdit={      () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`)}
                  onPdf={       () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`)}
                  onConvertir={ () => handleConvertir(doc)}
                  onDelete={    () => setConfirm({ id: doc.id, numero: doc.numero })}
                />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    {["Número","Cliente","Fecha","Total","Acciones"].map(h => (
                      <th key={h} className={`px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide ${h==="Total"||h==="Acciones" ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {presupuestos.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{doc.numero || "—"}</td>
                      <td className="px-5 py-3 text-slate-700">{doc.clienteNombre || "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{safeDate(doc.fecha)}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium text-slate-800">{docTotal(doc).toFixed(2)} €</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {[
                            { label:"Editar",     color:"bg-blue-100 text-blue-700",      fn: () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`) },
                            { label:"PDF",        color:"bg-slate-100 text-slate-700",    fn: () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`) },
                            { label:"→ Factura",  color:"bg-emerald-100 text-emerald-700",fn: () => handleConvertir(doc) },
                            { label:"Eliminar",   color:"bg-red-100 text-red-700",        fn: () => setConfirm({ id: doc.id, numero: doc.numero }) },
                          ].map(({ label, color, fn }) => (
                            <button key={label} onClick={fn}
                              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${color} hover:opacity-80`}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
