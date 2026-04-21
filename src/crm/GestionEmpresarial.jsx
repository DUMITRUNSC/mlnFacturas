import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";

function SummaryCard({ label, value, accent }) {
  const bar = { blue: "bg-blue-500", emerald: "bg-emerald-500", amber: "bg-amber-500" };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className={`w-6 h-1 rounded-full mb-3 ${bar[accent]}`} />
      <p className="text-xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function NavCard({ label, description, onClick, color }) {
  const variants = {
    blue:    "border-blue-200 hover:border-blue-400 hover:bg-blue-50",
    emerald: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50",
    amber:   "border-amber-200 hover:border-amber-400 hover:bg-amber-50",
    violet:  "border-violet-200 hover:border-violet-400 hover:bg-violet-50",
  };
  const dot = {
    blue:    "bg-blue-500",
    emerald: "bg-emerald-500",
    amber:   "bg-amber-500",
    violet:  "bg-violet-500",
  };
  return (
    <button
      onClick={onClick}
      className={`bg-white border-2 rounded-xl p-5 text-left transition-all shadow-sm w-full group ${variants[color]}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot[color]}`} />
        <div>
          <p className="font-semibold text-slate-800 group-hover:text-slate-900">{label}</p>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
        </div>
        <svg className="ml-auto shrink-0 text-slate-300 group-hover:text-slate-500 mt-0.5 transition-colors"
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
    </button>
  );
}

export default function GestionEmpresarial() {
  const navigate = useNavigate();
  const { facturas, presupuestos, borradores } = useData();
  const counts = useMemo(() => ({
    facturas:     facturas.length,
    presupuestos: presupuestos.length,
    borradores:   borradores.length,
  }), [facturas, presupuestos, borradores]);

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <SummaryCard label="Facturas emitidas" value={counts.facturas} accent="emerald" />
        <SummaryCard label="Presupuestos" value={counts.presupuestos} accent="blue" />
        <SummaryCard label="Borradores" value={counts.borradores} accent="amber" />
      </div>

      {/* Nav cards */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
          Secciones
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <NavCard
            label="Facturas Emitidas"
            description="Consultar y gestionar facturas"
            onClick={() => navigate("/facturas-guardadas")}
            color="emerald"
          />
          <NavCard
            label="Presupuestos Guardados"
            description="Ver y editar presupuestos"
            onClick={() => navigate("/presupuestos-guardadas")}
            color="blue"
          />
          <NavCard
            label="Borradores"
            description="Documentos pendientes de emitir"
            onClick={() => navigate("/facturas-guardadas")}
            color="amber"
          />
          <NavCard
            label="Balances"
            description="Resumen financiero y totales"
            onClick={() => navigate("/balances")}
            color="violet"
          />
        </div>
      </div>
    </div>
  );
}
