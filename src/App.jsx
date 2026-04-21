import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "./context/DataContext.jsx";

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

/* ─── Stat Card ──────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }) {
  const bar = { blue:"bg-blue-500", emerald:"bg-emerald-500", amber:"bg-amber-500", violet:"bg-violet-500" };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col gap-2">
      <div className={`w-8 h-1 rounded-full ${bar[accent]}`} />
      <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

/* ─── Quick Action ───────────────────────────────────────────────────────── */
function QuickAction({ label, description, onClick, color }) {
  const v = {
    blue:    "bg-blue-600 hover:bg-blue-700",
    emerald: "bg-emerald-600 hover:bg-emerald-700",
    amber:   "bg-amber-500 hover:bg-amber-600",
    violet:  "bg-violet-600 hover:bg-violet-700",
  };
  return (
    <button onClick={onClick}
      className={`${v[color]} text-white rounded-xl p-5 text-left transition-colors shadow-sm w-full`}>
      <p className="font-semibold text-base mb-1">{label}</p>
      <p className="text-sm opacity-75">{description}</p>
    </button>
  );
}

/* ─── Recent Row ─────────────────────────────────────────────────────────── */
function RecentRow({ numero, cliente, fecha, tipo, total }) {
  const badge = tipo === "factura"
    ? "bg-emerald-100 text-emerald-700"
    : "bg-blue-100 text-blue-700";
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{cliente || "—"}</p>
        <p className="text-xs text-slate-500">{numero || "—"} · {fecha}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${badge}`}>
        {tipo === "factura" ? "Factura" : "Presupuesto"}
      </span>
      <span className="text-sm font-semibold text-slate-800 tabular-nums shrink-0">
        {total != null ? `${Number(total).toFixed(2)} €` : "—"}
      </span>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────── */
function EmptyState({ label, action, onAction }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-slate-500">{label}</p>
      {action && (
        <button onClick={onAction}
          className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium">
          {action}
        </button>
      )}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 py-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-1/4 ml-auto" />
        </div>
      ))}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
export default function App() {
  const navigate = useNavigate();
  const { facturas, presupuestos, borradores, loading } = useData();

  const totalFacturado = useMemo(() =>
    facturas.filter((f) => f.facturada).reduce((acc, f) => acc + docTotal(f), 0),
    [facturas]
  );

  const recent = useMemo(() => {
    return [
      ...facturas.map((d)     => ({ ...d, _tipo: "factura"      })),
      ...presupuestos.map((d) => ({ ...d, _tipo: "presupuesto"  })),
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

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 md:space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Panel de control</h2>
        <p className="text-slate-500 text-sm mt-1">MLN Construcciones en Altura SL</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Facturas emitidas"  value={facturas.filter(f=>f.facturada).length} sub="Solo facturadas"      accent="emerald" />
        <StatCard label="Presupuestos"        value={presupuestos.length}                    sub="Total en sistema"     accent="blue"    />
        <StatCard label="Borradores"          value={borradores.length}                      sub="Pendientes de emitir" accent="amber"   />
        <StatCard label="Total facturado"
          value={loading ? "—" : `${totalFacturado.toFixed(0)} €`}
          sub="Con IVA incluido"
          accent="violet" />
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Acciones rápidas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction label="Nuevo Presupuesto" description="Crear y exportar PDF"         onClick={() => navigate("/presupuestos")}        color="blue"    />
          <QuickAction label="Nueva Factura"     description="Crear y emitir factura"        onClick={() => navigate("/facturas")}            color="emerald" />
          <QuickAction label="Borradores"        description="Ver documentos pendientes"     onClick={() => navigate("/facturas-guardadas")}  color="amber"   />
          <QuickAction label="Datos Empresa"     description="Actualizar información"        onClick={() => navigate("/empresa")}             color="violet"  />
        </div>
      </div>

      {/* Recent */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Documentos recientes</h3>
          <button onClick={() => navigate("/gestion-empresarial")}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Ver todos
          </button>
        </div>
        <div className="px-5 py-1">
          {loading ? (
            <Skeleton />
          ) : recent.length === 0 ? (
            <EmptyState
              label="Aún no hay documentos. Crea tu primera factura o presupuesto."
              action="Crear presupuesto"
              onAction={() => navigate("/presupuestos")}
            />
          ) : (
            recent.map((d) => <RecentRow key={d.id} {...d} />)
          )}
        </div>
      </div>
    </div>
  );
}
