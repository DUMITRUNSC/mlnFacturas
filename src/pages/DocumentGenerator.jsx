import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// 1️⃣ Importa tu contexto
import { BusinessContext } from "../context/BusinessContext.jsx";

function DocumentGenerator({ documentType: initialType = "presupuesto" }) {
  const navigate = useNavigate();

  // 2️⃣ Suscríbete al contexto para acceder a tus datos de empresa
  const { business } = useContext(BusinessContext);

  const [documentType, setDocumentType] = useState(initialType);
  const [formData, setFormData] = useState({
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
  });
  const [showToast, setShowToast] = useState(false);
  const [errors, setErrors] = useState({});

  // Modal de servicios
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [itemForm, setItemForm] = useState({
    description: "",
    quantity: "",
    price: "",
    unit: "m²",
    iva: 21,
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  // Toggle para seleccionar el tipo de documento
  const handleDocumentTypeChange = (value) => {
    setDocumentType(value);
  };

  // Formateo del número de documento
  const handleInvoiceNumberBlur = () => {
    let numberPart = formData.numero;
    if (numberPart.includes("/")) {
      numberPart = numberPart.split("/")[0];
    }
    const padded = numberPart.padStart(4, "0");
    let year;
    if (formData.fecha instanceof Date) {
      year = formData.fecha.getFullYear();
    } else if (formData.fecha) {
      year = formData.fecha.split("-")[0];
    } else {
      year = new Date().getFullYear();
    }
    setFormData({ ...formData, numero: `${padded}/${year}` });
  };

  // Manejo de la fecha con DatePicker
  const handleDateChange = (date) => {
    setFormData({ ...formData, fecha: date });
  };

  // Abrir modal para agregar servicio (prellenando el IVA con el global)
  const openAddItemModal = () => {
    setEditingItemIndex(null);
    setItemForm({ description: "", quantity: "", price: "", unit: "m²", iva: formData.iva });
    setIsItemModalOpen(true);
  };

  // Abrir modal para editar servicio (manteniendo el IVA de ese servicio)
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

  const validate = () => {
    let newErrors = {};
    if (!formData.numero.toString().trim()) {
      newErrors.numero = "El número de documento es obligatorio";
    } else if (!/^\d{4}\/\d{4}$/.test(formData.numero.toString().trim())) {
      newErrors.numero = "El número debe tener el formato 0001/2023";
    }
    if (!formData.fecha) {
      newErrors.fecha = "La fecha es obligatoria";
    }
    if (!formData.clienteNombre.trim()) {
      newErrors.clienteNombre = "El nombre del cliente es obligatorio";
    }
    if (!formData.clienteCIF.trim()) {
      newErrors.clienteCIF = "El CIF/NIF es obligatorio";
    } else if (
      !/^(?:[0-9]{8}[A-Z]|[XYZ]\d{7}[A-Z]|[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J])$/.test(
        formData.clienteCIF.trim()
      )
    ) {
      newErrors.clienteCIF = "Formato de CIF/NIF no válido";
    }
    if (!formData.clienteDireccion.trim()) {
      newErrors.clienteDireccion = "La dirección es obligatoria";
    }
    if (!formData.clienteCP.trim()) {
      newErrors.clienteCP = "El código postal es obligatorio";
    } else if (!/^\d{5}$/.test(formData.clienteCP.trim())) {
      newErrors.clienteCP = "El código postal debe tener 5 dígitos";
    }
    if (!formData.clienteLocalidad.trim()) {
      newErrors.clienteLocalidad = "La localidad es obligatoria";
    }
    if (!formData.clienteProvincia.trim()) {
      newErrors.clienteProvincia = "La provincia es obligatoria";
    }
    if (isNaN(formData.iva) || formData.iva < 0 || formData.iva > 100) {
      newErrors.iva = "El IVA debe estar entre 0 y 100";
    }
    if (formData.items.length === 0) {
      newErrors.items = "Debe agregar al menos un servicio/artículo";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDF = async () => {
    try {
      // ─── 0️⃣ Carga el SVG y conviértelo a PNG ───────────────────
      // 1. Fetch del SVG
      const resp = await fetch("/logo.svg");
      if (!resp.ok) throw new Error("No se encontró /logo.svg en public/");
      const svgText = await resp.text();
      // 2. Base64 del SVG
      const svgBase64 = window.btoa(unescape(encodeURIComponent(svgText)));
      const svgDataUrl = "data:image/svg+xml;base64," + svgBase64;
      // 3. Carga en un <img> y dibuja en canvas
      const img = new Image();
      img.src = svgDataUrl;
      await new Promise((res) => (img.onload = res));
      const canvas = document.createElement("canvas");
      const size = 100;  // 100×100 mm escalará bien
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      // Opcional: fondo transparente
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      // 4. Extrae PNG dataURL
      const pngDataUrl = canvas.toDataURL("image/png");
  
      // ─── 1️⃣ Extrae tus datos ───────────────────────────────────
      const {
        numero, fecha, clienteNombre, clienteCIF,
        clienteDireccion, clienteCP, clienteLocalidad, clienteProvincia,
        iva: ivaPctGlobal, items: servicios, comentarios
      } = formData;
      const {
        companyName, nif, phone,
        street, postalCode, locality, community,
        bank, accountNumber, holder
      } = business;
  
      // ─── 2️⃣ Totales y nombre de fichero ────────────────────────
      const totalBase  = servicios.reduce((s, x) => s + x.total, 0);
      const totalIVA   = servicios.reduce((s, x) => s + x.ivaAmount, 0);
      const totalFinal = totalBase + totalIVA;
      const fileNum    = numero.replace(/\//g, "-");
      const cliForFile = clienteNombre.trim().replace(/\s+/g, "_") || "Cliente";
      const filename   = `${companyName}_${fileNum}_${cliForFile}.pdf`;
  
      // ─── 3️⃣ Inicializa jsPDF ───────────────────────────────────
      const doc   = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let pageNumber = 1;
      const ml = 20, mr = pageW - 20;
      const fechaStr = fecha instanceof Date
        ? fecha.toISOString().slice(0,10)
        : fecha;
      const title = documentType === "factura" ? "Factura" : "Presupuesto";
  
      // ─── 4️⃣ Funciones auxiliares ───────────────────────────────
      function agregarEncabezado() {
        doc.setFontSize(10).text(`Fecha: ${fechaStr}`, 7, 12);
        const xLabel = 7 + 30;
        doc.setFillColor(220).rect(0, 15, 65, 10, "F");
        doc.setFontSize(12).setFont(undefined, "bold")
           .text(`N° ${title}:`, xLabel, 22)
           .setFont(undefined, "normal")
           .text(numero, xLabel + 28, 22);
        doc.setFontSize(10)
           .text(`Página ${pageNumber}`, pageW - 7, pageH - 10, { align: "right" });
      }
  
      function agregarDatosEmpresaYCliente() {
        const boxW = (pageW - 40) / 2;
        const y0 = 30;
        doc.setFillColor(240).rect(20, y0, boxW, 40, "F"); // Empresa
        doc.setFontSize(10).setTextColor(0);
        doc.text(companyName, 22, y0 + 6);
        doc.text(`NIF/CIF: ${nif}`, 22, y0 + 12);
        doc.text(`Tel: ${phone}`, 22, y0 + 18);
        doc.text(
          `Dir: ${street}, ${postalCode} ${locality} (${community})`,
          22, y0 + 24, { maxWidth: boxW - 4 }
        );
        const xCli = 20 + boxW + 10;                    // Cliente
        doc.setFillColor(240).rect(xCli, y0, boxW, 40, "F");
        doc.text("Cliente:", xCli + 2, y0 + 6);
        doc.text(clienteNombre,   xCli + 2, y0 + 12);
        doc.text(clienteCIF,       xCli + 2, y0 + 18);
        doc.text(clienteDireccion, xCli + 2, y0 + 24, { maxWidth: boxW - 4 });
        doc.text(
          `${clienteCP} - ${clienteLocalidad}, ${clienteProvincia}`,
          xCli + 2, y0 + 30
        );
      }
  
      function agregarTablaServicios(startY) {
        let y = startY;
        if (comentarios?.trim()) {
          doc.setFontSize(10).setFont(undefined, "bold").text("Comentario:", ml, y);
          const lines = doc.splitTextToSize(comentarios, pageW - 40);
          doc.setFont(undefined, "normal").text(lines, ml, y + 6);
          y += lines.length * 6 + 8;
        }
        if (!servicios.length) return y;
        const head = ["#", "Descripción", "Cant.", "Und.", "P.Unit €", "IVA%", "IVA €", "Total €"];
        const body = servicios.map((s,i) => [
          i+1,
          doc.splitTextToSize(s.description, 60),
          s.quantity,
          s.unit==="Unidades" ? "Unid." : s.unit,
          s.price.toFixed(2),
          s.iva.toFixed(0),
          s.ivaAmount.toFixed(2),
          s.totalWithIVA.toFixed(2)
        ]);
        autoTable(doc, {
          startY: y,
          margin: { left: ml, right: ml },
          tableWidth: pageW - 40,
          head: [head],
          body,
          theme: "grid",
          headStyles: { fillColor: [200,200,200], halign: "center" },
          styles: { fontSize: 9 },
          didDrawPage: () => {
            pageNumber = doc.internal.getNumberOfPages();
            agregarEncabezado();
          },
        });
        return doc.lastAutoTable.finalY||y;
      }
  
      function agregarTotales(y) {
        let cy = y + 20;
        if (cy+60 > pageH-20) {
          doc.addPage(); pageNumber++; cy = 30; agregarEncabezado();
        }
        doc.setDrawColor(0).setLineWidth(0.5).line(ml,cy,mr,cy);
        doc.setFontSize(12).setFont(undefined,"normal");
        doc.text(`Base: ${totalBase.toFixed(2)} €`, mr, cy+8, { align: "right" });
        doc.text(`IVA:  ${totalIVA.toFixed(2)} €`,    mr, cy+16,{ align: "right" });
        doc.text(`Total:${totalFinal.toFixed(2)} €`,  mr, cy+24,{ align: "right" });
        cy+=40;
        doc.setFontSize(11).setFont(undefined,"bold").text("Datos de Pago:",ml,cy);
        doc.setFont(undefined,"normal")
           .text(`Banco:  ${bank}`,ml,cy+8)
           .text(`Cuenta: ${accountNumber}`,ml,cy+16)
           .text(`Titular: ${holder}`,ml,cy+24);
        cy+=50;
        doc.setFontSize(11).text("Firma Cliente:",ml,cy);
        doc.line(ml,cy+5,80,cy+5);
        doc.text("Firma Empresa:",pageW-80,cy);
        doc.line(pageW-80,cy+5,pageW-20,cy+5);
      }
  
      // ─── 5️⃣ Montaje completo ───────────────────────────────
      agregarEncabezado();
      agregarDatosEmpresaYCliente();
      const afterTab = agregarTablaServicios(85);
      agregarTotales(afterTab);
  
      // ─── 6️⃣ Marca de agua PNG en cada página ──────────────
      const pages = doc.internal.getNumberOfPages();
      for (let p=1; p<=pages; p++) {
        doc.setPage(p);
        doc.setGState(new doc.GState({ opacity: 0.1 }));
        doc.addImage(pngDataUrl, "PNG", pageW/2-50, pageH/2-50, 100, 100);
        doc.setGState(new doc.GState({ opacity: 1 }));
      }
  
      // ─── 7️⃣ Guardar y redirigir ───────────────────────────
      doc.save(filename);
      navigate(-1);
  
    } catch(err) {
      console.error("❌ Error al generar PDF:", err);
      alert("Ha ocurrido un error al generar el PDF. Revisa consola.");
    }
  };
  const handleSubmit = (e) => {
    console.log("🚀 handleSubmit", formData);
    e.preventDefault();
    if (validate()) {
      // Selecciona la clave de almacenamiento según el tipo
      const key = documentType === "factura" ? "savedInvoices" : "savedQuotations";
      const savedDocuments = JSON.parse(localStorage.getItem(key)) || [];
      // Agrega el documento generado (puedes incluir también el tipo para referencia)
      savedDocuments.push({ ...formData, documentType });
      localStorage.setItem(key, JSON.stringify(savedDocuments));
  
      setShowToast(true);
      generatePDF();
      setTimeout(() => {
        setShowToast(false);
        // Opcional: redirigir o limpiar el formulario
      }, 3000);
    }
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
              onClick={() => handleDocumentTypeChange("factura")}
              className={`px-5 py-2 rounded-full transition-transform duration-150 hover:scale-105 ${
                documentType === "factura"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-white border border-blue-600 text-blue-600"
              }`}
            >
              Factura
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
                placeholder="Ej: 12"
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.numero ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.numero && <p className="text-red-500 text-sm mt-1">{errors.numero}</p>}
            </div>
            <div>
              <label className="block text-gray-800 font-medium mb-1">Fecha:</label>
              <DatePicker
                selected={formData.fecha instanceof Date ? formData.fecha : null}
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
          
          {/* … en lugar de tu tabla antigua: */}
{formData.items.length > 0 && (
  <div className="overflow-x-auto bg-white rounded-lg shadow mb-6">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-blue-600">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase">
            #
          </th>
          <th className="px-4 py-2 text-left text-xs font-semibold text-white uppercase">
            Descripción
          </th>
          <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">
            Cant.
          </th>
          <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">
            Und.
          </th>
          <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">
            P.Unit €
          </th>
          <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">
            IVA%
          </th>
          <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">
            IVA €
          </th>
          <th className="px-4 py-2 text-right text-xs font-semibold text-white uppercase">
            Total €
          </th>
          <th className="px-4 py-2 text-center text-xs font-semibold text-white uppercase">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {formData.items.map((s, i) => {
          const base   = s.quantity * s.price;
          const ivaAmt = base * (s.iva / 100);
          const total  = base + ivaAmt;
          return (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-sm text-gray-700">{i + 1}</td>
              <td className="px-4 py-2 text-sm text-gray-700">{s.description}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-center">{s.quantity}</td>
              <td className="px-4 py-2 text-sm text-gray-700 text-center">
                {s.unit === 'Unidades' ? 'Unid.' : s.unit}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">
                {s.price.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 text-center">
                {s.iva}%
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right">
                {ivaAmt.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 text-right font-semibold">
                {total.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-sm text-gray-700 text-center">
                <div className="inline-flex space-x-1">
                  {/* Editar */}
                  <button
                    type="button"
                    onClick={() => openEditItemModal(i)}
                    className="p-1 bg-green-500 hover:bg-green-600 text-white rounded-full"
                    title="Editar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4L18.5 2.5z"/>
                    </svg>
                  </button>
                  {/* Borrar */}
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...formData.items];
                      copy.splice(i, 1);
                      setFormData({ ...formData, items: copy });
                    }}
                    className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                    title="Borrar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                         viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M10 3h4m-6 0h8a2 2 0 012 2v1H6V5a2 2 0 012-2z"/>
                    </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  rows="15"
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
              {/* Campo para IVA del Servicio */}
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
            ✅ {documentType === "presupuesto" ? "Presupuesto" : "Factura"} generada con éxito!
          </span>
          <button onClick={() => setShowToast(false)} className="text-white hover:text-gray-200 font-bold">
            ✖
          </button>
        </div>
      )}
    </div>
  );
}

export default DocumentGenerator;