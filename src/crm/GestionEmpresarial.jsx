import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { docTotal } from "../utils/docUtils.js";

function fmtEur(n) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n || 0);
}

/* ─── Sección de navegación grande ──────────────────────────────────────── */
function BigNavBtn({ label, description, count, countLabel, icon, iconBg, iconColor, onClick, accent }) {
  return (
    <button onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-left w-full hover:border-gray-200 hover:shadow-md transition-all flex items-center gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth={1.75} strokeLinecap="round">
          {icon}
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-900 leading-tight">{label}</p>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        {count != null && (
          <p className={`text-sm font-semibold mt-1.5 ${accent}`}>
            {count} {countLabel}
          </p>
        )}
      </div>
      <svg className="text-gray-300 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export default function GestionEmpresarial() {
  const navigate = useNavigate();
  const { facturas, presupuestos, borradores } = useData();

  const totalFacturado = useMemo(() =>
    facturas.filter(f => f.facturada).reduce((s, d) => s + docTotal(d), 0),
    [facturas]
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">

      {/* ══ CABECERA ══ */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-5 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Resumen general</h1>
        <p className="text-base text-gray-500 mt-1">Acceso rápido a todas las secciones</p>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 md:pb-6 p-4 space-y-3">

        {/* Resumen rápido */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-gray-50">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Totales globales</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
            <div className="px-5 py-4">
              <p className="text-3xl font-black text-emerald-600 tabular-nums">{facturas.filter(f=>f.facturada).length}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Facturas emitidas</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-3xl font-black text-blue-600 tabular-nums">{presupuestos.length}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Presupuestos</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-3xl font-black text-amber-600 tabular-nums">{borradores.length}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Borradores</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-2xl font-black text-violet-600 tabular-nums">{fmtEur(totalFacturado)}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Total facturado</p>
            </div>
          </div>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 mb-3">Ir a una sección</p>

        <BigNavBtn
          label="Mis Facturas"
          description="Ver, editar y emitir facturas"
          count={borradores.length}
          countLabel={`documento${borradores.length !== 1 ? "s" : ""} guardado${borradores.length !== 1 ? "s" : ""}`}
          iconBg="bg-emerald-100"
          iconColor="#059669"
          accent="text-emerald-600"
          icon={<><path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/></>}
          onClick={() => navigate("/facturas-guardadas")}
        />

        <BigNavBtn
          label="Mis Presupuestos"
          description="Ver, editar y convertir presupuestos"
          count={presupuestos.length}
          countLabel={`presupuesto${presupuestos.length !== 1 ? "s" : ""} guardado${presupuestos.length !== 1 ? "s" : ""}`}
          iconBg="bg-blue-100"
          iconColor="#2563eb"
          accent="text-blue-600"
          icon={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>}
          onClick={() => navigate("/presupuestos-guardadas")}
        />

        <BigNavBtn
          label="Balances"
          description="Resumen financiero y totales por año"
          count={facturas.filter(f=>f.facturada).length}
          countLabel="factura emitida"
          iconBg="bg-violet-100"
          iconColor="#7c3aed"
          accent="text-violet-600"
          icon={<><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>}
          onClick={() => navigate("/balances")}
        />

        <BigNavBtn
          label="Datos de empresa"
          description="Editar nombre, CIF, dirección y logo"
          iconBg="bg-gray-100"
          iconColor="#374151"
          accent="text-gray-600"
          icon={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}
          onClick={() => navigate("/empresa")}
        />

      </div>
    </div>
  );
}
