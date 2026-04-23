import React from "react";

const eur = (n) => Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const inp =
  "w-full px-4 py-3.5 text-sm font-medium bg-gray-50 border-2 border-gray-200 rounded-xl " +
  "placeholder-gray-300 focus:outline-none focus:bg-white focus:border-blue-500 " +
  "focus:ring-4 focus:ring-blue-500/10 hover:border-gray-300 transition-all duration-200";

function Field({ label, children, required }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {label}
        {required && <span className="text-red-400 text-xs normal-case font-medium tracking-normal">*</span>}
      </label>
      {children}
    </div>
  );
}

const UNITS = [
  { value: "m²",      label: "m²",    icon: "□" },
  { value: "ml",      label: "ml",    icon: "↔" },
  { value: "Unidades",label: "Unid.", icon: "#" },
  { value: "h",       label: "Horas", icon: "◷" },
];

/**
 * ItemModal — modal para añadir / editar una partida.
 * Props:
 *   isOpen, onClose, onSave, form, onChange, isEditing
 *   accentBg (optional Tailwind bg class), accentHover (optional hover)
 */
export default function ItemModal({ isOpen, onClose, onSave, form, onChange, isEditing, accentBg = "bg-blue-600", accentHover = "hover:bg-blue-700" }) {
  if (!isOpen) return null;

  const qty     = parseFloat(form.quantity) || 0;
  const price   = parseFloat(form.price)    || 0;
  const ivaRate = parseFloat(form.iva)      || 0;
  const base    = qty * price;
  const ivaAmt  = base * (ivaRate / 100);
  const total   = base + ivaAmt;
  const hasCalc = qty > 0 && price > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[95dvh] overflow-y-auto"
        style={{ boxShadow: "0 -4px 60px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)" }}>

        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3.5 pb-2">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-4 pb-5 sm:pt-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${accentBg} rounded-xl flex items-center justify-center shrink-0`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
                {isEditing ? (
                  <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                ) : (
                  <><path d="M12 5v14M5 12h14"/></>
                )}
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
                {isEditing ? "Modificar" : "Nuevo concepto"}
              </p>
              <h3 className="font-black text-gray-900 text-base">
                {isEditing ? "Editar partida" : "Añadir partida"}
              </h3>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-5">

          {/* Descripción */}
          <Field label="Descripción del trabajo" required>
            <textarea
              id="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              placeholder="Ej: Pintura de fachada exterior con pintura plástica de alta calidad, incluye imprimación..."
              className={`${inp} resize-none leading-relaxed`}
            />
          </Field>

          {/* Cantidad + Precio */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad" required>
              <div className="relative">
                <input type="number" id="quantity" value={form.quantity} onChange={onChange}
                  className={`${inp} pr-12`} placeholder="0" min="0" step="any" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">
                  {form.unit === "Unidades" ? "Unid" : form.unit}
                </span>
              </div>
            </Field>
            <Field label="Precio / unidad (€)" required>
              <div className="relative">
                <input type="number" id="price" value={form.price} onChange={onChange}
                  className={`${inp} pr-8`} placeholder="0.00" min="0" step="any" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 pointer-events-none">€</span>
              </div>
            </Field>
          </div>

          {/* IVA + Unidad */}
          <div className="grid grid-cols-2 gap-4">
            {/* IVA */}
            <Field label="IVA (%)">
              <div className="flex gap-1.5">
                {[0, 10, 21].map((v) => (
                  <button key={v} type="button"
                    onClick={() => onChange({ target: { id: "iva", value: v } })}
                    className={`flex-1 py-3 text-xs font-black rounded-xl border-2 transition-all
                      ${parseFloat(form.iva) === v
                        ? `${accentBg} border-transparent text-white`
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"}`}>
                    {v}%
                  </button>
                ))}
              </div>
            </Field>

            {/* Unidad */}
            <Field label="Unidad de medida">
              <div className="grid grid-cols-2 gap-1.5">
                {UNITS.map((u) => (
                  <label key={u.value}
                    className={`cursor-pointer flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-bold border-2 rounded-xl transition-all
                      ${form.unit === u.value
                        ? `${accentBg} border-transparent text-white`
                        : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"}`}>
                    <input type="radio" name="unit" value={u.value} checked={form.unit === u.value}
                      onChange={(e) => onChange({ target: { id: "unit", value: e.target.value } })}
                      className="hidden" />
                    <span className="font-black text-[11px]">{u.icon}</span>
                    {u.label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* ── Live preview ── */}
          {hasCalc ? (
            <div className="bg-gray-900 rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4">Vista previa del cálculo</p>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {qty} {form.unit === "Unidades" ? "Unid." : form.unit} × {eur(price)} €
                    </span>
                    <span className="text-sm font-bold text-gray-200 tabular-nums">{eur(base)} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">IVA ({ivaRate}%)</span>
                    <span className="text-sm font-bold text-gray-200 tabular-nums">{eur(ivaAmt)} €</span>
                  </div>
                </div>
              </div>
              <div className={`px-5 py-4 ${accentBg}`}>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 font-bold text-sm">Total partida</span>
                  <span className="text-white font-black text-xl tabular-nums">{eur(total)} €</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-sm text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
              </svg>
              Introduce cantidad y precio para ver el total calculado
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-100">
          <button onClick={onClose}
            className="px-5 py-3 text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={onSave}
            className={`px-7 py-3 text-sm font-black ${accentBg} ${accentHover} text-white rounded-xl transition-colors shadow-sm flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              {isEditing ? <><polyline points="20 6 9 17 4 12"/></> : <><path d="M12 5v14M5 12h14"/></>}
            </svg>
            {isEditing ? "Guardar cambios" : "Añadir partida"}
          </button>
        </div>
      </div>
    </div>
  );
}
