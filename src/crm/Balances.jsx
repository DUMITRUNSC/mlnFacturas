import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Balances() {
  const navigate = useNavigate();
  const [balances, setBalances] = useState([]);4

  // ---- helpers para totales seguros (con paréntesis) ----
  const safeBase = (it) => {
    const subtotal = Number(it?.quantity || 0) * Number(it?.price || 0);
    return Number(it?.total ?? subtotal ?? 0);
  };
  
  const safeIva = (it) => {
    const base = safeBase(it);
    const ivaCalc = base * (Number(it?.iva || 0) / 100);
    return Number(it?.ivaAmount ?? ivaCalc ?? 0);
  };
  
  const getTotalBruto = () =>
    balances.reduce(
      (acc, doc) =>
        acc + (doc.items || []).reduce((s, it) => s + safeBase(it), 0),
      0
    );

  const getTotalIVA = () =>
    balances.reduce(
      (acc, doc) =>
        acc + (doc.items || []).reduce((s, it) => s + safeIva(it), 0),
      0
    );

  // ---- carga inicial + refresco al volver ----
  useEffect(() => {
    const load = () => {
      const all = JSON.parse(localStorage.getItem("facturas") || "[]");
      setBalances(all.filter((f) => f.facturada === true));
    };
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ---- borrar por ID ----
  const handleDeleteInvoice = (id) => {
    const all = JSON.parse(localStorage.getItem("facturas") || "[]");
    const newAll = all.filter((f) => f.id !== id);
    localStorage.setItem("facturas", JSON.stringify(newAll));
    setBalances(newAll.filter((f) => f.facturada === true));
  };

  const confirmDeleteInvoice = (id, doc) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="mb-2">
            ¿Seguro que quiere eliminar la factura de {doc.clienteNombre}?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                handleDeleteInvoice(id);
                closeToast();
              }}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Sí
            </button>
            <button
              onClick={closeToast}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              No
            </button>
          </div>
        </div>
      ),
      { autoClose: false }
    );
  };

  // ---- fecha segura ----
  const renderFecha = (value) => {
    try {
      const d = new Date(value);
      if (!isNaN(d)) return d.toLocaleDateString();
      return String(value ?? "");
    } catch {
      return String(value ?? "");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-300 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-screen-xl">
        <h1 className="text-5xl font-extrabold text-gray-800 mb-8 text-center">
          📊 BALANCES
        </h1>

        {/* === Resumen === */}
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
              <p className="text-xl text-white font-medium">Beneficio Bruto</p>
              <p className="text-2xl font-bold text-white">
                €{(getTotalBruto() - getTotalIVA()).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* === Tabla === */}
        <div className="w-full bg-white rounded-xl shadow p-4">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">🔢 Número</th>
                <th className="border p-2">👤 Cliente</th>
                <th className="border p-2">📅 Fecha</th>
                <th className="border p-2 w-16 text-center">🗑️ Eliminar</th>
              </tr>
            </thead>
            <tbody>
              {balances.length > 0 ? (
                balances.map((doc, index) => (
                  <tr
                    key={doc.id || index}
                    className="hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="border p-2">{doc.numero}</td>
                    <td className="border p-2">{doc.clienteNombre}</td>
                    <td className="border p-2">{renderFecha(doc.fecha)}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteInvoice(doc.id, doc);
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
                  <td colSpan="4" className="text-center py-4 text-gray-600">
                    ⚠️ No hay facturas facturadas.
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
      <ToastContainer />
    </div>
  );
}

export default Balances;
