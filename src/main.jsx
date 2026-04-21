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
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FIREBASE_READY }   from "./services/firebase.js";
import "./index.css";

/* ─── Route guard ─────────────────────────────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();

  // Firebase no configurado → acceso directo sin login
  if (!FIREBASE_READY) return children;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

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
                <Route path="/facturas"                element={<DocumentGenerator documentType="factura" />} />
                <Route path="/presupuestos"            element={<DocumentGenerator documentType="presupuesto" />} />
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
