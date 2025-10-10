import React, { useState, useContext, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Contexto de datos de empresa
import { BusinessContext } from "../context/BusinessContext.jsx";

function DocumentGenerator({ documentType: initialType = "presupuesto" }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editingId = searchParams.get('edit');

  const issueNow = searchParams.get('issue') === '1';   // si viene de FacturasGuardadas
  const autoPDF = searchParams.get('autopdf') === '1';  // para disparar PDF al entrar

  const { business } = useContext(BusinessContext);

  const [documentType, setDocumentType] = useState(initialType);
  const [formData, setFormData] = useState({
    id: "", // lo generamos con uuidv4 si es nuevo
    numero: "",
    fecha: "",
    clienteNombre: "",
    clienteCIF: "",
    clienteDireccion: "",
    clienteCP: "",
    clienteLocalidad: "",
    clienteProvincia: "",
    iva: 21,
    comentarios: "",
    items: [],
    facturada: false,
  });

  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    description: "",
    quantity: "",
    price: "",
    unit: "m²",
    iva: 21,
  });

  const [loaded, setLoaded] = useState(false);

useEffect(() => {
  if (editingId) {
    const facturas = JSON.parse(localStorage.getItem('facturas') || '[]');
    const presupuestos = JSON.parse(localStorage.getItem('presupuestos') || '[]');
    const saved = JSON.parse(localStorage.getItem('savedInvoices') || '[]');
    const found = [...facturas, ...presupuestos, ...saved].find(d => d.id === editingId);
    if (found) {
      setFormData(found);
      if (found.documentType) setDocumentType(found.documentType);
    }
  }
  setLoaded(true);
}, [editingId]);

useEffect(() => {
  if (!loaded) return;
  if (issueNow && formData.id) {
    const issued = { ...formData, documentType: "factura", facturada: true };

    // Guarda/actualiza en "facturas"
    const facturas = JSON.parse(localStorage.getItem("facturas") || "[]");
    const fx = facturas.findIndex(d => d.id === issued.id);
    if (fx >= 0) facturas[fx] = issued; else facturas.push(issued);
    localStorage.setItem("facturas", JSON.stringify(facturas));

    // 👇 NO tocar "savedInvoices": mantenemos el borrador visible en la lista
    // (Si quieres marcar el borrador como "ya facturado", puedes actualizar ese objeto también)
    try {
      const drafts = JSON.parse(localStorage.getItem("savedInvoices") || "[]");
      const ix = drafts.findIndex(d => d.id === issued.id);
      if (ix >= 0) {
        drafts[ix] = { ...drafts[ix], facturada: true, documentType: "presupuesto" }; 
        localStorage.setItem("savedInvoices", JSON.stringify(drafts));
      }
    } catch {}

    setFormData(issued);
    // Si fijaste el tipo por prop, puedes omitir esta línea:
    // setDocumentType("factura");
  }
}, [issueNow, formData.id, loaded]);

useEffect(() => {
  if (!loaded) return;
  if (autoPDF) {
    (async () => {
      if (!validate()) return;
      await generatePDF();
    })();
  }
}, [autoPDF, loaded]);


  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleDocumentTypeChange = (value) => {
    setDocumentType(value);
  };

  // >>> Número autoformateado AAAA_NNNN (si escribes "9" -> 2025_0009)
  const handleInvoiceNumberBlur = () => {
    let numberPart = String(formData.numero || "").trim();
    if (!numberPart) return; // no sobrescribir si está vacío

    // Si el usuario puso separador, nos quedamos con la parte numérica final
    numberPart = numberPart.split(/[/_]/).pop();

    const padded = String(parseInt(numberPart, 10))
      .replace(/NaN/, "")
      .padStart(4, "0");

    const year = (formData.fecha instanceof Date
      ? formData.fecha.getFullYear()
      : new Date().getFullYear());

    // Formato: AAAA_NNNN (ej. 2025_0009)
    setFormData({ ...formData, numero: `${year}_${padded}` });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, fecha: date });
  };

  const openAddItemModal = () => {
    setEditingItemIndex(null);
    setItemForm({ description: "", quantity: "", price: "", unit: "m²", iva: formData.iva });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (index) => {
    const item = formData.items[index];
    setEditingItemIndex(index);
    setItemForm({
      description: item.description,
      quantity: item.quantity,
      price: item.price,
      unit: item.unit,
      iva: item.iva || formData.iva,
    });
    setIsItemModalOpen(true);
  };

  const handleItemFormChange = (e) => {
    const { id, value } = e.target;
    setItemForm({ ...itemForm, [id]: value });
  };

  const handleSaveItem = () => {
    if (!itemForm.description.trim() || isNaN(itemForm.quantity) || isNaN(itemForm.price)) {
      alert("Por favor, completa la descripción, cantidad y precio correctamente.");
      return;
    }
    const quantity = parseFloat(itemForm.quantity);
    const price = parseFloat(itemForm.price);
    const serviceIva = parseFloat(itemForm.iva) || formData.iva;
    const subtotal = quantity * price;
    const ivaAmount = subtotal * (serviceIva / 100);
    const total = subtotal + ivaAmount;

    const newItem = {
      description: itemForm.description,
      quantity,
      price,
      unit: itemForm.unit,
      iva: serviceIva,
      total: subtotal,
      ivaAmount,
      totalWithIVA: total,
    };

    let newItems = [...formData.items];
    if (editingItemIndex !== null) {
      newItems[editingItemIndex] = newItem;
    } else {
      newItems.push(newItem);
    }
    setFormData({ ...formData, items: newItems });
    setIsItemModalOpen(false);
  };

  // >>> VALIDACIÓN ARREGLADA (acepta AAAA_NNNN o AAAA/NNNN)
  const validate = () => {
    let newErrors = {};
    const num = String(formData.numero || '').trim();

    if (!num) {
      newErrors.numero = "El número de documento es obligatorio";
    } else if (!/^\d{4}\s*[_/]\s*\d{1,4}$/.test(num)) {
      newErrors.numero = "Formato válido: AAAA_0001 (o AAAA/0001)";
    }

    if (!formData.fecha) newErrors.fecha = "La fecha es obligatoria";
    if (!formData.clienteNombre?.trim()) newErrors.clienteNombre = "El nombre del cliente es obligatorio";

    if (!formData.clienteCIF?.trim()) {
      newErrors.clienteCIF = "El CIF/NIF es obligatorio";
    } else if (
      !/^(?:[0-9]{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/.test(
        formData.clienteCIF.trim()
      )
    ) {
      newErrors.clienteCIF = "Formato de CIF/NIF no válido";
    }

    if (!formData.clienteDireccion?.trim()) newErrors.clienteDireccion = "La dirección es obligatoria";

    if (!formData.clienteCP?.trim()) {
      newErrors.clienteCP = "El código postal es obligatorio";
    } else if (!/^\d{5}$/.test(formData.clienteCP.trim())) {
      newErrors.clienteCP = "El código postal debe tener 5 dígitos";
    }

    if (!formData.clienteLocalidad?.trim()) newErrors.clienteLocalidad = "La localidad es obligatoria";
    if (!formData.clienteProvincia?.trim()) newErrors.clienteProvincia = "La provincia es obligatoria";

    if (isNaN(formData.iva) || formData.iva < 0 || formData.iva > 100) {
      newErrors.iva = "El IVA debe estar entre 0 y 100";
    }

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      newErrors.items = "Debe agregar al menos un servicio/artículo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  function upsertLS(key, doc) {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = arr.findIndex(d => d.id === doc.id);
    if (idx >= 0) arr[idx] = doc; else arr.push(doc);
    localStorage.setItem(key, JSON.stringify(arr));
  }
  
  function removeFromLS(key, id) {
    const arr = JSON.parse(localStorage.getItem(key) || "[]");
    const next = arr.filter(d => d.id !== id);
    localStorage.setItem(key, JSON.stringify(next));
  }
  
  function computeTotals(doc) {
    const base  = (doc.items || []).reduce((s, x) => s + (x.total ?? (Number(x.quantity)*Number(x.price))), 0);
    const iva   = (doc.items || []).reduce((s, x) => s + (x.ivaAmount ?? (Number(x.quantity)*Number(x.price)*(Number(x.iva)/100))), 0);
    const total = base + iva;
    return { base, iva, total };
  }
  

  const generatePDF = async () => {
        // --- guardar PDF con "Guardar como..." (sin crear carpetas) ---
    async function savePDFFile(doc, filename) {
      const soportaPicker = typeof window.showSaveFilePicker === "function";
      if (!soportaPicker) {
        // Fallback: descarga directa
        doc.save(filename);
        return false;
      }
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: "PDF",
              accept: { "application/pdf": [".pdf"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(doc.output("blob"));
        await writable.close();
        return true;
      } catch (e) {
        console.warn("Guardado cancelado o fallido. Uso descarga directa:", e);
        doc.save(filename);
        return false;
      }
    }
  
    async function updateBalanceCSV(balanceRootHandle) {
      const facturas = (JSON.parse(localStorage.getItem("facturas") || "[]") || [])
        .filter(f => f.facturada && Array.isArray(f.items) && f.items.length);
  
      const sum = facturas.reduce((acc, f) => {
        const base  = f.items.reduce((s, x) => s + (x.total ?? (Number(x.quantity)*Number(x.price))), 0);
        const iva   = f.items.reduce((s, x) => s + (x.ivaAmount ?? (Number(x.quantity)*Number(x.price)*(Number(x.iva)/100))), 0);
        const total = base + iva;
        acc.base += base; acc.iva += iva; acc.total += total; acc.beneficio += base;
        return acc;
      }, { base: 0, iva: 0, total: 0, beneficio: 0 });
  
      const header = ["Fecha","Número","Cliente","Base","IVA","Total"];
      const rows = facturas.map(f => {
        const base  = f.items.reduce((s, x) => s + (x.total ?? (Number(x.quantity)*Number(x.price))), 0);
        const iva   = f.items.reduce((s, x) => s + (x.ivaAmount ?? (Number(x.quantity)*Number(x.price)*(Number(x.iva)/100))), 0);
        const total = base + iva;
  
        let fecha = "";
        if (f.fecha instanceof Date) {
          const y=f.fecha.getFullYear(), m=String(f.fecha.getMonth()+1).padStart(2,"0"), d=String(f.fecha.getDate()).padStart(2,"0");
          fecha = `${d}/${m}/${y}`;
        } else if (typeof f.fecha === "string") {
          fecha = f.fecha;
        }
  
        return [
          `"${fecha}"`,
          `"${f.numero || ""}"`,
          `"${(f.clienteNombre || "").replace(/"/g,'""')}"`,
          base.toFixed(2),
          iva.toFixed(2),
          total.toFixed(2),
        ].join(",");
      });
  
      rows.unshift(header.join(","));
      rows.push("");
      rows.push([ "", "", '"TOTALES"', sum.base.toFixed(2), sum.iva.toFixed(2), sum.total.toFixed(2) ].join(","));
      rows.push([ "", "", '"BENEFICIO (estim.)"', sum.beneficio.toFixed(2), "", "" ].join(","));
  
      const csv = rows.join("\n");
  
      const fileHandle = await balanceRootHandle.getFileHandle("Resumen Balance.csv", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      await writable.close();
    }
  
    try {
      // === 1) Datos y nombre de archivo (primero calculamos TODO) ===
      const {
        numero, clienteNombre, clienteApellidos,
        clienteCIF, clienteDireccion, clienteCP, clienteLocalidad, clienteProvincia,
        iva: ivaPctGlobal, items: servicios, comentarios
      } = formData;
  
      const {
        companyName = "Mi Empresa", nif = "", phone = "",
        street = "", postalCode = "", locality = "", community = "",
        bank = "", accountNumber = "", holder = ""
      } = business || {};
  
      const normalizeNumAndYear = (raw) => {
        let yearPart = ""; let numPart = "";
        const t = String(raw || "").trim();
        if (/^\d{4}\s*[_/]\s*\d{1,4}$/.test(t)) {
          [yearPart, numPart] = t.split(/[/_]/).map(s => s.trim());
        } else if (/^\d{1,4}\s*[_/]\s*\d{4}$/.test(t)) {
          const parts = t.split(/[/_]/).map(s => s.trim());
          numPart = parts[0]; yearPart = parts[1];
        } else {
          yearPart = String(new Date().getFullYear());
          numPart  = String(parseInt(t, 10) || 0);
        }
        const num4  = String(parseInt(numPart, 10)).padStart(4, "0");
        const year4 = String(parseInt(yearPart, 10)).padStart(4, "0");
        return { year4, num4 };
      };
      const { year4: nfYear, num4: nfNum } = normalizeNumAndYear(numero);
      const fileNumNormalized = `${nfYear}_${nfNum}`;
  
      const cliCompleto =
        [clienteNombre, clienteApellidos].filter(Boolean).join(" ").trim();
  
      const cliForFile = (cliCompleto || "Cliente")
        .replace(/[\\/:*?"<>|]+/g, "_")
        .replace(/\s+/g, " ");
  
      const mlnPrefix = documentType === "factura" ? "Factura MLN" : "Presupuesto MLN";
      const filename = `${mlnPrefix} - ${cliForFile} - ${fileNumNormalized}.pdf`;
  
      // Totales (para la tabla de totales del PDF)
      const totalBase  = (servicios || []).reduce((s, x) => s + (x.total ?? (x.quantity * x.price)), 0);
      const totalIVA   = (servicios || []).reduce((s, x) => s + (x.ivaAmount ?? (x.quantity * x.price * ((x.iva ?? ivaPctGlobal) / 100))), 0);
      const totalFinal = totalBase + totalIVA;
  
      // Fecha para cabecera
      let fechaStrES = "";
      if (formData.fecha instanceof Date) {
        const y = formData.fecha.getFullYear();
        const m = String(formData.fecha.getMonth() + 1).padStart(2, "0");
        const d = String(formData.fecha.getDate()).padStart(2, "0");
        fechaStrES = `${d}/${m}/${y}`;
      } else if (typeof formData.fecha === "string" && formData.fecha) {
        const parts = formData.fecha.replace(/\./g, "-").replace(/\//g, "-").split("-");
        fechaStrES = parts.length === 3 ? `${parts[2].padStart(2,"0")}/${parts[1].padStart(2,"0")}/${parts[0]}` : formData.fecha;
      } else {
        const now = new Date();
        fechaStrES = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
      }
  
      // === 2) Carga opcional de logo y firma (antes de pintar) ===
      let pngDataUrl = null;
      try {
        const resp = await fetch("/logo.svg");
        if (resp.ok) {
          const svgText = await resp.text();
          const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
          const img = new Image();
          img.src = "data:image/svg+xml;base64," + svgBase64;
          await (img.decode ? img.decode() : new Promise(res => (img.onload = res)));
          const canvas = document.createElement("canvas");
          const size = 300;
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, size, size);
          pngDataUrl = canvas.toDataURL("image/png");
        }
      } catch {}
  
      let signaturePng = null;
      async function loadSvgAsPngDataUrl(svgPath, size = 600) {
        const resp = await fetch(svgPath);
        if (!resp.ok) return null;
        const svgText = await resp.text();
        const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
        const img = new Image();
        img.src = "data:image/svg+xml;base64," + svgBase64;
        await (img.decode ? img.decode() : new Promise(res => (img.onload = res)));
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        return canvas.toDataURL("image/png");
      }
      try { signaturePng = await loadSvgAsPngDataUrl("/firma.svg", 800); } catch {}
      if (!signaturePng) {
        try {
          const r = await fetch("/firma.png");
          if (r.ok) {
            const blob = await r.blob();
            signaturePng = await new Promise(res => {
              const fr = new FileReader();
              fr.onload = () => res(fr.result);
              fr.readAsDataURL(blob);
            });
          }
        } catch {}
      }
      if (!signaturePng) {
        try {
          const r = await fetch("/firma.jpg");
          if (r.ok) {
            const blob = await r.blob();
            signaturePng = await new Promise(res => {
              const fr = new FileReader();
              fr.onload = () => res(fr.result);
              fr.readAsDataURL(blob);
            });
          }
        } catch {}
      }
  
      // === 3) Crear el PDF y dibujar (ahora SÍ existe `doc`) ===
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const title = documentType === "factura" ? "Factura" : "Presupuesto";
  
      const MARGINS  = { top: 20, right: 20, bottom: 20, left: 20 };
      const HEADER_H = 38;
      const FOOTER_H = 12;
      const box = (pdf) => {
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const contentW = pageW - MARGINS.left - MARGINS.right;
        const safeTop = MARGINS.top + HEADER_H;
        const safeBottom = pageH - MARGINS.bottom - FOOTER_H;
        return { pageW, pageH, contentW, safeTop, safeBottom };
      };
      let cursorY = null;
      const resetCursor = (pdf) => { cursorY = box(pdf).safeTop; };
      const ensureSpace = (pdf, needed) => {
        const { safeBottom } = box(pdf);
        if (cursorY + needed > safeBottom) {
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
        pdf.setFontSize(11).setTextColor(30).setFont(undefined, "bold");
        pdf.text(title.toUpperCase(), MARGINS.left, MARGINS.top + 9);
  
        const badgePadX = 6; const badgePadY = 0; const gapY = 1;
        const smallDate = fechaStrES ? `Fecha: ${fechaStrES}` : "";
        const { year4, num4 } = normalizeNumAndYear(formData.numero);
        const mainLine = `${title}: ${num4} / ${year4}`;
  
        pdf.setFont(undefined, "normal").setFontSize(8);
        const wDate = smallDate ? doc.getTextWidth(smallDate) : 0;
        pdf.setFont(undefined, "bold").setFontSize(12);
        const wMain = doc.getTextWidth(mainLine);
  
        const badgeW = Math.max(wDate, wMain) + badgePadX * 2;
        const badgeH = (smallDate ? 8 : 0) + gapY + 12 + badgePadY * 2;
        const badgeX = MARGINS.left;
        const badgeY = MARGINS.top + 4;
  
        doc.setFillColor(230); doc.setDrawColor(200);
        doc.rect(badgeX, badgeY, badgeW, badgeH, "FD");
  
        if (smallDate) {
          doc.setFont(undefined, "normal").setFontSize(8).setTextColor(90);
          doc.text(smallDate, badgeX + badgePadX, badgeY + badgePadY + 6);
        }
        doc.setFont(undefined, "bold").setFontSize(12).setTextColor(0);
        const mainY = badgeY + badgePadY + (smallDate ? 6 + gapY : 0) + 10;
        doc.text(mainLine, badgeX + badgePadX, mainY);
  
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
        pdf.text(
          [`NIF/CIF: ${nif}`, `Tel: ${phone}`, `Dir: ${street}, ${postalCode} ${locality} (${community})`],
          MARGINS.left + 2, y0 + 6, { maxWidth: colW - 6 }
        );
  
        const nombreCliente = [clienteNombre, clienteApellidos].filter(Boolean).join(" ");
        pdf.setFont(undefined, "bold");
        pdf.text("Cliente:", MARGINS.left + colW + 12, y0);
        pdf.setFont(undefined, "normal");
        pdf.text(
          [nombreCliente, clienteCIF, clienteDireccion, `${clienteCP} - ${clienteLocalidad}, ${clienteProvincia}`],
          MARGINS.left + colW + 12, y0 + 6, { maxWidth: colW - 6 }
        );
  
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
        const fixedTotal = fixed.idx + fixed.cant + fixed.und + fixed.pUnit + fixed.ivaPct + fixed.ivaAmt + fixed.total;
        const descWidth = Math.max(40, contentW - fixedTotal - 2);
  
        autoTable(pdf, {
          startY,
          margin: {
            left: MARGINS.left, right: MARGINS.right,
            top: MARGINS.top + HEADER_H, bottom: MARGINS.bottom + FOOTER_H,
          },
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
  
      function drawTotals(pdf, signaturePng) {
        const { pageW } = box(pdf);
        ensureSpace(pdf, 40);
  
        pdf.setDrawColor(0).setLineWidth(0.2);
        pdf.line(MARGINS.left, cursorY, pageW - MARGINS.right, cursorY);
        cursorY += 6;
  
        pdf.setFontSize(12);
        const rightX = pageW - MARGINS.right;
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
        pdf.setFontSize(11);
  
        const rightBlockW = 60;
        const rightX2 = pageW - MARGINS.right;
        const rightX1 = rightX2 - rightBlockW;
  
        pdf.text("Firma Cliente:", MARGINS.left, cursorY);
        pdf.line(MARGINS.left, cursorY + 5, MARGINS.left + 60, cursorY + 5);
  
        pdf.text("Firma Empresa:", rightX1, cursorY, { align: "left" });
        const lineY = cursorY + 5;
  
        if (signaturePng) {
          const targetW = 38, targetH = 16;
          const sigX = rightX1 + (rightBlockW - targetW) / 2;
          const sigY = lineY + 1.5;
          ensureSpace(pdf, targetH + 8);
          pdf.addImage(signaturePng, "PNG", sigX, sigY, targetW, targetH);
        }
        pdf.line(rightX1, lineY, rightX2, lineY);
  
        cursorY += 18;
      }
  
      // ensamblado
      drawHeaderFooter(doc);
      resetCursor(doc);
      drawParties(doc);
      drawItemsTable(doc);
      drawTotals(doc, signaturePng);
  
      // marca de agua
      if (pngDataUrl) {
        const { pageW, pageH } = box(doc);
        const pages = doc.internal.getNumberOfPages();
        for (let p = 1; p <= pages; p++) {
          doc.setPage(p);
          // @ts-ignore
          doc.setGState(new doc.GState({ opacity: 0.08 }));
          doc.addImage(pngDataUrl, "PNG", pageW / 2 - 30, pageH / 2 - 30, 60, 60);
          doc.setGState(new doc.GState({ opacity: 1 }));
        }
      }
  
      // === 4) Guardar y navegar (AHORA sí tenemos doc y filename) ===
      await savePDFFile(doc, filename);
  
      navigate(-1);
    } catch (err) {
      console.error("Error al generar PDF:", err);
      alert("Ha ocurrido un error al generar el PDF. Revisa consola.");
    }
  };  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Clave coherente por tipo
    const key = documentType === "factura" ? "facturas" : "presupuestos";
    const saved = JSON.parse(localStorage.getItem(key) || "[]");

    // Asegurar ID y persistencia (crear/actualizar)
    const docWithId = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
    const idx = saved.findIndex((d) => d.id === docWithId.id);
    const enriched = { ...docWithId, documentType };
    if (idx >= 0) saved[idx] = enriched;
    else saved.push(enriched);
    localStorage.setItem(key, JSON.stringify(saved));

    setShowToast(true);
    generatePDF();
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-400 to-purple-300">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8 md:p-10">
        {/* Encabezado: Título y Toggle */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800">
            📂 Generador de {documentType === "factura" ? "Factura" : "Presupuesto"}
          </h1>
          <div className="flex justify-center mt-4 space-x-4">
            <button
              type="button"
              onClick={() => handleDocumentTypeChange("presupuesto")}
              className={`px-5 py-2 rounded-full transition-transform duration-150 hover:scale-105 ${
                documentType === "presupuesto"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border border-blue-600 text-blue-600"
              }`}
            >
              Presupuesto
            </button>
            <button
            type="button"
            onClick={async () => {
              if (!validate()) return;

              // 1) Preparar doc emitido
              const docWithId = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
              const issued = { ...docWithId, documentType, facturada: true };

              // 2) Guardar en facturas (emitidas)
              upsertLS("facturas", issued);
              // 3) Si existía como borrador, eliminarlo de savedInvoices
              removeFromLS("savedInvoices", issued.id);

              // 4) Generar PDF y copiar a BALANCE (si factura & facturada)
              await generatePDF(/* ya usas */);

              // 5) Toast ok (ya lo haces dentro de generatePDF -> navigate(-1))
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-150"
          >
            Facturar 
          </button>
          </div>
        </div>

        {/* Sección 1: Información General (Documento y Cliente) */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Datos del Documento</h2>
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-1">
                Nº {documentType === "presupuesto" ? "Presupuesto" : "Factura"}:
              </label>
              <input
                type="text"
                id="numero"
                value={formData.numero}
                onChange={handleChange}
                onBlur={handleInvoiceNumberBlur}
                placeholder="Escribe solo el número (ej: 9)"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numero ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.numero && <p className="text-red-500 text-sm mt-1">{errors.numero}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Se formatea automáticamente como <b>AAAA_NNNN</b> (p.ej. 2025_0009).
              </p>
            </div>
            <div>
              <label className="block text-gray-800 font-medium mb-1">Fecha:</label>
              <DatePicker
                selected={
                  formData.fecha instanceof Date
                    ? formData.fecha
                    : formData.fecha
                    ? new Date(formData.fecha)
                    : null
                }
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                placeholderText="Selecciona la fecha"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fecha ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.fecha && <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Datos del Cliente</h2>
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-1">Nombre del Cliente:</label>
              <input
                type="text"
                id="clienteNombre"
                value={formData.clienteNombre}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteNombre ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteNombre && <p className="text-red-500 text-sm mt-1">{errors.clienteNombre}</p>}
            </div>
            <div>
              <label className="block text-gray-800 font-medium mb-1">CIF/NIF:</label>
              <input
                type="text"
                id="clienteCIF"
                value={formData.clienteCIF}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteCIF ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteCIF && <p className="text-red-500 text-sm mt-1">{errors.clienteCIF}</p>}
            </div>
          </div>
        </div>

        {/* Sección 2: Ubicación y Configuración Financiera */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Dirección / Ubicación</h2>
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-1">Dirección:</label>
              <input
                type="text"
                id="clienteDireccion"
                value={formData.clienteDireccion}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteDireccion ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteDireccion && <p className="text-red-500 text-sm mt-1">{errors.clienteDireccion}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-1">Código Postal:</label>
              <input
                type="text"
                id="clienteCP"
                value={formData.clienteCP}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteCP ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteCP && <p className="text-red-500 text-sm mt-1">{errors.clienteCP}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-gray-800 font-medium mb-1">Localidad:</label>
              <input
                type="text"
                id="clienteLocalidad"
                value={formData.clienteLocalidad}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteLocalidad ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteLocalidad && <p className="text-red-500 text-sm mt-1">{errors.clienteLocalidad}</p>}
            </div>
            <div>
              <label className="block text-gray-800 font-medium mb-1">Provincia:</label>
              <input
                type="text"
                id="clienteProvincia"
                value={formData.clienteProvincia}
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.clienteProvincia ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.clienteProvincia && <p className="text-red-500 text-sm mt-1">{errors.clienteProvincia}</p>}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Configuración Financiera</h2>
            <div>
              <label className="block text-gray-800 font-medium mb-1">IVA (%):</label>
              <input
                type="number"
                id="iva"
                value={formData.iva}
                min="0"
                max="100"
                onChange={handleChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.iva ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.iva && <p className="text-red-500 text-sm mt-1">{errors.iva}</p>}
            </div>
          </div>
        </div>

        {/* Sección 3: Comentario y Servicios / Artículos */}
        <div className="mb-6">
          {errors.items && (
            <p className="text-red-500 text-sm mb-2">{errors.items}</p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Comentario del Servicio</h2>
            <textarea
              id="comentarios"
              value={formData.comentarios}
              onChange={handleChange}
              placeholder="Describe aquí el detalle o comentario del servicio, hasta 500 palabras..."
              rows="10"
              className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.comentarios ? "border-red-500" : "border-gray-300 bg-blue-50"
              }`}
            />
            {errors.comentarios && (
              <p className="text-red-500 text-sm mt-1">{errors.comentarios}</p>
            )}
          </div>

          {formData.items.length > 0 && (
            <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-600">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase">Descripción</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">Cant.</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">Und.</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">P.Unit €</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">IVA%</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">IVA €</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">Total €</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-200">
                  {formData.items.map((s, i) => {
                    const base = Number(s.quantity) * Number(s.price);
                    const ivaAmt = base * (Number(s.iva) / 100);
                    const total = base + ivaAmt;
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm text-gray-700">{i + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{s.description}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-center">{s.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-center">
                          {s.unit === "Unidades" ? "Unid." : s.unit}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-right">
                          {Number(s.price).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-center">
                          {Number(s.iva).toFixed(0)}%
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-right">
                          {ivaAmt.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-right font-semibold">
                          {total.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-center">
                          {/* Acciones apiladas (más visibles) */}
                          <div className="flex flex-col items-stretch space-y-2">
                            <button
                              type="button"
                              onClick={() => openEditItemModal(i)}
                              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold shadow"
                              title="Editar"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const copy = [...formData.items];
                                copy.splice(i, 1);
                                setFormData({ ...formData, items: copy });
                              }}
                              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow"
                              title="Borrar"
                            >
                              🗑️ Borrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-center mt-6">
          <div className="flex mb-4 sm:mb-0 space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors duration-150"
            >
              Volver Atrás
            </button>
            <button
              type="button"
              onClick={openAddItemModal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-150"
            >
              Añadir Servicio
            </button>
            <button
            type="button"
            onClick={() => {
              if (!formData.items?.length) return alert("Añade al menos un servicio para guardar el borrador.");
              // Autogenera id si no existe
              const draft = formData.id ? formData : { ...formData, id: uuidv4(), createdAt: Date.now() };
              // No marcar como facturada
              draft.facturada = false;
              upsertLS("savedInvoices", draft);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 1500);
            }}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors duration-150"
          >
            Guardar (borrador)
          </button>
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-150"
          >
            Generar {documentType === "presupuesto" ? "Presupuesto" : "Factura"}
          </button>
        </div>
      </div>

      {/* Modal para Agregar/Editar Servicio */}
      {isItemModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                {editingItemIndex !== null ? "Editar Servicio" : "Agregar Servicio"}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Descripción:</label>
                <textarea
                  id="description"
                  value={itemForm.description}
                  onChange={handleItemFormChange}
                  placeholder="Escribe la descripción completa (hasta 500 palabras)..."
                  rows="12"
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Cantidad:</label>
                  <input
                    type="number"
                    id="quantity"
                    value={itemForm.quantity}
                    onChange={handleItemFormChange}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Precio Unitario (€):</label>
                  <input
                    type="number"
                    id="price"
                    value={itemForm.price}
                    onChange={handleItemFormChange}
                    className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">IVA del Servicio (%):</label>
                <input
                  type="number"
                  id="iva"
                  value={itemForm.iva}
                  onChange={handleItemFormChange}
                  className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Unidad de Medida:</label>
                <div className="flex space-x-4">
                  <label
                    className={`cursor-pointer px-4 py-2 border rounded-md transition-colors duration-150 ${
                      itemForm.unit === "m²"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="unit"
                      value="m²"
                      checked={itemForm.unit === "m²"}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="hidden"
                    />
                    m²
                  </label>
                  <label
                    className={`cursor-pointer px-4 py-2 border rounded-md transition-colors duration-150 ${
                      itemForm.unit === "Unidades"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="unit"
                      value="Unidades"
                      checked={itemForm.unit === "Unidades"}
                      onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                      className="hidden"
                    />
                    Unid.
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white rounded-md transition-colors duration-150"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors duration-150"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Éxito */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-green-500 text-white px-10 py-5 rounded-lg shadow-lg flex items-center animate-bounce">
          <span className="mr-4">
             {documentType === "presupuesto" ? "Presupuesto" : "Factura"} generada con éxito!
          </span>
          <button
            onClick={() => setShowToast(false)}
            className="text-white hover:text-gray-200 font-bold"
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentGenerator;

