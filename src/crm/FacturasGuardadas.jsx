import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { docTotal } from "../utils/docUtils.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function toDate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function fmtFecha(v) {
  const d = toDate(v);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}
function fmtEur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
}
function initials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
}

/* ─── Config ──────────────────────────────────────────────────────────────── */
const ESTADOS = ["Todos", "Borrador", "Facturado"];
const ESTADO_CFG = {
  Borrador:   { dot: "bg-amber-400",    badge: "bg-amber-50 text-amber-700",    label: "Borrador — pendiente de emitir" },
  Facturado:  { dot: "bg-emerald-500",  badge: "bg-emerald-50 text-emerald-700", label: "Facturada — emitida al cliente" },
};
const PERIODS = [
  { value: null, label: "Todo el año" },
  { value: 1,    label: "Enero – Marzo"      },
  { value: 2,    label: "Abril – Junio"      },
  { value: 3,    label: "Julio – Septiembre" },
  { value: 4,    label: "Octubre – Diciembre"},
];

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-3">
          <div className="flex gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
            </div>
          </div>
          <div className="h-20 bg-gray-50 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-14 bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 bg-gray-50 rounded-xl" />
              <div className="h-12 bg-gray-50 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Mobile Card ─────────────────────────────────────────────────────────── */
function MobileCard({ doc, onEdit, onPdf, onEmitir, onDelete }) {
  const total  = docTotal(doc);
  const base   = (doc.items || []).reduce((s, x) => s + Number(x.quantity || 0) * Number(x.price || 0), 0);
  const ivaAmt = total - base;
  const esFact = !!doc.facturada;
  const cfg    = esFact ? ESTADO_CFG.Facturado : ESTADO_CFG.Borrador;
  const items  = doc.items?.length ?? 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4 mx-4">

      {/* ── Cabecera del cliente ── */}
      <div className="px-5 pt-5 pb-4 flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl font-black text-lg flex items-center justify-center shrink-0
          ${esFact ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {initials(doc.clienteNombre)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-gray-900 leading-tight">
            {doc.clienteNombre || "Sin nombre"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Nº {doc.numero || "—"} · {fmtFecha(doc.fecha)}
          </p>
          {items > 0 && (
            <p className="text-sm text-gray-400 mt-0.5">
              {items} {items === 1 ? "trabajo incluido" : "trabajos incluidos"}
            </p>
          )}
        </div>
      </div>

      {/* ── Total destacado ── */}
      <div className="mx-4 mb-4 bg-gray-50 rounded-2xl px-5 py-4">
        <p className="text-sm font-medium text-gray-500 mb-1">Importe total de la factura</p>
        <p className="text-3xl font-black text-gray-900 tabular-nums">{fmtEur(total)}</p>
        <div className="flex gap-4 mt-2">
          <p className="text-xs text-gray-400">Base: <span className="font-semibold text-gray-600">{fmtEur(base)}</span></p>
          <p className="text-xs text-gray-400">IVA: <span className="font-semibold text-gray-600">{fmtEur(ivaAmt)}</span></p>
        </div>
      </div>

      {/* ── Estado ── */}
      <div className="px-5 mb-5">
        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${cfg.badge}`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* ── Botones de acción ── */}
      <div className="px-4 pb-5 space-y-2">
        <button onClick={onEdit}
          className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-base font-bold rounded-xl transition-colors flex items-center justify-center gap-3 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Abrir y editar esta factura
        </button>

        <button onClick={onPdf}
          className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Ver e imprimir el PDF
        </button>

        {!esFact ? (
          <button onClick={onEmitir}
            className="w-full py-3.5 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-3 border border-emerald-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Emitir esta factura al cliente
          </button>
        ) : (
          <div className="w-full py-3.5 bg-emerald-50 rounded-xl flex items-center justify-center gap-3 border border-emerald-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={2} strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-sm font-semibold text-emerald-700">Factura ya emitida al cliente</span>
          </div>
        )}

        <button onClick={onDelete}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-600 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-3 border border-red-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
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

/* ─── Desktop Row ─────────────────────────────────────────────────────────── */
function DesktopRow({ doc, onEdit, onPdf, onEmitir, onDelete }) {
  const total  = docTotal(doc);
  const esFact = !!doc.facturada;
  const cfg    = esFact ? ESTADO_CFG.Facturado : ESTADO_CFG.Borrador;

  return (
    <tr className="border-b border-gray-100 last:border-0 hover:bg-emerald-50/30 transition-colors">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0
            ${esFact ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {initials(doc.clienteNombre)}
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">{doc.clienteNombre || "Sin nombre"}</p>
            {doc.clienteCIF && <p className="text-xs text-gray-400">{doc.clienteCIF}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm font-mono font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg">{doc.numero || "—"}</span>
      </td>
      <td className="px-5 py-4">
        <span className="text-sm text-gray-600">{fmtFecha(doc.fecha)}</span>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {esFact ? "Facturada" : "Borrador"}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <span className="text-base font-bold text-gray-900 tabular-nums">{fmtEur(total)}</span>
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-2">
          <button onClick={onEdit}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Editar
          </button>
          <button onClick={onPdf}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
            PDF
          </button>
          {!esFact && (
            <button onClick={onEmitir}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-xl transition-colors">
              Emitir
            </button>
          )}
          <button onClick={onDelete}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function FacturasGuardadas() {
  const navigate = useNavigate();
  const { borradores, upsertFactura, removeBorrador, loading } = useData();

  const [confirm,      setConfirm]      = useState(null);
  const [emitir,       setEmitir]       = useState(null);
  const [busqueda,     setBusqueda]     = useState("");
  const [estadoFilter, setEstadoFilter] = useState("Todos");
  const [yearFilter,   setYearFilter]   = useState(() => new Date().getFullYear());
  const [periodFilter, setPeriodFilter] = useState(null);

  const allYears = useMemo(() => {
    const s = new Set();
    borradores.forEach(d => { const dt = toDate(d.fecha); if (dt) s.add(dt.getFullYear()); });
    const years = Array.from(s).sort((a, b) => b - a);
    return years.length ? years : [new Date().getFullYear()];
  }, [borradores]);

  const filtered = useMemo(() => {
    const q = busqueda.toLowerCase();
    return borradores
      .filter(d => {
        if (q) {
          const n = (d.clienteNombre || "").toLowerCase();
          const m = (d.numero || "").toLowerCase();
          if (!n.includes(q) && !m.includes(q)) return false;
        }
        if (estadoFilter === "Borrador"  && d.facturada)  return false;
        if (estadoFilter === "Facturado" && !d.facturada) return false;
        const dt = toDate(d.fecha);
        if (yearFilter !== null && (!dt || dt.getFullYear() !== yearFilter)) return false;
        if (periodFilter !== null && dt && Math.floor(dt.getMonth() / 3) + 1 !== periodFilter) return false;
        return true;
      })
      .sort((a, b) => { const da = toDate(a.fecha), db = toDate(b.fecha); if (!da) return 1; if (!db) return -1; return db - da; });
  }, [borradores, busqueda, estadoFilter, yearFilter, periodFilter]);

  const totalPendiente = useMemo(
    () => filtered.filter(d => !d.facturada).reduce((s, d) => s + docTotal(d), 0),
    [filtered]
  );

  const handleEliminar = async (id) => {
    await removeBorrador(id);
    setConfirm(null);
    toast.success("Factura eliminada");
  };

  const handleEmitir = async (doc) => {
    await upsertFactura({ ...doc, facturada: true, documentType: "factura" });
    await removeBorrador(doc.id);
    setEmitir(null);
    toast.success("¡Factura emitida correctamente!");
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <ToastContainer position="bottom-center" toastClassName="!rounded-2xl !text-base !font-semibold !shadow-xl" />

      {confirm && (
        <ConfirmDialog
          message={`¿Seguro que quieres eliminar la factura "${confirm.numero || "sin número"}"? Esta acción no se puede deshacer.`}
          onConfirm={() => handleEliminar(confirm.id)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {emitir && (
        <ConfirmDialog
          message={`¿Emitir la factura de "${emitir.doc.clienteNombre || "este cliente"}"? Se marcará como facturada.`}
          confirmLabel="Sí, emitir factura"
          confirmClass="bg-emerald-600 hover:bg-emerald-700"
          onConfirm={() => handleEmitir(emitir.doc)}
          onCancel={() => setEmitir(null)}
        />
      )}

      {/* ══ CABECERA ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Facturas</h1>
            <p className="text-base text-gray-500 mt-1">
              {loading
                ? "Cargando tus facturas…"
                : `${filtered.length} factura${filtered.length !== 1 ? "s" : ""} · Pendiente: ${fmtEur(totalPendiente)}`}
            </p>
          </div>
          <button onClick={() => navigate("/facturas")}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-2xl transition-colors shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Nueva factura
          </button>
        </div>
      </div>

      {/* ══ BUSCADOR ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shrink-0">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre del cliente o número..."
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-base placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
          />
          {busqueda && (
            <button onClick={() => setBusqueda("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ══ FILTROS ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shrink-0">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Estado */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
            {ESTADOS.map(e => (
              <button key={e} onClick={() => setEstadoFilter(e)}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                  ${estadoFilter === e ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                {e}
              </button>
            ))}
          </div>

          {/* Año */}
          <div className="relative">
            <select value={yearFilter ?? ""} onChange={e => { setYearFilter(e.target.value ? Number(e.target.value) : null); setPeriodFilter(null); }}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer transition-colors border-0">
              {allYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>

          {/* Trimestre */}
          <div className="relative">
            <select value={periodFilter ?? ""} onChange={e => setPeriodFilter(e.target.value ? Number(e.target.value) : null)}
              className="appearance-none bg-gray-100 hover:bg-gray-200 rounded-xl px-4 py-2.5 pr-8 text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer transition-colors border-0">
              {PERIODS.map(p => <option key={String(p.value)} value={p.value ?? ""}>{p.label}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
          </div>
        </div>
      </div>

      {/* ══ LISTA ══ */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
        {loading ? (
          <Skeleton />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth={1.5} strokeLinecap="round">
                <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
              </svg>
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">
              {borradores.length === 0 ? "Todavía no tienes facturas" : "No hay resultados"}
            </p>
            <p className="text-base text-gray-400 mb-6 max-w-xs leading-relaxed">
              {borradores.length === 0
                ? "Pulsa el botón de abajo para crear tu primera factura"
                : "Prueba a cambiar los filtros o el texto de búsqueda"}
            </p>
            {borradores.length === 0 && (
              <button onClick={() => navigate("/facturas")}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-2xl transition-colors shadow-sm">
                Crear mi primera factura
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Móvil: tarjetas grandes */}
            <div className="md:hidden pt-4">
              {filtered.map(doc => (
                <MobileCard key={doc.id} doc={doc}
                  onEdit={   () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`)}
                  onPdf={    () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`)}
                  onEmitir={ () => setEmitir({ doc })}
                  onDelete={ () => setConfirm({ id: doc.id, numero: doc.numero })}
                />
              ))}
            </div>

            {/* Desktop: tabla */}
            <div className="hidden md:block bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Cliente</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Número</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Fecha</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Total</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <DesktopRow key={doc.id} doc={doc}
                      onEdit={   () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`)}
                      onPdf={    () => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`)}
                      onEmitir={ () => setEmitir({ doc })}
                      onDelete={ () => setConfirm({ id: doc.id, numero: doc.numero })}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Botón flotante móvil */}
      <button onClick={() => navigate("/facturas")}
        className="md:hidden fixed bottom-20 right-4 flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg z-40 transition-colors"
        style={{ boxShadow: "0 8px 24px rgba(5,150,105,0.35)" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nueva
      </button>
    </div>
  );
}
