import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PresupuestosGuardadas({ onSelectDocument, onEditDocument, onDeleteDocument, onConvertirDocument }) {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    const savedQuotations = JSON.parse(localStorage.getItem("savedQuotations")) || [];
    setQuotations(savedQuotations);
  }, []);

  const handleRowClick = (doc) => {
    if (onSelectDocument) onSelectDocument(doc);
  };

  const handleEliminar = (doc, index) => {
    if (window.confirm(`¿Deseas eliminar el presupuesto ${doc.numero}?`)) {
      const newQuotations = [...quotations];
      newQuotations.splice(index, 1);
      setQuotations(newQuotations);
      localStorage.setItem("savedQuotations", JSON.stringify(newQuotations));
      if (onDeleteDocument) onDeleteDocument(doc, index);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-300 flex items-center justify-center p-6">
      {/* Contenedor blanco ampliado, igual que en Facturas */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl text-center">
        {/* Título */}
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8">
          📝 PRESUPUESTOS GUARDADOS
        </h1>

        {/* Tabla de presupuestos */}
        <div className="w-full bg-white rounded-xl shadow p-4">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">🔢 Número</th>
                <th className="border p-2">👤 Cliente</th>
                <th className="border p-2">📅 Fecha</th>
                <th className="border p-2 w-16 text-center">✏️ Editar</th>
                <th className="border p-2 w-16 text-center">🗑️ Eliminar</th>
                <th className="border p-2 w-16 text-center">🔄 Convertir</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length > 0 ? (
                quotations.map((doc, index) => (
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
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => onEditDocument(doc, index)}
                        className="flex items-center justify-center space-x-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors duration-150"
                      >
                        <span className="text-lg">✏️</span>
                        <span className="text-xs">Editar</span>
                      </button>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleEliminar(doc, index)}
                        className="flex items-center justify-center space-x-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-150"
                      >
                        <span className="text-lg">🗑️</span>
                        <span className="text-xs">Eliminar</span>
                      </button>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => onConvertirDocument(doc, index)}
                        className="flex items-center justify-center space-x-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-150"
                      >
                        <span className="text-lg">🔄</span>
                        <span className="text-xs">Convertir</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    ⚠️ No hay presupuestos guardados.
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

export default PresupuestosGuardadas;
