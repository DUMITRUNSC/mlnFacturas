import React from "react";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-blue-400 overflow-hidden px-15">
      {/* Fondo animado: blobs en tonos azules */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 right-0 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <section className="relative z-10 bg-white/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 md:p-12 max-w-4xl w-full border border-gray-200 transform transition-transform duration-500 hover:scale-105">
        <header className="flex flex-col items-center mb-10">
          <div className="mb-4 transform transition duration-500 hover:scale-110">
            <img 
              src="/logo.svg" 
              alt="Logo de MLN Construcciones" 
              className="w-24 md:w-32"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 uppercase tracking-widest text-center drop-shadow-lg">
            MLN Construcciones en Altura SL
          </h1>
          <p className="mt-2 text-md md:text-lg text-gray-600 text-center">
            Revolucionando la gestión de facturación y presupuestos con innovación y estilo.
          </p>
        </header>
        {/* Menú vertical con botones de degradados diferentes */}
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => navigate("/empresa")}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-500 hover:scale-105"
          >
            <span className="relative z-10">📂 Datos de la Empresa</span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition duration-500"></div>
          </button>
          <button 
            onClick={() => navigate("/facturas")}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-500 hover:scale-105"
          >
            <span className="relative z-10">🧾 Crear Facturas</span>
            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-20 transition duration-500"></div>
          </button>
          <button 
            onClick={() => navigate("/presupuestos")}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-500 hover:scale-105"
          >
            <span className="relative z-10">📝 Crear Presupuestos</span>
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 opacity-0 group-hover:opacity-20 transition duration-500"></div>
          </button>
          <button 
            onClick={() => navigate("/gestion-empresarial")}
            className="group relative overflow-hidden px-6 py-4 bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-bold rounded-xl shadow-lg transform transition-all duration-500 hover:scale-105"
          >
            <span className="relative z-10">📊 Gestión Empresarial</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 opacity-0 group-hover:opacity-20 transition duration-500"></div>
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;