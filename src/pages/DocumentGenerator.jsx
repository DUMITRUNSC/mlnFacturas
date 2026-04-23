import React, { useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { BusinessContext } from "../context/BusinessContext.jsx";
import { useData } from "../context/DataContext.jsx";
import ItemModal from "../components/ItemModal.jsx";
import { generateFacturaPDF }     from "../utils/pdf/generateFacturaPDF.js";
import { generatePresupuestoPDF } from "../utils/pdf/generatePresupuestoPDF.js";

/* ─── Number formatter ────────────────────────────────────────────────────── */
const eur = (n) => Number(n).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ─── Field ───────────────────────────────────────────────────────────────── */
function Field({ label, error, children, hint, required }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
        {label}
        {required && <span className="text-red-400 text-xs normal-case font-medium tracking-normal">requerido</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 leading-relaxed">{hint}</p>}
      {error && (
        <p className="text-xs font-semibold text-red-500 flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Input class builder ─────────────────────────────────────────────────── */
const inp = (err) =>
  `w-full px-4 py-3.5 text-sm font-medium bg-gray-50 border-2 rounded-xl
   placeholder-gray-300 focus:outline-none focus:bg-white transition-all duration-200
   ${err
     ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10 bg-red-50/30"
     : "border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"}`;

/* ─── Section card ────────────────────────────────────────────────────────── */
function Section({ label, title, icon, iconBg = "bg-gray-100 text-gray-500", children, action, noPadding }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {icon && (
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              {icon}
            </div>
          )}
          <div>
            {label && <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-0.5">{label}</p>}
            <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          </div>
        </div>
        {action}
      </div>
      <div className={noPadding ? "" : "p-6"}>{children}</div>
    </div>
  );
}

/* ─── Toast ───────────────────────────────────────────────────────────────── */
function Toast({ show, message, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-6 z-50">
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white rounded-2xl shadow-2xl text-sm font-medium">
        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        {message}
        <button onClick={onClose} className="ml-1 opacity-40 hover:opacity-100 transition-opacity">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── DocumentGenerator ───────────────────────────────────────────────────── */
function DocumentGenerator({ documentType: initialType = "presupuesto" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const issueNow  = searchParams.get("issue") === "1";
  const autoPDF   = searchParams.get("autopdf") === "1";

  const { business } = useContext(BusinessContext);
  const { upsertFactura, upsertPresupuesto, upsertBorrador, removeBorrador, findDocById } = useData();

  const [documentType,     setDocumentType]     = useState(initialType);
  const [formData,         setFormData]         = useState({
    id: "", numero: "", fecha: "", clienteNombre: "", clienteCIF: "",
    clienteDireccion: "", clienteCP: "", clienteLocalidad: "", clienteProvincia: "",
    iva: 21, comentarios: "", items: [], facturada: false,
  });
  const [showToast,        setShowToast]        = useState(false);
  const [toastMsg,         setToastMsg]         = useState("");
  const [errors,           setErrors]           = useState({});
  const [isItemModalOpen,  setIsItemModalOpen]  = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm,         setItemForm]         = useState({ description: "", quantity: "", price: "", unit: "m²", iva: 21 });
  const [loaded,           setLoaded]           = useState(false);
  const [saving,           setSaving]           = useState(false);

  /* ─── Load document ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!editingId) { setLoaded(true); return; }
    const inMem = findDocById(editingId);
    if (inMem) {
      setFormData(inMem);
      if (inMem.documentType) setDocumentType(inMem.documentType);
      setLoaded(true);
      return;
    }
    import("../services/db.js").then(({ facturasSvc, presupuestosSvc, borradoresSvc }) =>
      Promise.all([
        facturasSvc.getById(editingId),
        presupuestosSvc.getById(editingId),
        borradoresSvc.getById(editingId),
      ])
    ).then(([f, p, b]) => {
      const found = f || p || b;
      if (found) { setFormData(found); if (found.documentType) setDocumentType(found.documentType); }
      setLoaded(true);
    });
  }, [editingId]); // eslint-disable-line

  useEffect(() => {
    if (!loaded || !issueNow || !formData.id) return;
    const issued = { ...formData, documentType: "factura", facturada: true };
    upsertFactura(issued);
    upsertBorrador({ ...formData, facturada: true });
    setFormData(issued);
  }, [issueNow, formData.id, loaded]); // eslint-disable-line

  useEffect(() => {
    if (!loaded || !autoPDF) return;
    (async () => { if (!validate()) return; await runPDF(); })();
  }, [autoPDF, loaded]); // eslint-disable-line

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handleNumberBlur = () => {
    const raw = String(formData.numero || "").trim();
    if (!raw) return;
    const numPart = raw.split(/[/_]/).pop();
    const padded  = String(parseInt(numPart, 10)).replace(/NaN/, "").padStart(4, "0");
    const year    = formData.fecha instanceof Date ? formData.fecha.getFullYear() : new Date().getFullYear();
    setFormData((p) => ({ ...p, numero: `${year}_${padded}` }));
  };

  const openAddItem = () => {
    setEditingItemIndex(null);
    setItemForm({ description: "", quantity: "", price: "", unit: "m²", iva: formData.iva });
    setIsItemModalOpen(true);
  };
  const openEditItem = (i) => {
    const s = formData.items[i];
    setEditingItemIndex(i);
    setItemForm({ description: s.description, quantity: s.quantity, price: s.price, unit: s.unit, iva: s.iva || formData.iva });
    setIsItemModalOpen(true);
  };
  const handleItemChange = (e) => {
    const { id, value } = e.target;
    setItemForm((p) => ({ ...p, [id]: value }));
  };
  const handleSaveItem = () => {
    if (!itemForm.description.trim() || isNaN(itemForm.quantity) || isNaN(itemForm.price)) {
      alert("Completa descripción, cantidad y precio.");
      return;
    }
    const qty      = parseFloat(itemForm.quantity);
    const price    = parseFloat(itemForm.price);
    const svcIva   = parseFloat(itemForm.iva) || formData.iva;
    const subtotal = qty * price;
    const ivaAmt   = subtotal * (svcIva / 100);
    const newItem  = { description: itemForm.description, quantity: qty, price, unit: itemForm.unit, iva: svcIva, total: subtotal, ivaAmount: ivaAmt, totalWithIVA: subtotal + ivaAmt };
    setFormData((p) => {
      const items = [...p.items];
      if (editingItemIndex !== null) items[editingItemIndex] = newItem; else items.push(newItem);
      return { ...p, items };
    });
    setIsItemModalOpen(false);
  };
  const removeItem = (i) => setFormData((p) => { const items = [...p.items]; items.splice(i, 1); return { ...p, items }; });

  /* ─── Validation ─────────────────────────────────────────────────────── */
  const validate = () => {
    const e   = {};
    const num = String(formData.numero || "").trim();
    if (!num)                                                                              e.numero           = "Número obligatorio";
    else if (!/^\d{4}\s*[_/]\s*\d{1,4}$/.test(num))                                      e.numero           = "Formato: AAAA_0001";
    if (!formData.fecha)                                                                   e.fecha            = "Fecha obligatoria";
    if (!formData.clienteNombre?.trim())                                                   e.clienteNombre    = "Nombre del cliente obligatorio";
    if (!formData.clienteCIF?.trim())                                                      e.clienteCIF       = "CIF/NIF obligatorio";
    else if (!/^(?:[0-9]{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/.test(formData.clienteCIF.trim()))
                                                                                           e.clienteCIF       = "Formato CIF/NIF no válido";
    if (!formData.clienteDireccion?.trim())                                                e.clienteDireccion = "Dirección obligatoria";
    if (!formData.clienteCP?.trim())                                                       e.clienteCP        = "Código postal obligatorio";
    else if (!/^\d{5}$/.test(formData.clienteCP.trim()))                                  e.clienteCP        = "5 dígitos";
    if (!formData.clienteLocalidad?.trim())                                                e.clienteLocalidad = "Localidad obligatoria";
    if (!formData.clienteProvincia?.trim())                                                e.clienteProvincia = "Provincia obligatoria";
    if (isNaN(formData.iva) || formData.iva < 0 || formData.iva > 100)                    e.iva              = "IVA 0–100";
    if (!Array.isArray(formData.items) || formData.items.length === 0)                    e.items            = "Añade al menos una partida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── PDF & Submit ───────────────────────────────────────────────────── */
  const runPDF = async (data = formData, type = documentType) => {
    try {
      if (type === "factura") await generateFacturaPDF({ formData: data, business });
      else                    await generatePresupuestoPDF({ formData: data, business });
      navigate(-1);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Error al generar el PDF. Ver consola.");
    }
  };

  const flash = (msg) => { setToastMsg(msg); setShowToast(true); setTimeout(() => setShowToast(false), 3000); };

  const handleSubmit = async () => {
    if (!validate()) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    setSaving(true);
    try {
      const doc      = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
      const enriched = { ...doc, documentType };
      if (documentType === "factura") await upsertFactura(enriched);
      else                            await upsertPresupuesto(enriched);
      flash("Guardado. Generando PDF...");
      await runPDF(enriched);
    } finally { setSaving(false); }
  };

  const handleIssueAsFactura = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const doc    = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
      const issued = { ...doc, documentType: "factura", facturada: true };
      await upsertFactura(issued);
      await removeBorrador(issued.id);
      flash("Factura emitida. Generando PDF...");
      await runPDF(issued, "factura");
    } finally { setSaving(false); }
  };

  const handleDraft = async () => {
    if (!formData.items?.length) { alert("Añade al menos una partida para guardar borrador."); return; }
    const draft = { ...(formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() }), facturada: false };
    await upsertBorrador(draft);
    flash("Borrador guardado");
  };

  /* ─── Totals ─────────────────────────────────────────────────────────── */
  const totalBase  = formData.items.reduce((s, x) => s + Number(x.quantity) * Number(x.price), 0);
  const totalIva   = formData.items.reduce((s, x) => s + Number(x.ivaAmount ?? Number(x.quantity) * Number(x.price) * (Number(x.iva) / 100)), 0);
  const totalFinal = totalBase + totalIva;

  /* ─── Theme ──────────────────────────────────────────────────────────── */
  const isFactura = documentType === "factura";
  const T = isFactura ? {
    grad:    "from-emerald-600 to-teal-700",
    bg:      "bg-emerald-600",
    hover:   "hover:bg-emerald-700",
    text:    "text-emerald-600",
    textDk:  "text-emerald-700",
    light:   "bg-emerald-50",
    border:  "border-emerald-200",
    iconBg:  "bg-emerald-100 text-emerald-700",
    badge:   "bg-emerald-500/20 text-emerald-100",
    ring:    "focus:ring-emerald-500/10 focus:border-emerald-500",
    tblHdr:  "bg-emerald-600",
    tblAlt:  "bg-emerald-50/40",
  } : {
    grad:    "from-blue-600 to-indigo-700",
    bg:      "bg-blue-600",
    hover:   "hover:bg-blue-700",
    text:    "text-blue-600",
    textDk:  "text-blue-700",
    light:   "bg-blue-50",
    border:  "border-blue-200",
    iconBg:  "bg-blue-100 text-blue-700",
    badge:   "bg-blue-500/20 text-blue-100",
    ring:    "focus:ring-blue-500/10 focus:border-blue-500",
    tblHdr:  "bg-blue-600",
    tblAlt:  "bg-blue-50/40",
  };

  /* ─── Client initials ────────────────────────────────────────────────── */
  const initials = formData.clienteNombre
    ? formData.clienteNombre.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")
    : "?";

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50/70">

      {/* ══════════════ HERO HEADER ══════════════ */}
      <div className={`bg-gradient-to-br ${T.grad} relative overflow-hidden`}>
        {/* subtle pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative px-5 pt-5 pb-6 md:px-8 md:pt-7 md:pb-8 max-w-5xl mx-auto">
          {/* top row */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium rounded-xl transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Volver
            </button>
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${T.badge} tracking-wide`}>
              {editingId ? "✏ Editando" : "✦ Nuevo"}
            </div>
          </div>

          {/* document identity */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
              {isFactura ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
                  <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">
                {isFactura ? "Factura" : "Presupuesto"} de obra
              </p>
              <h1 className="text-white text-2xl md:text-3xl font-black tracking-tight leading-none">
                {formData.numero || <span className="opacity-40 italic font-light">Sin número</span>}
              </h1>
              {formData.clienteNombre && (
                <p className="text-white/70 text-sm mt-1.5 font-medium truncate">
                  Para: {formData.clienteNombre}
                </p>
              )}
            </div>
            {formData.items.length > 0 && (
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">Total</p>
                <p className="text-white text-2xl font-black tabular-nums">{eur(totalFinal)} €</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ FORM BODY ══════════════ */}
      <div className="px-4 py-5 md:px-6 md:py-7 max-w-5xl mx-auto space-y-4 pb-36">

        {/* ── Row 1: Documento + Cliente ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Documento */}
          <Section label="Identificación" title="Datos del documento" iconBg={T.iconBg}
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            }>
            <div className="space-y-5">
              <Field label="Número" required error={errors.numero} hint="Escribe un número (ej: 5) y se formatea automáticamente">
                <input type="text" id="numero" value={formData.numero} onChange={handleChange}
                  onBlur={handleNumberBlur} placeholder="Ej: 5 → 2025_0005"
                  className={inp(errors.numero)} />
              </Field>
              <Field label="Fecha de emisión" required error={errors.fecha}>
                <DatePicker
                  selected={formData.fecha instanceof Date ? formData.fecha : formData.fecha ? new Date(formData.fecha) : null}
                  onChange={(d) => setFormData((p) => ({ ...p, fecha: d }))}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Selecciona la fecha"
                  className={inp(errors.fecha)}
                  wrapperClassName="w-full"
                />
              </Field>
              <Field label="IVA global (%)" error={errors.iva} hint="IVA por defecto para todos los conceptos">
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 21].map((v) => (
                    <button key={v} type="button"
                      onClick={() => setFormData((p) => ({ ...p, iva: v }))}
                      className={`py-3.5 text-sm font-bold rounded-xl border-2 transition-all
                        ${Number(formData.iva) === v
                          ? `${T.bg} border-transparent text-white shadow-sm`
                          : "border-gray-200 text-gray-500 hover:border-gray-300 bg-gray-50"}`}>
                      {v}%
                    </button>
                  ))}
                  <input type="number" id="iva" value={formData.iva} min="0" max="100" onChange={handleChange}
                    className={`${inp(errors.iva)} text-center`} placeholder="%" />
                </div>
              </Field>
            </div>
          </Section>

          {/* Cliente */}
          <Section label="Destinatario" title="Datos del cliente" iconBg="bg-violet-100 text-violet-700"
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            }>
            <div className="space-y-5">
              {/* Avatar + nombre */}
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-violet-100 flex items-center justify-center shrink-0 text-violet-700 font-bold text-sm">
                  {initials}
                </div>
                <div className="flex-1 space-y-3">
                  <Field label="Nombre / Razón social" required error={errors.clienteNombre}>
                    <input type="text" id="clienteNombre" value={formData.clienteNombre} onChange={handleChange}
                      className={inp(errors.clienteNombre)} placeholder="Empresa o nombre" />
                  </Field>
                  <Field label="CIF / NIF" required error={errors.clienteCIF}>
                    <input type="text" id="clienteCIF" value={formData.clienteCIF} onChange={handleChange}
                      className={inp(errors.clienteCIF)} placeholder="B12345678" />
                  </Field>
                </div>
              </div>

              <div className="border-t border-gray-50 pt-4 space-y-4">
                <Field label="Dirección" required error={errors.clienteDireccion}>
                  <input type="text" id="clienteDireccion" value={formData.clienteDireccion} onChange={handleChange}
                    className={inp(errors.clienteDireccion)} placeholder="Calle, número, piso..." />
                </Field>
                <div className="grid grid-cols-5 gap-2">
                  <div className="col-span-2">
                    <Field label="C.P." required error={errors.clienteCP}>
                      <input type="text" id="clienteCP" value={formData.clienteCP} onChange={handleChange}
                        className={inp(errors.clienteCP)} maxLength={5} placeholder="28001" />
                    </Field>
                  </div>
                  <div className="col-span-3">
                    <Field label="Localidad" required error={errors.clienteLocalidad}>
                      <input type="text" id="clienteLocalidad" value={formData.clienteLocalidad} onChange={handleChange}
                        className={inp(errors.clienteLocalidad)} placeholder="Madrid" />
                    </Field>
                  </div>
                </div>
                <Field label="Provincia" required error={errors.clienteProvincia}>
                  <input type="text" id="clienteProvincia" value={formData.clienteProvincia} onChange={handleChange}
                    className={inp(errors.clienteProvincia)} placeholder="Madrid" />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* ── Notas del trabajo ── */}
        <Section label="Descripción" title="Notas del trabajo" iconBg="bg-amber-100 text-amber-700"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
          }>
          <Field label="" error={errors.comentarios}>
            <textarea id="comentarios" value={formData.comentarios} onChange={handleChange}
              placeholder="Describe el trabajo a realizar, condiciones, plazos, notas importantes para el cliente..."
              rows={4} className={`${inp(errors.comentarios)} resize-none leading-relaxed`} />
          </Field>
        </Section>

        {/* ══════════════ PARTIDAS ══════════════ */}
        <Section label="Partidas" title="Conceptos y servicios" noPadding iconBg={T.iconBg}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
            </svg>
          }
          action={
            <button type="button" onClick={openAddItem}
              className={`flex items-center gap-2 px-4 py-2.5 ${T.bg} ${T.hover} text-white text-sm font-bold rounded-xl transition-colors shadow-sm`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Añadir
            </button>
          }>

          {errors.items && (
            <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-red-600 font-semibold bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errors.items}
            </div>
          )}

          {formData.items.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center gap-5 py-16 px-6">
              <div className={`w-16 h-16 ${T.light} rounded-2xl flex items-center justify-center`}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isFactura ? "#059669" : "#2563eb"} strokeWidth={1.5} strokeLinecap="round">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                  <rect x="9" y="3" width="6" height="4" rx="1"/>
                  <path d="M9 12h6M9 16h4"/>
                </svg>
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-base">Sin partidas todavía</p>
                <p className="text-gray-400 text-sm mt-1.5 max-w-xs leading-relaxed">
                  Añade los trabajos, materiales y servicios que forman parte de este documento
                </p>
              </div>
              <button type="button" onClick={openAddItem}
                className={`flex items-center gap-2 px-6 py-3.5 ${T.bg} ${T.hover} text-white font-bold rounded-xl transition-colors shadow-sm`}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Añadir primera partida
              </button>
            </div>
          ) : (
            <>
              {/* ── MOBILE CARDS ── */}
              <div className="md:hidden divide-y divide-gray-100">
                {formData.items.map((s, i) => {
                  const base   = Number(s.quantity) * Number(s.price);
                  const ivaAmt = base * (Number(s.iva) / 100);
                  return (
                    <div key={i} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-7 h-7 ${T.light} ${T.text} rounded-lg flex items-center justify-center shrink-0 text-xs font-black`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{s.description}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {s.quantity} {s.unit === "Unidades" ? "Unid." : s.unit}
                            {" · "}{eur(s.price)} €/unidad
                            {" · "}IVA {Number(s.iva).toFixed(0)}%
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-gray-400">Base: {eur(base)} €</span>
                            <span className="text-xs text-gray-400">IVA: {eur(ivaAmt)} €</span>
                          </div>
                        </div>
                        <p className={`shrink-0 font-black text-base tabular-nums ${T.textDk}`}>
                          {eur(base + ivaAmt)} €
                        </p>
                      </div>
                      <div className="flex gap-2 pl-10">
                        <button type="button" onClick={() => openEditItem(i)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                          Editar
                        </button>
                        <button type="button" onClick={() => removeItem(i)}
                          className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
                {/* mobile totals row */}
                <div className={`px-5 py-4 ${T.light}`}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Base imponible</span><span className="tabular-nums font-semibold">{eur(totalBase)} €</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>IVA</span><span className="tabular-nums font-semibold">{eur(totalIva)} €</span>
                  </div>
                  <div className={`flex justify-between font-black text-base ${T.textDk} border-t ${T.border} pt-3`}>
                    <span>Total</span><span className="tabular-nums">{eur(totalFinal)} €</span>
                  </div>
                </div>
              </div>

              {/* ── DESKTOP TABLE ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className={`${T.tblHdr}`}>
                      {[
                        { label: "#",         align: "text-center", w: "w-10" },
                        { label: "Descripción del trabajo", align: "text-left", w: "" },
                        { label: "Cant.",     align: "text-center", w: "w-16" },
                        { label: "Und.",      align: "text-center", w: "w-16" },
                        { label: "P. Unit",   align: "text-right",  w: "w-24" },
                        { label: "IVA %",     align: "text-center", w: "w-16" },
                        { label: "IVA €",     align: "text-right",  w: "w-24" },
                        { label: "Total €",   align: "text-right",  w: "w-28" },
                        { label: "",          align: "text-right",  w: "w-20" },
                      ].map((h, i) => (
                        <th key={i} className={`px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-white/80 ${h.align} ${h.w}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.items.map((s, i) => {
                      const base   = Number(s.quantity) * Number(s.price);
                      const ivaAmt = base * (Number(s.iva) / 100);
                      return (
                        <tr key={i} className={`group transition-colors hover:bg-gray-50/80 ${i % 2 === 0 ? "" : T.tblAlt}`}>
                          <td className={`px-4 py-4 text-center text-xs font-black ${T.text}`}>{i + 1}</td>
                          <td className="px-4 py-4 text-gray-800 max-w-xs">
                            <p className="text-sm font-semibold leading-snug">{s.description}</p>
                          </td>
                          <td className="px-4 py-4 text-center tabular-nums text-sm font-semibold text-gray-700">{s.quantity}</td>
                          <td className="px-4 py-4 text-center text-xs font-medium text-gray-400">{s.unit === "Unidades" ? "Unid." : s.unit}</td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm font-semibold text-gray-700">{eur(s.price)}</td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-gray-500">{Number(s.iva).toFixed(0)}%</td>
                          <td className="px-4 py-4 text-right tabular-nums text-sm text-gray-400">{eur(ivaAmt)}</td>
                          <td className={`px-4 py-4 text-right tabular-nums text-sm font-black ${T.textDk}`}>{eur(base + ivaAmt)}</td>
                          <td className="px-4 py-4">
                            <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => openEditItem(i)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                              </button>
                              <button type="button" onClick={() => removeItem(i)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                                  <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={6} className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Subtotales</td>
                      <td className="px-4 py-4 text-right tabular-nums text-sm font-bold text-gray-600">{eur(totalIva)}</td>
                      <td className={`px-4 py-4 text-right tabular-nums text-base font-black ${T.textDk}`}>{eur(totalFinal)} €</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </Section>

        {/* ══════════════ RESUMEN FINANCIERO ══════════════ */}
        {formData.items.length > 0 && (
          <div className="flex justify-end">
            <div className="w-full sm:w-80 bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 pt-6 pb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-5">Resumen económico</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-medium">Base imponible</span>
                    <span className="text-sm font-bold text-gray-200 tabular-nums">{eur(totalBase)} €</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400 font-medium">IVA</span>
                    <span className="text-sm font-bold text-gray-200 tabular-nums">{eur(totalIva)} €</span>
                  </div>
                </div>
              </div>
              <div className={`px-6 py-5 bg-gradient-to-r ${T.grad}`}>
                <div className="flex justify-between items-center">
                  <span className="text-white/80 font-bold text-sm uppercase tracking-wider">Total</span>
                  <span className="text-white font-black text-2xl tabular-nums">{eur(totalFinal)} €</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════ STICKY ACTION BAR ══════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-3">

          {/* Left: secondary actions */}
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleDraft}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-colors border border-amber-200">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Borrador
            </button>
          </div>

          {/* Right: primary actions */}
          <div className="flex items-center gap-2">
            {/* Emitir Factura — only show on presupuesto */}
            {!isFactura && (
              <button type="button" onClick={handleIssueAsFactura} disabled={saving}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="hidden sm:inline">Emitir Factura</span>
                <span className="sm:hidden">Factura</span>
              </button>
            )}

            {/* Generate + PDF */}
            <button type="button" onClick={handleSubmit} disabled={saving}
              className={`flex items-center gap-2 px-5 py-2.5 ${T.bg} ${T.hover} disabled:opacity-60 text-white text-sm font-black rounded-xl transition-colors shadow-md`}>
              {saving ? (
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.2}/>
                  <path d="M12 2a10 10 0 0110 10"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              )}
              {saving ? "Generando..." : `${isFactura ? "Factura" : "Presupuesto"} + PDF`}
            </button>
          </div>
        </div>

        {/* Mobile draft button */}
        <div className="sm:hidden px-4 pb-3 flex gap-2">
          <button type="button" onClick={handleDraft}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
            </svg>
            Guardar borrador
          </button>
        </div>
      </div>

      {/* ── Modals & Toast ── */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        form={itemForm}
        onChange={handleItemChange}
        isEditing={editingItemIndex !== null}
        accentBg={T.bg}
        accentHover={T.hover}
      />
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default DocumentGenerator;
