// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import App from "./App";
import BusinessData from "./pages/BusinessData";
import DocumentGenerator from "./pages/DocumentGenerator";
import GestionEmpresarial from "./crm/GestionEmpresarial";
import FacturasGuardadas from "./crm/FacturasGuardadas";
import PresupuestosGuardadas from "./crm/PresupuestosGuardados";
import Balances from "./crm/Balances";

import { BusinessProvider } from "./context/BusinessContext";  // 🔥 IMPORTAMOS EL PROVIDER
import "./index.css"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 🔥 ENVOLVEMOS TODA LA APP EN EL PROVIDER */}
    <BusinessProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/empresa" element={<BusinessData />} />
          <Route path="/facturas" element={<DocumentGenerator documentType="factura" />} />
          <Route path="/presupuestos" element={<DocumentGenerator documentType="presupuesto" />} />
          <Route path="/gestion-empresarial" element={<GestionEmpresarial />} />
          <Route path="/facturas-guardadas" element={<FacturasGuardadas />} />
          <Route path="/presupuestos-guardadas" element={<PresupuestosGuardadas />} />
          <Route path="/balances" element={<Balances />} />
        </Routes>
      </Router>
    </BusinessProvider>
  </React.StrictMode>
);