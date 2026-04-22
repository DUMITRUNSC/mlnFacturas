import React, { useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./context/DataContext.jsx";
import { BusinessContext } from "./context/BusinessContext.jsx";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function docTotal(doc) {
  const base = (doc.items || []).reduce((s, x) => s + Number(x.quantity || 0) * Number(x.price || 0), 0);
  const iva  = (doc.items || []).reduce((s, x) =>
    s + Number(x.ivaAmount ?? (Number(x.quantity || 0) * Number(x.price || 0) * (Number(x.iva || 0) / 100))), 0);
  return base + iva;
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("es-ES");
  } catch { return "—"; }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function todayStr() {
  return new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent, onClick }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue:    "bg-blue-50 text-blue-700 border-blue-200",
    amber:   "bg-amber-50 text-amber-700 border-amber-200",
    violet:  "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left w-full transition-all hover:shadow-md active:scale-95 ${colors[accent] || colors.blue}`}
    >
      <p className="text-2xl font-black tabular-nums leading-none">{value}</p>
      <p className="text-sm font-semibold mt-1.5 opacity-80">{label}</p>
    </button>
  );
}

/* ─── Recent Row ─────────────────────────────────────────────────────────── */
function RecentRow({ numero, cliente, fecha, tipo, total, onClick }) {
  const badge = tipo === "factura"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 border-b border-slate-100 last:border-0 text-left hover:bg-slate-50 transition-colors px-1 rounded-xl">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{cliente || "—"}</p>
        <p className="text-xs text-slate-400 mt-0.5">{numero || "—"} · {fecha}</p>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${badge}`}>
        {tipo === "factura" ? "Factura" : "Presupuesto"}
      </span>
      <span className="text-sm font-bold text-slate-800 tabular-nums shrink-0 min-w-[72px] text-right">
        {total != null ? `${Number(total).toFixed(2)} €` : "—"}
      </span>
    </button>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 py-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="flex-1 space-y-1.5">
            <div className="h-4 bg-slate-200 rounded-lg w-2/5" />
            <div className="h-3 bg-slate-200 rounded-lg w-1/3" />
          </div>
          <div className="h-6 bg-slate-200 rounded-full w-20 shrink-0" />
          <div className="h-4 bg-slate-200 rounded-lg w-16 shrink-0" />
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
      .slice(0, 8)
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 pb-8">

      {/* ── Greeting ── */}
      <div>
        <p className="text-slate-500 text-sm capitalize">{todayStr()}</p>
        <h1 className="text-2xl font-black text-slate-900 mt-0.5">{greeting()}</h1>
        <p className="text-slate-500 text-sm">{companyName}</p>
      </div>

      {/* ── Main actions — the most important thing ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Presupuesto */}
        <button
          onClick={() => navigate("/presupuestos")}
          className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl p-5 text-left transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p className="font-black text-lg leading-tight">Presupuesto</p>
          <p className="text-blue-200 text-xs mt-1">Crear y exportar PDF</p>
        </button>

        {/* Factura */}
        <button
          onClick={() => navigate("/facturas")}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl p-5 text-left transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
              <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/>
              <line x1="8" y1="11" x2="16" y2="11"/>
              <line x1="8" y1="15" x2="13" y2="15"/>
            </svg>
          </div>
          <p className="font-black text-lg leading-tight">Factura</p>
          <p className="text-emerald-200 text-xs mt-1">Emitir y exportar PDF</p>
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Facturas emitidas"
          value={loading ? "—" : facturas.filter(f => f.facturada).length}
          accent="emerald"
          onClick={() => navigate("/facturas-guardadas")}
        />
        <StatCard
          label="Presupuestos"
          value={loading ? "—" : presupuestos.length}
          accent="blue"
          onClick={() => navigate("/presupuestos-guardadas")}
        />
        <StatCard
          label="Borradores"
          value={loading ? "—" : borradores.length}
          accent="amber"
          onClick={() => navigate("/facturas-guardadas")}
        />
        <StatCard
          label="Total facturado"
          value={loading ? "—" : `${totalFacturado.toFixed(0)} €`}
          accent="violet"
          onClick={() => navigate("/balances")}
        />
      </div>

      {/* ── Recent documents ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Documentos recientes</h2>
            {!loading && recent.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{recent.length} documentos</p>
            )}
          </div>
          <button
            onClick={() => navigate("/gestion-empresarial")}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Ver todos
          </button>
        </div>

        <div className="px-4 py-1">
          {loading ? (
            <Skeleton />
          ) : recent.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="text-slate-600 font-semibold">Sin documentos todavía</p>
              <p className="text-slate-400 text-sm mt-1">Crea tu primer presupuesto o factura</p>
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={() => navigate("/presupuestos")}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/30">
                  Nuevo Presupuesto
                </button>
                <button onClick={() => navigate("/facturas")}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-600/30">
                  Nueva Factura
                </button>
              </div>
            </div>
          ) : (
            recent.map((d) => (
              <RecentRow
                key={d.id}
                {...d}
                onClick={() => navigate(`/documento?edit=${encodeURIComponent(d.id)}`)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Secondary actions ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate("/facturas-guardadas")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth={2} strokeLinecap="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">Borradores</p>
            <p className="text-xs text-slate-500 truncate">Documentos pendientes</p>
          </div>
        </button>

        <button
          onClick={() => navigate("/presupuestos-guardadas")}
          className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 text-left transition-all shadow-sm hover:shadow-md flex items-center gap-3"
        >
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 text-sm">Presupuestos</p>
            <p className="text-xs text-slate-500 truncate">Todos guardados</p>
          </div>
        </button>
      </div>
    </div>
  );
}
