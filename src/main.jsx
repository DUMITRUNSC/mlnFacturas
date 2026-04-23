import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Layout from "./components/Layout";
import App from "./App";
import BusinessData from "./pages/BusinessData";
import DocumentGenerator from "./pages/DocumentGenerator";
import GestionEmpresarial from "./crm/GestionEmpresarial";
import FacturasGuardadas from "./crm/FacturasGuardadas";
import PresupuestosGuardadas from "./crm/PresupuestosGuardados";
import Balances from "./crm/Balances";
import Login from "./pages/Login";

import { BusinessProvider } from "./context/BusinessContext";
import { DataProvider }     from "./context/DataContext";
import { AuthProvider }     from "./context/AuthContext";
import ProtectedRoute       from "./components/ProtectedRoute.jsx";
import "./index.css";

/* ─── App root ─────────────────────────────────────────────────────────────── */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BusinessProvider>
        <DataProvider>
          <Router>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — require login */}
              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="/"                        element={<App />} />
                <Route path="/empresa"                 element={<BusinessData />} />
                <Route path="/facturas"                element={<DocumentGenerator key="factura"     documentType="factura"      />} />
                <Route path="/presupuestos"            element={<DocumentGenerator key="presupuesto" documentType="presupuesto"  />} />
                <Route path="/documento"               element={<DocumentGenerator />} />
                <Route path="/gestion-empresarial"     element={<GestionEmpresarial />} />
                <Route path="/facturas-guardadas"      element={<FacturasGuardadas />} />
                <Route path="/presupuestos-guardadas"  element={<PresupuestosGuardadas />} />
                <Route path="/balances"                element={<Balances />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </DataProvider>
      </BusinessProvider>
    </AuthProvider>
  </React.StrictMode>
);
