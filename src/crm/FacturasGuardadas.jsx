import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function safeDate(d) {
  try {
    if (!d) return "—";
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString();
  } catch {
    return "—";
  }
}

export default function FacturasGuardadas() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  // Cargar al entrar
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("savedInvoices") || "[]");
    setInvoices(Array.isArray(saved) ? saved : []);
  }, []);

  // Refrescar al volver el foco
  useEffect(() => {
    const onFocus = () => {
      const saved = JSON.parse(localStorage.getItem("savedInvoices") || "[]");
      setInvoices(Array.isArray(saved) ? saved : []);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleEliminar = (index) => {
    const doc = invoices[index];
    if (!doc) return;
    if (!window.confirm(`¿Deseas eliminar el borrador ${doc.numero || ""}?`)) return;
    const next = invoices.filter((_, i) => i !== index);
    setInvoices(next);
    localStorage.setItem("savedInvoices", JSON.stringify(next));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-red-300 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8 text-center">📁 FACTURAS GUARDADAS</h1>

        <div className="w-full bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2 text-left">🔢 Número</th>
                <th className="border p-2 text-left">👤 Cliente</th>
                <th className="border p-2 text-left">📅 Fecha</th>
                <th className="border p-2 w-64 text-center">⚙️ Opciones</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((doc, index) => {
                  const nombreCliente = [doc?.clienteNombre, doc?.clienteApellidos]
                    .filter(Boolean)
                    .join(" ") || "—";
                  return (
                    <tr key={doc?.id || index} className="hover:bg-gray-50">
                      <td className="border p-2">{doc?.numero || "—"}</td>
                      <td className="border p-2">{nombreCliente}</td>
                      <td className="border p-2">{safeDate(doc?.fecha)}</td>
                      <td className="border p-2">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/documento?edit=${encodeURIComponent(doc.id)}`)}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                            title="Editar"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&autopdf=1`)}
                            className="px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-800 text-xs"
                            title="Descargar PDF"
                          >
                            ⬇️ PDF
                          </button>
                          <button
                            onClick={() => navigate(`/documento?edit=${encodeURIComponent(doc.id)}&issue=1&autopdf=1`)}
                            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            title="Facturar"
                          >
                            ✅ Facturar
                          </button>
                          <button
                            onClick={() => handleEliminar(index)}
                            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            title="Eliminar borrador"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-600">⚠️ No hay facturas guardadas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/gestion-empresarial")}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors duration-150 flex items-center gap-2"
          >
            <span>🔙</span> Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}
