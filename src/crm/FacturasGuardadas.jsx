import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function safeDate(d) {
  try {
    if (!d) return "—";
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-ES");
  } catch { return "—"; }
}

function ConfirmDialog({ message, confirmLabel = "Eliminar", confirmClass = "bg-red-600 hover:bg-red-700", onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <p className="text-sm text-slate-700 mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm font-medium text-white rounded-xl ${confirmClass}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 animate-pulse flex gap-3">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-8 bg-slate-200 rounded w-20" />
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile card ────────────────────────────────────────────────────────── */
function DocCard({ doc, onEdit, onPdf, onFacturar, onDelete }) {
  return (
    <div className="p-4 border-b border-slate-100 last:border-0">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {[doc?.clienteNombre, doc?.clienteApellidos].filter(Boolean).join(" ") || "Sin nombre"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{doc?.numero || "—"} · {safeDate(doc?.fecha)}</p>
        </div>
        {doc?.facturada ? (
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            Facturado
          </span>
        ) : (
          <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            Borrador
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 active:bg-blue-200">
          Editar
        </button>
        <button onClick={onPdf}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 active:bg-slate-200">
          PDF
        </button>
        <button onClick={onFacturar}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 active:bg-emerald-200">
          Facturar
        </button>
        <button onClick={onDelete}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 active:bg-red-200 ml-auto">
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function FacturasGuardadas() {
  const navigate = useNavigate();
  const { borradores, upsertFactura, removeBorrador, loading } = useData();
  const [confirm, setConfirm]   = useState(null); // { id, numero } — eliminar
  const [facturar, setFacturar] = useState(null); // { doc } — emitir factura

  const handleEliminar = async (id) => {
    await removeBorrador(id);
    setConfirm(null);
    toast.success("Borrador eliminado");
  };

  const handleFacturar = async (doc) => {
    await upsertFactura({ ...doc, facturada: true, documentType: "factura" });
    await removeBorrador(doc.id);
    setFacturar(null);
    toast.success("Factura emitida correctamente");
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <ToastContainer position="bottom-center" />

      {confirm && (
        <ConfirmDialog
          message={`¿Eliminar el borrador "${confirm.numero || "sin número"}"?`}
          onConfirm={() => handleEliminar(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {facturar && (
        <ConfirmDialog
          message={`¿Emitir la factura de "${facturar.doc.clienteNombre || "este cliente"}"? Se moverá a Facturas Emitidas.`}
          confirmLabel="Emitir factura"
          confirmClass="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={() => handleFacturar(facturar.doc)}
          onCancel={() => setFacturar(null)}
        />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Borradores</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? "Cargando…" : `${borradores.length} documento${borradores.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button onClick={() => navigate("/presupuestos")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl transition-colors">
            + Nuevo
          </button>
        </div>

        {loading ? (
          <Skeleton />
        ) : borradores.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No hay borradores guardados.</p>
            <button onClick={() => navigate("/presupuestos")}
              className="mt-3 text-sm text-blue-600 font-medium">
              Crear primer documento
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {borradores.map((doc) => (
                <DocCard key={doc.id} doc={doc}
                  onEdit={    () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`)}
                  onPdf={     () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`)}
                  onFacturar={() => setFacturar({ doc })}
                  onDelete={  () => setConfirm({ id: doc.id, numero: doc.numero })}
                />
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Número</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {borradores.map((doc) => {
                    const cliente = [doc?.clienteNombre, doc?.clienteApellidos].filter(Boolean).join(" ") || "—";
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">{doc.numero || "—"}</td>
                        <td className="px-5 py-3 text-slate-700">{cliente}</td>
                        <td className="px-5 py-3 text-slate-500">{safeDate(doc.fecha)}</td>
                        <td className="px-5 py-3">
                          {doc.facturada
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Facturado</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Borrador</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {[
                              { label:"Editar",   color:"bg-blue-100 text-blue-700",      fn: () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`) },
                              { label:"PDF",      color:"bg-slate-100 text-slate-700",    fn: () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`) },
                              { label:"Facturar", color:"bg-emerald-100 text-emerald-700",fn: () => setFacturar({ doc }) },
                              { label:"Eliminar", color:"bg-red-100 text-red-700",        fn: () => setConfirm({ id: doc.id, numero: doc.numero }) },
                            ].map(({ label, color, fn }) => (
                              <button key={label} onClick={fn}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${color} hover:opacity-80`}>
                                {label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
