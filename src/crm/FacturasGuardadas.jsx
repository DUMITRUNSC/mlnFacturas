import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function FacturasGuardadas({ onSelectDocument, onDeleteDocument, onFacturarDocument }) {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    // Obtenemos los documentos guardados en "savedInvoices"
    // y filtramos solo aquellos que sean facturas (documentType === "factura")
    const savedInvoices = JSON.parse(localStorage.getItem("savedInvoices")) || [];
    const filteredInvoices = savedInvoices.filter((doc) => doc.documentType === "factura");
    setInvoices(filteredInvoices);
  }, []);

  const handleRowClick = (doc) => {
    if (onSelectDocument) onSelectDocument(doc);
  };

  const handleEliminar = (doc, index) => {
    if (window.confirm(`¿Deseas eliminar la factura ${doc.numero}?`)) {
      const newInvoices = [...invoices];
      newInvoices.splice(index, 1);
      setInvoices(newInvoices);
      localStorage.setItem("savedInvoices", JSON.stringify(newInvoices));
      if (onDeleteDocument) onDeleteDocument(doc, index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-300 flex items-center justify-center p-6">
      {/* Contenedor blanco ampliado, igual que en Balances */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl text-center">
        {/* Título */}
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8">
          🧾 FACTURAS GUARDADAS
        </h1>

        {/* Tabla de facturas */}
        <div className="w-full bg-white rounded-xl shadow p-4">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">🔢 Número</th>
                <th className="border p-2">👤 Cliente</th>
                <th className="border p-2">📅 Fecha</th>
                {/* Columnas de acción con ancho fijo */}
                <th className="border p-2 w-16 text-center">✏️ Editar</th>
                <th className="border p-2 w-16 text-center">🗑️ Eliminar</th>
                <th className="border p-2 w-16 text-center">✅ Facturar</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? (
                invoices.map((doc, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="border p-2 cursor-pointer" onClick={() => handleRowClick(doc)}>
                      {doc.numero}
                    </td>
                    <td className="border p-2 cursor-pointer" onClick={() => handleRowClick(doc)}>
                      {doc.clienteNombre}
                    </td>
                    <td className="border p-2 cursor-pointer" onClick={() => handleRowClick(doc)}>
                      {doc.fecha}
                    </td>
                    {/* Botón de Editar: redirige a "/facturas" enviando el documento a editar */}
                    <td className="border p-2 text-center w-16">
                      <button
                        onClick={() =>
                          navigate("/facturas", { state: { invoiceData: doc } })
                        }
                        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-150"
                      >
                        ✏️
                      </button>
                    </td>
                    <td className="border p-2 text-center w-16">
                      <button
                        onClick={() => handleEliminar(doc, index)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150"
                      >
                        🗑️
                      </button>
                    </td>
                    <td className="border p-2 text-center w-16">
                      <button
                        onClick={() => onFacturarDocument(doc, index)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-150"
                      >
                        ✅
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    ⚠️ No hay facturas guardadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Botón para volver al menú de Gestión Empresarial */}
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

export default FacturasGuardadas;
