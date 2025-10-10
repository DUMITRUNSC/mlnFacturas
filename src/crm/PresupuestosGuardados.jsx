
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PresupuestosGuardadas() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("presupuestos") || "[]");
    setQuotations(stored);
  }, []);

  const handleEliminar = (doc, index) => {
    if (window.confirm(`¿Deseas eliminar el presupuesto ${doc.numero}?`)) {
      const updated = [...quotations];
      updated.splice(index, 1);
      setQuotations(updated);
      localStorage.setItem("presupuestos", JSON.stringify(updated));
    }
  };

  const handleEditar = (doc) => {
    navigate(`/facturas?edit=${doc.id}`);
  };

  const handleConvertir = (doc, index) => {
    const factura = { ...doc, id: doc.id || crypto.randomUUID(), facturada: false, documentType: "factura" };
    const storedFacturas = JSON.parse(localStorage.getItem("facturas") || "[]");
    localStorage.setItem("facturas", JSON.stringify([...storedFacturas, factura]));
    alert("Presupuesto convertido a factura correctamente.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-300 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8">📝 PRESUPUESTOS GUARDADOS</h1>

        <div className="w-full bg-white rounded-xl shadow p-4 overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">🔢 Número</th>
                <th className="border p-2">👤 Cliente</th>
                <th className="border p-2">📅 Fecha</th>
                <th className="border p-2 text-center">✏️ Editar</th>
                <th className="border p-2 text-center">🗑️ Eliminar</th>
                <th className="border p-2 text-center">🔄 Convertir</th>
              </tr>
            </thead>
            <tbody>
              {quotations.length > 0 ? (
                quotations.map((doc, index) => (
                  <tr key={doc.id || index} className="hover:bg-gray-100">
                    <td className="border p-2">{doc.numero}</td>
                    <td className="border p-2">{doc.clienteNombre}</td>
                    <td className="border p-2">{new Date(doc.fecha).toLocaleDateString()}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleEditar(doc)}
                        className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        ✏️
                      </button>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleEliminar(doc, index)}
                        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        🗑️
                      </button>
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleConvertir(doc, index)}
                        className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        🔄
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-gray-600">
                    ⚠️ No hay presupuestos guardados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate("/gestion-empresarial")}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition"
          >
            🔙 Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default PresupuestosGuardadas;
