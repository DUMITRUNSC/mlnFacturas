import React from "react";
import { useNavigate } from "react-router-dom";

function GestionEmpresarial() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      {/* Caja blanca centralizada */}
      <div className="bg-white rounded-3xl shadow-3xl p-10 w-full max-w-5xl text-center">
        {/* Título del recuadro */}
        <h1 className="text-5xl font-extrabold text-gray-800 mb-10 uppercase" style={{ letterSpacing: "normal" }}>
          Gestión Empresarial
        </h1>

        {/* Tarjetas verticales para cada opción */}
        <div className="flex flex-col gap-8">
          {/* Tarjeta para Facturas Guardadas */}
          <div
            onClick={() => navigate("/facturas-guardadas")}
            className="cursor-pointer p-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-lg text-white transform transition-transform duration-500 hover:scale-105"
          >
            <h2 className="text-3xl font-bold">🧾 Facturas Guardadas</h2>
          </div>

          {/* Tarjeta para Presupuestos Guardados */}
          <div
            onClick={() => navigate("/presupuestos-guardadas")}
            className="cursor-pointer p-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl shadow-lg text-white transform transition-transform duration-500 hover:scale-105"
          >
            <h2 className="text-3xl font-bold">📝 Presupuestos Guardados</h2>
          </div>

          {/* Tarjeta para Balances */}
          <div
            onClick={() => navigate("/balances")}
            className="cursor-pointer p-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-lg text-white transform transition-transform duration-500 hover:scale-105"
          >
            <h2 className="text-3xl font-bold">📊 Balances</h2>
          </div>
        </div>

        {/* Botón para volver al menú dentro del recuadro */}
        <div className="mt-10">
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg transition-colors duration-150 flex items-center gap-2 mx-auto"
          >
            <span>🔙</span> Volver al Menú
          </button>
        </div>
      </div>
    </div>
  );
}

export default GestionEmpresarial;