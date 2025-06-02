import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Balances({ onSelectDocument }) {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);

  useEffect(() => {
    const savedBalances = JSON.parse(localStorage.getItem("savedBalances")) || [];
    setBalances(savedBalances);
  }, []);

  const handleRowClick = (doc) => {
    if (onSelectDocument) onSelectDocument(doc);
  };

  // Función que elimina la factura
  const handleDeleteInvoice = (index) => {
    const updatedBalances = balances.filter((_, i) => i !== index);
    setBalances(updatedBalances);
    localStorage.setItem("savedBalances", JSON.stringify(updatedBalances));
  };

  // Muestra un toast de confirmación para eliminar la factura
  const confirmDeleteInvoice = (index, doc) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">
            ¿Seguro que quiere eliminar la factura de {doc.clienteNombre}?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                handleDeleteInvoice(index);
                closeToast();
              }}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-150"
            >
              Sí
            </button>
            <button
              onClick={closeToast}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors duration-150"
            >
              No
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  // Calcula el total facturado bruto sumando el subtotal de cada ítem
  const getTotalBruto = () => {
    let total = 0;
    balances.forEach((doc) => {
      if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach((item) => {
          total += item.quantity * item.price;
        });
      }
    });
    return total;
  };

  // Calcula el total de IVA a pagar
  const getTotalIVA = () => {
    let totalIVA = 0;
    balances.forEach((doc) => {
      if (doc.items && Array.isArray(doc.items)) {
        doc.items.forEach((item) => {
          const subtotal = item.quantity * item.price;
          totalIVA += subtotal * (item.iva / 100);
        });
      }
    });
    return totalIVA;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-300 flex items-center justify-center p-6">
      {/* Contenedor blanco más ancho */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8 text-center">
          📊 BALANCES
        </h1>

        {/* Banner de Resumen */}
        <div className="w-full p-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl border-4 border-white shadow-2xl text-center mb-8">
          <h3 className="text-3xl font-extrabold text-white mb-6">
            Resumen de Balances
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xl text-white font-medium">
                Total Facturado Bruto
              </p>
              <p className="text-2xl font-bold text-white">
                €{getTotalBruto().toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xl text-white font-medium">
                IVA a Pagar Total
              </p>
              <p className="text-2xl font-bold text-white">
                €{getTotalIVA().toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xl text-white font-medium">
                Beneficio Bruto
              </p>
              <p className="text-2xl font-bold text-white">
                €{(getTotalBruto() - getTotalIVA()).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Balances */}
        <div className="w-full bg-white rounded-xl shadow p-4">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">🔢 Número</th>
                <th className="border p-2">👤 Cliente</th>
                <th className="border p-2">📅 Fecha</th>
                {/* Columna estrecha para el icono de papelera */}
                <th className="border p-2 w-16 text-center">🗑️ Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {balances.length > 0 ? (
                balances.map((doc, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleRowClick(doc)}
                  >
                    <td className="border p-2">{doc.numero}</td>
                    <td className="border p-2">{doc.clienteNombre}</td>
                    <td className="border p-2">{doc.fecha}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteInvoice(index, doc);
                        }}
                        className="w-full h-full flex items-center justify-center text-2xl text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    ⚠️ No hay balances guardados.
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
      <ToastContainer />
    </div>
  );
}

export default Balances;
