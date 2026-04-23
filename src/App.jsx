import React, { useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./context/DataContext.jsx";
import { BusinessContext } from "./context/BusinessContext.jsx";
import { docTotal, formatDate as fmtDate } from "./utils/docUtils.js";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function fmtEur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3 px-4 py-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="animate-pulse flex gap-4 items-center bg-white rounded-2xl px-4 py-4 border border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded-lg w-2/5" />
            <div className="h-3 bg-gray-50 rounded-lg w-1/4" />
          </div>
          <div className="h-5 bg-gray-100 rounded-lg w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();
  const { business } = useContext(BusinessContext);
  const { facturas, presupuestos, borradores, loading } = useData();

  const totalFacturado = useMemo(() =>
    facturas.filter((f) => f.facturada).reduce((acc, f) => acc + docTotal(f), 0),
    [facturas]
  );

  const recent = useMemo(() => {
    return [
      ...facturas.map((d)     => ({ ...d, _tipo: "factura"     })),
      ...presupuestos.map((d) => ({ ...d, _tipo: "presupuesto" })),
    ]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
      .map((d) => ({
        id:      d.id,
        numero:  d.numero,
        cliente: d.clienteNombre,
        fecha:   fmtDate(d.fecha),
        tipo:    d._tipo,
        total:   docTotal(d),
      }));
  }, [facturas, presupuestos]);

  const companyName = business?.companyName || "MLN Construcciones";
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto pb-24 md:pb-6">

      {/* ── Cabecera de bienvenida ── */}
      <div className="bg-white border-b border-gray-100 px-5 py-6 shrink-0">
        <p className="text-sm text-gray-400 capitalize mb-1">{today}</p>
        <h1 className="text-2xl font-black text-gray-900">{greeting()}</h1>
        <p className="text-base text-gray-500 mt-0.5 font-medium">{companyName}</p>
      </div>

      <div className="flex-1 px-4 py-5 space-y-5">

        {/* ── Acciones principales ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">¿Qué quieres hacer?</p>
          <div className="grid grid-cols-2 gap-3">

            {/* Presupuesto */}
            <button onClick={() => navigate("/presupuestos")}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl p-5 text-left transition-colors shadow-sm"
              style={{ boxShadow: "0 4px 16px rgba(37,99,235,0.25)" }}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <p className="font-black text-lg leading-tight">Nuevo presupuesto</p>
              <p className="text-blue-200 text-sm mt-1">Crear y exportar PDF</p>
            </button>

            {/* Factura */}
            <button onClick={() => navigate("/facturas")}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl p-5 text-left transition-colors shadow-sm"
              style={{ boxShadow: "0 4px 16px rgba(5,150,105,0.25)" }}>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                  <line x1="8" y1="7" x2="16" y2="7"/>
                  <line x1="8" y1="11" x2="16" y2="11"/>
                  <line x1="8" y1="15" x2="13" y2="15"/>
                </svg>
              </div>
              <p className="font-black text-lg leading-tight">Nueva factura</p>
              <p className="text-emerald-200 text-sm mt-1">Emitir y exportar PDF</p>
            </button>
          </div>
        </div>

        {/* ── Estadísticas ── */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Resumen</p>
          <div className="grid grid-cols-2 gap-3">

            <button onClick={() => navigate("/facturas-guardadas")}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round">
                  <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                  <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : facturas.filter(f => f.facturada).length}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Facturas emitidas</p>
            </button>

            <button onClick={() => navigate("/presupuestos-guardadas")}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : presupuestos.length}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Presupuestos</p>
            </button>

            <button onClick={() => navigate("/facturas-guardadas")}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : borradores.length}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Borradores</p>
            </button>

            <button onClick={() => navigate("/balances")}
              className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:border-gray-200 hover:shadow-sm transition-all">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <p className="text-2xl font-black text-gray-900 tabular-nums">
                {loading ? "—" : fmtEur(totalFacturado)}
              </p>
              <p className="text-sm text-gray-500 mt-1 font-medium">Total facturado</p>
            </button>

          </div>
        </div>

        {/* ── Documentos recientes ── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Últimos documentos</p>
            <button onClick={() => navigate("/gestion-empresarial")}
              className="text-sm text-blue-600 font-semibold">
              Ver todo →
            </button>
          </div>

          {loading ? (
            <Skeleton />
          ) : recent.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 py-12 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-700 mb-1">Sin documentos todavía</p>
              <p className="text-sm text-gray-400">Crea tu primer presupuesto o factura</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((d) => (
                <button key={d.id}
                  onClick={() => navigate(`/documento?edit=${encodeURIComponent(d.id)}`)}
                  className="w-full bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-4 hover:border-gray-200 hover:shadow-sm transition-all text-left">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
                    ${d.tipo === "factura" ? "bg-emerald-100" : "bg-blue-100"}`}>
                    {d.tipo === "factura" ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round">
                        <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                        <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{d.cliente || "Sin nombre"}</p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {d.tipo === "factura" ? "Factura" : "Presupuesto"} · {d.numero || "—"} · {d.fecha}
                    </p>
                  </div>
                  <p className="text-base font-black text-gray-900 tabular-nums shrink-0">
                    {d.total != null ? fmtEur(d.total) : "—"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
