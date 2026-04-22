import React, { useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSearchParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { BusinessContext } from "../context/BusinessContext.jsx";
import { useData } from "../context/DataContext.jsx";

/* ─── Field wrapper ──────────────────────────────────────────────────────── */
function Field({ label, error, children, hint, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-red-600 font-semibold">{error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-4 py-3 text-sm border-2 rounded-xl bg-white placeholder-slate-400
   focus:outline-none focus:border-blue-500 transition-colors
   ${err ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-300"}`;

/* ─── Section card ───────────────────────────────────────────────────────── */
function Section({ title, children, color = "slate", icon }) {
  const leftBorder = {
    blue:    "border-l-blue-500",
    emerald: "border-l-emerald-500",
    violet:  "border-l-violet-500",
    amber:   "border-l-amber-400",
    slate:   "border-l-slate-300",
  }[color] || "border-l-slate-300";

  const iconBg = {
    blue:    "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
    violet:  "bg-violet-100 text-violet-600",
    amber:   "bg-amber-100 text-amber-600",
    slate:   "bg-slate-100 text-slate-500",
  }[color] || "bg-slate-100 text-slate-500";

  return (
    <div className={`bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden border-l-4 ${leftBorder}`}>
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
        {icon && (
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ─── Item modal ─────────────────────────────────────────────────────────── */
function ItemModal({ isOpen, onClose, onSave, form, onChange, isEditing }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto">
        {/* Handle bar (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base">
            {isEditing ? "Editar servicio" : "Nuevo servicio"}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Descripción del trabajo" required>
            <textarea
              id="description"
              value={form.description}
              onChange={onChange}
              rows={3}
              placeholder="Ej: Pintura de fachada exterior, 50m²..."
              className={`${inputCls(false)} resize-none`}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Cantidad" required>
              <input type="number" id="quantity" value={form.quantity} onChange={onChange}
                className={inputCls(false)} placeholder="1" min="0" step="any" />
            </Field>
            <Field label="Precio por unidad (€)" required>
              <input type="number" id="price" value={form.price} onChange={onChange}
                className={inputCls(false)} placeholder="0.00" min="0" step="any" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="IVA (%)">
              <input type="number" id="iva" value={form.iva} onChange={onChange}
                className={inputCls(false)} min="0" max="100" />
            </Field>
            <Field label="Unidad">
              <div className="flex gap-1.5 mt-0.5 flex-wrap">
                {["m²", "Unidades", "ml", "h"].map((u) => (
                  <label key={u}
                    className={`cursor-pointer px-3 py-2.5 text-xs font-semibold border-2 rounded-xl flex-1 text-center transition-all ${
                      form.unit === u
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                    }`}>
                    <input type="radio" name="unit" value={u} checked={form.unit === u}
                      onChange={(e) => onChange({ target: { id: "unit", value: e.target.value } })}
                      className="hidden" />
                    {u}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Live preview */}
          {form.quantity && form.price && (
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen</p>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Base</span>
                <span className="font-semibold tabular-nums">{(Number(form.quantity) * Number(form.price)).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>IVA ({form.iva}%)</span>
                <span className="font-semibold tabular-nums">{(Number(form.quantity) * Number(form.price) * (Number(form.iva) / 100)).toFixed(2)} €</span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-2 font-bold text-slate-900 text-base">
                <span>Total</span>
                <span className="tabular-nums">{(Number(form.quantity) * Number(form.price) * (1 + Number(form.iva) / 100)).toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-5 py-3 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={onSave}
            className="px-6 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md shadow-blue-600/30">
            {isEditing ? "Guardar cambios" : "Añadir servicio"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ show, message, onClose }) {
  if (!show) return null;
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold z-50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      {message}
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
function DocumentGenerator({ documentType: initialType = "presupuesto" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get("edit");
  const issueNow  = searchParams.get("issue") === "1";
  const autoPDF   = searchParams.get("autopdf") === "1";

  const { business } = useContext(BusinessContext);
  const {
    upsertFactura, removeFactura,
    upsertPresupuesto,
    upsertBorrador, removeBorrador,
    findDocById,
  } = useData();
  const [documentType, setDocumentType] = useState(initialType);
  const [formData, setFormData] = useState({
    id: "", numero: "", fecha: "", clienteNombre: "", clienteCIF: "",
    clienteDireccion: "", clienteCP: "", clienteLocalidad: "", clienteProvincia: "",
    iva: 21, comentarios: "", items: [], facturada: false,
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({ description: "", quantity: "", price: "", unit: "m²", iva: 21 });
  const [loaded, setLoaded] = useState(false);

  /* ─── Load on edit ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (!editingId) { setLoaded(true); return; }
    const inMem = findDocById(editingId);
    if (inMem) {
      setFormData(inMem);
      if (inMem.documentType) setDocumentType(inMem.documentType);
      setLoaded(true);
    } else {
      Promise.all([
        import("../services/db.js").then(m => m.facturasSvc.getById(editingId)),
        import("../services/db.js").then(m => m.presupuestosSvc.getById(editingId)),
        import("../services/db.js").then(m => m.borradoresSvc.getById(editingId)),
      ]).then(([f, p, b]) => {
        const found = f || p || b;
        if (found) {
          setFormData(found);
          if (found.documentType) setDocumentType(found.documentType);
        }
        setLoaded(true);
      });
    }
  }, [editingId]); // eslint-disable-line

  useEffect(() => {
    if (!loaded) return;
    if (issueNow && formData.id) {
      const issued = { ...formData, documentType: "factura", facturada: true };
      upsertFactura(issued);
      upsertBorrador({ ...formData, facturada: true });
      setFormData(issued);
    }
  }, [issueNow, formData.id, loaded]); // eslint-disable-line

  useEffect(() => {
    if (!loaded) return;
    if (autoPDF) {
      (async () => {
        if (!validate()) return;
        await generatePDF();
      })();
    }
  }, [autoPDF, loaded]);

  /* ─── Handlers ───────────────────────────────────────────────────────── */
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleInvoiceNumberBlur = () => {
    let numberPart = String(formData.numero || "").trim();
    if (!numberPart) return;
    numberPart = numberPart.split(/[/_]/).pop();
    const padded = String(parseInt(numberPart, 10)).replace(/NaN/, "").padStart(4, "0");
    const year = formData.fecha instanceof Date ? formData.fecha.getFullYear() : new Date().getFullYear();
    setFormData({ ...formData, numero: `${year}_${padded}` });
  };

  const openAddItemModal = () => {
    setEditingItemIndex(null);
    setItemForm({ description: "", quantity: "", price: "", unit: "m²", iva: formData.iva });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (index) => {
    const item = formData.items[index];
    setEditingItemIndex(index);
    setItemForm({ description: item.description, quantity: item.quantity, price: item.price, unit: item.unit, iva: item.iva || formData.iva });
    setIsItemModalOpen(true);
  };

  const handleItemFormChange = (e) => {
    const { id, value } = e.target;
    setItemForm({ ...itemForm, [id]: value });
  };

  const handleSaveItem = () => {
    if (!itemForm.description.trim() || isNaN(itemForm.quantity) || isNaN(itemForm.price)) {
      alert("Completa descripción, cantidad y precio.");
      return;
    }
    const quantity = parseFloat(itemForm.quantity);
    const price = parseFloat(itemForm.price);
    const serviceIva = parseFloat(itemForm.iva) || formData.iva;
    const subtotal = quantity * price;
    const ivaAmount = subtotal * (serviceIva / 100);
    const newItem = {
      description: itemForm.description, quantity, price,
      unit: itemForm.unit, iva: serviceIva,
      total: subtotal, ivaAmount, totalWithIVA: subtotal + ivaAmount,
    };
    const newItems = [...formData.items];
    if (editingItemIndex !== null) newItems[editingItemIndex] = newItem;
    else newItems.push(newItem);
    setFormData({ ...formData, items: newItems });
    setIsItemModalOpen(false);
  };

  /* ─── Validation ─────────────────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    const num = String(formData.numero || "").trim();
    if (!num) e.numero = "Número obligatorio";
    else if (!/^\d{4}\s*[_/]\s*\d{1,4}$/.test(num)) e.numero = "Formato: AAAA_0001";
    if (!formData.fecha) e.fecha = "Fecha obligatoria";
    if (!formData.clienteNombre?.trim()) e.clienteNombre = "Nombre del cliente obligatorio";
    if (!formData.clienteCIF?.trim()) e.clienteCIF = "CIF/NIF obligatorio";
    else if (!/^(?:[0-9]{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/.test(formData.clienteCIF.trim()))
      e.clienteCIF = "Formato de CIF/NIF no válido";
    if (!formData.clienteDireccion?.trim()) e.clienteDireccion = "Dirección obligatoria";
    if (!formData.clienteCP?.trim()) e.clienteCP = "Código postal obligatorio";
    else if (!/^\d{5}$/.test(formData.clienteCP.trim())) e.clienteCP = "5 dígitos";
    if (!formData.clienteLocalidad?.trim()) e.clienteLocalidad = "Localidad obligatoria";
    if (!formData.clienteProvincia?.trim()) e.clienteProvincia = "Provincia obligatoria";
    if (isNaN(formData.iva) || formData.iva < 0 || formData.iva > 100) e.iva = "IVA 0–100";
    if (!Array.isArray(formData.items) || formData.items.length === 0) e.items = "Añade al menos un servicio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── DB helpers ─────────────────────────────────────────────────────── */
  function _upsertLS(key, doc) {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = arr.findIndex((d) => d.id === doc.id);
    if (idx >= 0) arr[idx] = doc; else arr.push(doc);
    localStorage.setItem(key, JSON.stringify(arr));
  }

  /* ─── PDF Generation ─────────────────────────────────────────────────── */
  const generatePDF = async () => {
    async function savePDFFile(doc, filename) {
      const soportaPicker = typeof window.showSaveFilePicker === "function";
      if (!soportaPicker) { doc.save(filename); return false; }
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(doc.output("blob"));
        await writable.close();
        return true;
      } catch (e) {
        console.warn("Guardado cancelado:", e);
        doc.save(filename);
        return false;
      }
    }

    try {
      const {
        numero, clienteNombre, clienteApellidos,
        clienteCIF, clienteDireccion, clienteCP, clienteLocalidad, clienteProvincia,
        iva: ivaPctGlobal, items: servicios, comentarios,
      } = formData;

      const {
        companyName = "Mi Empresa", nif = "", phone = "",
        street = "", postalCode = "", locality = "", community = "",
        bank = "", accountNumber = "", holder = "",
      } = business || {};

      const normalizeNumAndYear = (raw) => {
        const t = String(raw || "").trim();
        let yearPart = "", numPart = "";
        if (/^\d{4}\s*[_/]\s*\d{1,4}$/.test(t)) {
          [yearPart, numPart] = t.split(/[/_]/).map((s) => s.trim());
        } else {
          yearPart = String(new Date().getFullYear());
          numPart = String(parseInt(t, 10) || 0);
        }
        return { year4: String(parseInt(yearPart)).padStart(4, "0"), num4: String(parseInt(numPart)).padStart(4, "0") };
      };

      const { year4: nfYear, num4: nfNum } = normalizeNumAndYear(numero);
      const fileNumNormalized = `${nfYear}_${nfNum}`;
      const cliCompleto = [clienteNombre, clienteApellidos].filter(Boolean).join(" ").trim();
      const cliForFile = (cliCompleto || "Cliente").replace(/[\\/:*?"<>|]+/g, "_").replace(/\s+/g, " ");
      const mlnPrefix = documentType === "factura" ? "Factura MLN" : "Presupuesto MLN";
      const filename = `${mlnPrefix} - ${cliForFile} - ${fileNumNormalized}.pdf`;

      const totalBase  = (servicios || []).reduce((s, x) => s + (x.total ?? x.quantity * x.price), 0);
      const totalIVA   = (servicios || []).reduce((s, x) => s + (x.ivaAmount ?? x.quantity * x.price * ((x.iva ?? ivaPctGlobal) / 100)), 0);
      const totalFinal = totalBase + totalIVA;

      let fechaStrES = "";
      if (formData.fecha instanceof Date) {
        const y = formData.fecha.getFullYear();
        const m = String(formData.fecha.getMonth() + 1).padStart(2, "0");
        const d = String(formData.fecha.getDate()).padStart(2, "0");
        fechaStrES = `${d}/${m}/${y}`;
      } else if (typeof formData.fecha === "string" && formData.fecha) {
        const parts = formData.fecha.replace(/\./g, "-").replace(/\//g, "-").split("-");
        fechaStrES = parts.length === 3 ? `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}` : formData.fecha;
      } else {
        const now = new Date();
        fechaStrES = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      }

      let pngDataUrl = null;
      try {
        const resp = await fetch("/logo.svg");
        if (resp.ok) {
          const svgText = await resp.text();
          const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
          const img = new Image();
          img.src = "data:image/svg+xml;base64," + svgBase64;
          await (img.decode ? img.decode() : new Promise((res) => (img.onload = res)));
          const canvas = document.createElement("canvas");
          canvas.width = 300; canvas.height = 300;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, 300, 300);
          pngDataUrl = canvas.toDataURL("image/png");
        }
      } catch {}

      let signaturePng = null;
      async function loadSvgAsPng(svgPath, size = 600) {
        const resp = await fetch(svgPath);
        if (!resp.ok) return null;
        const svgText = await resp.text();
        const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
        const img = new Image();
        img.src = "data:image/svg+xml;base64," + svgBase64;
        await (img.decode ? img.decode() : new Promise((res) => (img.onload = res)));
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        canvas.getContext("2d").drawImage(img, 0, 0, size, size);
        return canvas.toDataURL("image/png");
      }
      try { signaturePng = await loadSvgAsPng("/firma.svg", 800); } catch {}
      if (!signaturePng) {
        for (const ext of ["/firma.png", "/firma.jpg"]) {
          try {
            const r = await fetch(ext);
            if (r.ok) {
              const blob = await r.blob();
              signaturePng = await new Promise((res) => {
                const fr = new FileReader();
                fr.onload = () => res(fr.result);
                fr.readAsDataURL(blob);
              });
              break;
            }
          } catch {}
        }
      }

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const title = documentType === "factura" ? "Factura" : "Presupuesto";
      const MARGINS = { top: 20, right: 20, bottom: 20, left: 20 };
      const HEADER_H = 38;
      const FOOTER_H = 12;

      const box = (pdf) => {
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const contentW = pageW - MARGINS.left - MARGINS.right;
        return { pageW, pageH, contentW, safeTop: MARGINS.top + HEADER_H, safeBottom: pageH - MARGINS.bottom - FOOTER_H };
      };

      let cursorY = null;
      const resetCursor = (pdf) => { cursorY = box(pdf).safeTop; };
      const ensureSpace = (pdf, needed) => {
        if (cursorY + needed > box(pdf).safeBottom) {
          pdf.addPage(); drawHeaderFooter(pdf); cursorY = box(pdf).safeTop;
        }
      };
      const writeParagraph = (pdf, text, { fontSize = 10, line = 5, align = "left" } = {}) => {
        const { contentW } = box(pdf);
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, contentW);
        const needed = lines.length * line;
        ensureSpace(pdf, needed);
        pdf.text(lines, MARGINS.left, cursorY, { maxWidth: contentW, align });
        cursorY += needed + 3;
      };

      function drawHeaderFooter(pdf) {
        const { pageW, pageH } = box(pdf);
        const badgePadX = 6; const gapY = 1;
        const smallDate = fechaStrES ? `Fecha: ${fechaStrES}` : "";
        const { year4, num4 } = normalizeNumAndYear(formData.numero);
        const mainLine = `${title}: ${num4} / ${year4}`;

        pdf.setFont(undefined, "normal").setFontSize(8);
        const wDate = smallDate ? doc.getTextWidth(smallDate) : 0;
        pdf.setFont(undefined, "bold").setFontSize(12);
        const wMain = doc.getTextWidth(mainLine);
        const badgeW = Math.max(wDate, wMain) + badgePadX * 2;
        const badgeH = (smallDate ? 8 : 0) + gapY + 12 + 4;
        const badgeY = MARGINS.top + 4;

        doc.setFillColor(240).setDrawColor(200);
        doc.rect(MARGINS.left, badgeY, badgeW, badgeH, "FD");

        if (smallDate) {
          doc.setFont(undefined, "normal").setFontSize(8).setTextColor(90);
          doc.text(smallDate, MARGINS.left + badgePadX, badgeY + 6);
        }
        doc.setFont(undefined, "bold").setFontSize(12).setTextColor(0);
        doc.text(mainLine, MARGINS.left + badgePadX, badgeY + (smallDate ? 6 + gapY : 0) + 10);

        doc.setDrawColor(210);
        doc.line(MARGINS.left, pageH - MARGINS.bottom - FOOTER_H, pageW - MARGINS.right, pageH - MARGINS.bottom - FOOTER_H);
        const p = doc.getCurrentPageInfo().pageNumber;
        doc.setFontSize(9).setTextColor(90).setFont(undefined, "normal");
        doc.text(`Página ${p}`, pageW - MARGINS.right, pageH - MARGINS.bottom + 3, { align: "right" });
      }

      function drawParties(pdf) {
        const { contentW } = box(pdf);
        const colW = (contentW - 10) / 2;
        const y0 = cursorY;
        ensureSpace(pdf, 40);
        pdf.setFillColor(240).rect(MARGINS.left, y0 - 6, colW, 36, "F");
        pdf.setFillColor(240).rect(MARGINS.left + colW + 10, y0 - 6, colW, 36, "F");
        pdf.setFontSize(10).setTextColor(0).setFont(undefined, "bold");
        pdf.text(companyName, MARGINS.left + 2, y0);
        pdf.setFont(undefined, "normal");
        pdf.text([`NIF/CIF: ${nif}`, `Tel: ${phone}`, `${street}, ${postalCode} ${locality} (${community})`], MARGINS.left + 2, y0 + 6, { maxWidth: colW - 6 });
        const nombreCliente = [clienteNombre, clienteApellidos].filter(Boolean).join(" ");
        pdf.setFont(undefined, "bold");
        pdf.text("Cliente:", MARGINS.left + colW + 12, y0);
        pdf.setFont(undefined, "normal");
        pdf.text([nombreCliente, clienteCIF, clienteDireccion, `${clienteCP} - ${clienteLocalidad}, ${clienteProvincia}`], MARGINS.left + colW + 12, y0 + 6, { maxWidth: colW - 6 });
        cursorY += 36 + 8;
      }

      function drawItemsTable(pdf) {
        if (comentarios?.trim()) {
          pdf.setFontSize(10).setFont(undefined, "bold");
          writeParagraph(pdf, "Comentario:");
          pdf.setFont(undefined, "normal");
          writeParagraph(pdf, comentarios, { fontSize: 10, line: 5 });
          const { pageW } = box(pdf);
          ensureSpace(pdf, 6);
          pdf.setDrawColor(220);
          pdf.line(MARGINS.left, cursorY, pageW - MARGINS.right, cursorY);
          cursorY += 4;
        }
        if (!servicios?.length) return;
        const { contentW } = box(pdf);
        const startY = cursorY;
        const fixed = { idx: 10, cant: 16, und: 16, pUnit: 22, ivaPct: 16, ivaAmt: 22, total: 26 };
        const fixedTotal = Object.values(fixed).reduce((a, b) => a + b, 0);
        const descWidth = Math.max(40, contentW - fixedTotal - 2);

        autoTable(pdf, {
          startY,
          margin: { left: MARGINS.left, right: MARGINS.right, top: MARGINS.top + HEADER_H, bottom: MARGINS.bottom + FOOTER_H },
          tableWidth: contentW,
          theme: "grid",
          head: [["#", "Descripción", "Cant.", "Und.", "P.Unit €", "IVA%", "IVA €", "Total €"]],
          body: servicios.map((s, i) => [
            String(i + 1),
            pdf.splitTextToSize(String(s.description || ""), descWidth),
            String(s.quantity),
            s.unit === "Unidades" ? "Unid." : s.unit,
            Number(s.price).toFixed(2),
            Number(s.iva ?? ivaPctGlobal).toFixed(0),
            Number(s.ivaAmount ?? s.quantity * s.price * ((s.iva ?? ivaPctGlobal) / 100)).toFixed(2),
            Number(s.totalWithIVA ?? s.quantity * s.price * (1 + (s.iva ?? ivaPctGlobal) / 100)).toFixed(2),
          ]),
          styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak", valign: "top" },
          headStyles: { fillColor: [200, 200, 200], halign: "center" },
          columnStyles: {
            0: { cellWidth: fixed.idx, halign: "center" },
            1: { cellWidth: descWidth },
            2: { cellWidth: fixed.cant, halign: "center" },
            3: { cellWidth: fixed.und, halign: "center" },
            4: { cellWidth: fixed.pUnit, halign: "right" },
            5: { cellWidth: fixed.ivaPct, halign: "center" },
            6: { cellWidth: fixed.ivaAmt, halign: "right" },
            7: { cellWidth: fixed.total, halign: "right" },
          },
          rowPageBreak: "avoid",
          pageBreak: "auto",
          didDrawPage: () => drawHeaderFooter(pdf),
        });
        cursorY = (doc.lastAutoTable?.finalY ?? startY) + 6;
      }

      function drawTotals(pdf, sig) {
        const { pageW } = box(pdf);
        ensureSpace(pdf, 40);
        pdf.setDrawColor(0).setLineWidth(0.2);
        pdf.line(MARGINS.left, cursorY, pageW - MARGINS.right, cursorY);
        cursorY += 6;

        const rightX = pageW - MARGINS.right;
        pdf.setFontSize(12);
        pdf.text(`Base: ${totalBase.toFixed(2)} €`, rightX, cursorY, { align: "right" });
        pdf.text(`IVA:  ${totalIVA.toFixed(2)} €`, rightX, cursorY + 8, { align: "right" });
        pdf.setFont(undefined, "bold");
        pdf.text(`Total: ${totalFinal.toFixed(2)} €`, rightX, cursorY + 16, { align: "right" });
        pdf.setFont(undefined, "normal");
        cursorY += 28;

        ensureSpace(pdf, 36);
        pdf.setFontSize(11).setFont(undefined, "bold").text("Datos de Pago:", MARGINS.left, cursorY);
        pdf.setFont(undefined, "normal").setFontSize(10);
        pdf.text(`Banco:  ${bank}`, MARGINS.left, cursorY + 8);
        pdf.text(`Cuenta: ${accountNumber}`, MARGINS.left, cursorY + 16);
        pdf.text(`Titular: ${holder}`, MARGINS.left, cursorY + 24);
        cursorY += 36;

        ensureSpace(pdf, 16);
        const rightBlockW = 60;
        const rightX2 = pageW - MARGINS.right;
        const rightX1 = rightX2 - rightBlockW;
        pdf.setFontSize(11);
        pdf.text("Firma Cliente:", MARGINS.left, cursorY);
        pdf.line(MARGINS.left, cursorY + 5, MARGINS.left + 60, cursorY + 5);
        pdf.text("Firma Empresa:", rightX1, cursorY, { align: "left" });
        const lineY = cursorY + 5;
        if (sig) {
          const targetW = 38, targetH = 16;
          const sigX = rightX1 + (rightBlockW - targetW) / 2;
          ensureSpace(pdf, targetH + 8);
          pdf.addImage(sig, "PNG", sigX, lineY + 1.5, targetW, targetH);
        }
        pdf.line(rightX1, lineY, rightX2, lineY);
        cursorY += 18;
      }

      drawHeaderFooter(doc);
      resetCursor(doc);
      drawParties(doc);
      drawItemsTable(doc);
      drawTotals(doc, signaturePng);

      if (pngDataUrl) {
        const { pageW, pageH } = box(doc);
        const pages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= pages; p++) {
          doc.setPage(p);
          doc.setGState(new doc.GState({ opacity: 0.08 }));
          doc.addImage(pngDataUrl, "PNG", pageW / 2 - 30, pageH / 2 - 30, 60, 60);
          doc.setGState(new doc.GState({ opacity: 1 }));
        }
      }

      await savePDFFile(doc, filename);
      navigate(-1);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Error al generar el PDF. Ver consola.");
    }
  };

  /* ─── Submit ─────────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const docWithId = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
    const enriched = { ...docWithId, documentType };
    if (documentType === "factura") await upsertFactura(enriched);
    else                            await upsertPresupuesto(enriched);
    flash("Documento guardado. Generando PDF...");
    generatePDF();
  };

  const flash = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  /* ─── Totals ─────────────────────────────────────────────────────────── */
  const totalBase  = formData.items.reduce((s, x) => s + Number(x.quantity) * Number(x.price), 0);
  const totalIva   = formData.items.reduce((s, x) => s + Number(x.ivaAmount ?? Number(x.quantity) * Number(x.price) * (Number(x.iva) / 100)), 0);
  const totalFinal = totalBase + totalIva;

  /* ─── Theme ──────────────────────────────────────────────────────────── */
  const isFactura = documentType === "factura";
  const primaryBg = isFactura ? "bg-emerald-600" : "bg-blue-600";
  const primaryHover = isFactura ? "hover:bg-emerald-700" : "hover:bg-blue-700";
  const primaryShadow = isFactura ? "shadow-emerald-600/30" : "shadow-blue-600/30";

  /* ─── Icons ──────────────────────────────────────────────────────────── */
  const DocIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
  const PersonIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
  const PinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
  const ChatIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  );
  const ToolsIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  );

  /* ─── Render ─────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 pb-8">

      {/* ── Document type header ── */}
      <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 ${isFactura ? "bg-emerald-600 shadow-emerald-600/30" : "bg-blue-600 shadow-blue-600/30"} text-white shadow-lg`}>
        <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
          {isFactura ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
              <path d="M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z"/>
              <line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="13" y2="15"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          )}
        </div>
        <div className="flex-1">
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">
            {editingId ? "Editando" : "Nuevo"}
          </p>
          <p className="text-white font-bold text-xl leading-tight">
            {isFactura ? "Factura" : "Presupuesto"}
          </p>
        </div>
      </div>

      {/* ── Main form grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Datos del Documento */}
        <Section title="Datos del Documento" color={isFactura ? "emerald" : "blue"} icon={<DocIcon />}>
          <div className="space-y-4">
            <Field label="Número del documento" required error={errors.numero}
              hint="Escribe un número (ej: 1) y se formateará automáticamente">
              <input type="text" id="numero" value={formData.numero} onChange={handleChange}
                onBlur={handleInvoiceNumberBlur}
                placeholder="Ej: 1 → 2025_0001"
                className={inputCls(errors.numero)} />
            </Field>
            <Field label="Fecha" required error={errors.fecha}>
              <DatePicker
                selected={formData.fecha instanceof Date ? formData.fecha : formData.fecha ? new Date(formData.fecha) : null}
                onChange={(date) => setFormData({ ...formData, fecha: date })}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecciona la fecha"
                className={inputCls(errors.fecha)}
                wrapperClassName="w-full"
              />
            </Field>
            <Field label="IVA global (%)" error={errors.iva} hint="Se aplica a todos los servicios por defecto">
              <input type="number" id="iva" value={formData.iva} min="0" max="100"
                onChange={handleChange} className={inputCls(errors.iva)} />
            </Field>
          </div>
        </Section>

        {/* Datos del Cliente */}
        <Section title="Datos del Cliente" color="violet" icon={<PersonIcon />}>
          <div className="space-y-4">
            <Field label="Nombre o razón social" required error={errors.clienteNombre}>
              <input type="text" id="clienteNombre" value={formData.clienteNombre}
                onChange={handleChange} className={inputCls(errors.clienteNombre)}
                placeholder="Empresa o nombre del cliente" />
            </Field>
            <Field label="CIF / NIF del cliente" required error={errors.clienteCIF}>
              <input type="text" id="clienteCIF" value={formData.clienteCIF}
                onChange={handleChange} className={inputCls(errors.clienteCIF)}
                placeholder="B12345678" />
            </Field>
          </div>
        </Section>

        {/* Dirección del Cliente */}
        <Section title="Dirección del Cliente" color="violet" icon={<PinIcon />}>
          <div className="space-y-4">
            <Field label="Dirección completa" required error={errors.clienteDireccion}>
              <input type="text" id="clienteDireccion" value={formData.clienteDireccion}
                onChange={handleChange} className={inputCls(errors.clienteDireccion)}
                placeholder="Calle, número, piso..." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código Postal" required error={errors.clienteCP}>
                <input type="text" id="clienteCP" value={formData.clienteCP}
                  onChange={handleChange} className={inputCls(errors.clienteCP)} maxLength={5}
                  placeholder="28001" />
              </Field>
              <Field label="Localidad" required error={errors.clienteLocalidad}>
                <input type="text" id="clienteLocalidad" value={formData.clienteLocalidad}
                  onChange={handleChange} className={inputCls(errors.clienteLocalidad)}
                  placeholder="Madrid" />
              </Field>
            </div>
            <Field label="Provincia" required error={errors.clienteProvincia}>
              <input type="text" id="clienteProvincia" value={formData.clienteProvincia}
                onChange={handleChange} className={inputCls(errors.clienteProvincia)}
                placeholder="Madrid" />
            </Field>
          </div>
        </Section>

        {/* Comentarios */}
        <Section title="Comentarios del trabajo" color="amber" icon={<ChatIcon />}>
          <Field label="" error={errors.comentarios}>
            <textarea id="comentarios" value={formData.comentarios} onChange={handleChange}
              placeholder="Describe el trabajo realizado, condiciones, notas importantes..."
              rows={8}
              className={`${inputCls(errors.comentarios)} resize-none`} />
          </Field>
        </Section>
      </div>

      {/* ── Servicios ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden border-l-4 border-l-slate-400">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
              <ToolsIcon />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Servicios y Artículos</h3>
              {errors.items && <p className="text-xs text-red-600 font-semibold mt-0.5">{errors.items}</p>}
            </div>
          </div>
          <button type="button" onClick={openAddItemModal}
            className={`px-4 py-2.5 ${primaryBg} ${primaryHover} text-white text-sm font-bold rounded-xl transition-colors shadow-md ${primaryShadow} flex items-center gap-2 shrink-0`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14 M5 12h14"/>
            </svg>
            Añadir
          </button>
        </div>

        {formData.items.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl ${isFactura ? "bg-emerald-50" : "bg-blue-50"} flex items-center justify-center`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isFactura ? "#059669" : "#2563EB"} strokeWidth={1.5} strokeLinecap="round">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-slate-800 font-bold text-base">Sin servicios todavía</p>
              <p className="text-slate-500 text-sm mt-1">Añade los trabajos o materiales de este documento</p>
            </div>
            <button type="button" onClick={openAddItemModal}
              className={`px-8 py-3.5 ${primaryBg} ${primaryHover} text-white text-sm font-bold rounded-2xl transition-colors shadow-lg ${primaryShadow} flex items-center gap-2`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14 M5 12h14"/>
              </svg>
              Añadir primer servicio
            </button>
          </div>
        ) : (
          <>
            {/* Mobile: item cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {formData.items.map((s, i) => {
                const base = Number(s.quantity) * Number(s.price);
                const ivaAmt = base * (Number(s.iva) / 100);
                return (
                  <div key={i} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">{s.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {s.quantity} {s.unit === "Unidades" ? "Unid." : s.unit} × {Number(s.price).toFixed(2)} € · IVA {Number(s.iva).toFixed(0)}%
                        </p>
                      </div>
                      <p className={`shrink-0 font-bold text-base tabular-nums ${isFactura ? "text-emerald-700" : "text-blue-700"}`}>
                        {(base + ivaAmt).toFixed(2)} €
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEditItemModal(i)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 active:bg-slate-200 transition-colors">
                        Editar
                      </button>
                      <button type="button" onClick={() => {
                        const copy = [...formData.items];
                        copy.splice(i, 1);
                        setFormData({ ...formData, items: copy });
                      }}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 active:bg-red-100 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className={`px-4 py-4 flex justify-between font-bold border-t-2 border-slate-200 ${isFactura ? "bg-emerald-50 text-emerald-900" : "bg-blue-50 text-blue-900"}`}>
                <span className="text-sm">Total del documento</span>
                <span className="tabular-nums text-base">{totalFinal.toFixed(2)} €</span>
              </div>
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">Cant.</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">Und.</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">P.Unit</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide">IVA%</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">IVA €</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide">Total €</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.items.map((s, i) => {
                    const base = Number(s.quantity) * Number(s.price);
                    const ivaAmt = base * (Number(s.iva) / 100);
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-400 text-xs font-semibold">{i + 1}</td>
                        <td className="px-4 py-3 text-slate-800 max-w-xs">
                          <p className="truncate font-medium">{s.description}</p>
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums text-slate-700">{s.quantity}</td>
                        <td className="px-4 py-3 text-center text-slate-500 text-xs">{s.unit === "Unidades" ? "Unid." : s.unit}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">{Number(s.price).toFixed(2)} €</td>
                        <td className="px-4 py-3 text-center text-slate-500">{Number(s.iva).toFixed(0)}%</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{ivaAmt.toFixed(2)} €</td>
                        <td className={`px-4 py-3 text-right tabular-nums font-bold ${isFactura ? "text-emerald-700" : "text-blue-700"}`}>{(base + ivaAmt).toFixed(2)} €</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button type="button" onClick={() => openEditItemModal(i)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button type="button" onClick={() => {
                              const copy = [...formData.items];
                              copy.splice(i, 1);
                              setFormData({ ...formData, items: copy });
                            }}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
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
                  <tr className={`border-t-2 border-slate-200 ${isFactura ? "bg-emerald-50" : "bg-blue-50"}`}>
                    <td colSpan={6} className="px-4 py-3 text-xs font-bold text-slate-500 uppercase">Totales</td>
                    <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-600">{totalIva.toFixed(2)} €</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold text-base ${isFactura ? "text-emerald-700" : "text-blue-700"}`}>{totalFinal.toFixed(2)} €</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Totals card ── */}
      {formData.items.length > 0 && (
        <div className="flex justify-end">
          <div className={`${primaryBg} rounded-2xl p-5 w-full sm:w-auto sm:min-w-[280px] text-white shadow-xl ${primaryShadow}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-3">Resumen</p>
            <div className="flex justify-between text-sm text-white/80 mb-2">
              <span>Base imponible</span>
              <span className="tabular-nums font-semibold">{totalBase.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm text-white/80 mb-4">
              <span>IVA</span>
              <span className="tabular-nums font-semibold">{totalIva.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between font-bold text-xl border-t border-white/20 pt-3">
              <span>Total</span>
              <span className="tabular-nums">{totalFinal.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Action bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: secondary actions */}
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-3 text-sm font-semibold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl transition-colors">
              Volver
            </button>
            <button type="button" onClick={async () => {
              if (!formData.items?.length) {
                alert("Añade al menos un servicio para guardar el borrador.");
                return;
              }
              const draft = { ...(formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() }), facturada: false };
              await upsertBorrador(draft);
              flash("Borrador guardado");
            }}
              className="px-4 py-3 text-sm font-semibold bg-amber-100 hover:bg-amber-200 active:bg-amber-300 text-amber-800 rounded-xl transition-colors flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Borrador
            </button>
          </div>

          {/* Right: primary actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <button type="button"
              onClick={async () => {
                if (!validate()) return;
                const docWithId = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
                const issued = { ...docWithId, documentType, facturada: true };
                await upsertFactura(issued);
                await removeBorrador(issued.id);
                flash("Factura emitida. Generando PDF...");
                await generatePDF();
              }}
              className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-colors shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Emitir Factura
            </button>
            <button type="submit" onClick={handleSubmit}
              className={`w-full sm:w-auto px-6 py-3 text-sm font-bold ${primaryBg} ${primaryHover} text-white rounded-xl transition-colors shadow-lg ${primaryShadow} flex items-center justify-center gap-2`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Generar {isFactura ? "Factura" : "Presupuesto"} + PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveItem}
        form={itemForm}
        onChange={handleItemFormChange}
        isEditing={editingItemIndex !== null}
      />
      <Toast show={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
    </div>
  );
}

export default DocumentGenerator;
