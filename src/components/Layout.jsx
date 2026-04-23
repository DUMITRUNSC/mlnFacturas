import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { FIREBASE_READY } from "../services/firebase.js";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const icons = {
  home:     "M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z M9 21V12h6v9",
  building: "M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9h6v12",
  file:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  receipt:  "M4 2h16v20l-3-2-2 2-3-2-3 2-2-2-3 2V2z M8 7h8 M8 11h8 M8 15h5",
  chart:    "M18 20V10 M12 20V4 M6 20v-6",
  menu:     "M3 6h18 M3 12h18 M3 18h18",
  x:        "M18 6L6 18 M6 6l12 12",
  chevronL: "M15 18l-6-6 6-6",
  chevronR: "M9 18l6-6-6-6",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:     "M12 5v14 M5 12h14",
};

/* ─── Nav config ─────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { path: "/",        label: "Inicio",     icon: "home"     },
      { path: "/empresa", label: "Mi Empresa", icon: "building" },
    ],
  },
  {
    label: "Documentos",
    items: [
      { path: "/presupuestos", label: "Nuevo Presupuesto", icon: "file"    },
      { path: "/facturas",     label: "Nueva Factura",     icon: "receipt" },
    ],
  },
  {
    label: "Gestión",
    items: [
      { path: "/gestion-empresarial",    label: "Resumen",      icon: "chart"   },
      { path: "/presupuestos-guardadas", label: "Presupuestos", icon: "file"    },
      { path: "/facturas-guardadas",     label: "Facturas",     icon: "receipt" },
      { path: "/balances",               label: "Balances",     icon: "chart"   },
    ],
  },
];

const BOTTOM_NAV = [
  { path: "/",                        label: "Inicio",       icon: "home"     },
  { path: "/presupuestos-guardadas",  label: "Presupuestos", icon: "file"     },
  { path: "/presupuestos",            label: "Nuevo",        icon: "plus",    special: true },
  { path: "/facturas-guardadas",      label: "Facturas",     icon: "receipt"  },
  { path: "/empresa",                 label: "Empresa",      icon: "building" },
];

/* ─── Sidebar (desktop only) ─────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  return (
    <aside
      className="hidden md:flex flex-col h-screen bg-gray-900 border-r border-gray-800 transition-all duration-200 shrink-0"
      style={{ width: collapsed ? 56 : 228 }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-gray-800 gap-3">
        <div className="shrink-0 w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9h6v12"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="text-white font-semibold text-sm leading-tight truncate flex-1">
            MLN <span className="text-gray-500 font-normal">Construcciones</span>
          </span>
        )}
        <button
          onClick={onToggle}
          className={`text-gray-600 hover:text-gray-300 transition-colors ${collapsed ? "mx-auto" : ""}`}
        >
          <Icon d={collapsed ? icons.chevronR : icons.chevronL} size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                      }`}
                    >
                      <span className="shrink-0"><Icon d={icons[item.icon]} size={15} /></span>
                      {!collapsed && <span className="truncate font-medium">{item.label}</span>}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <SidebarFooter collapsed={collapsed} />
    </aside>
  );
}

function SidebarFooter({ collapsed }) {
  const { user, logout } = useAuth() || {};
  if (!FIREBASE_READY || !user) {
    return !collapsed ? (
      <div className="px-3 py-3 border-t border-gray-800">
        <p className="text-[10px] text-gray-700">v1.0.0</p>
      </div>
    ) : null;
  }
  return (
    <div className="border-t border-gray-800 px-3 py-3 shrink-0">
      {!collapsed ? (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-bold uppercase">{(user.email || "U")[0]}</span>
          </div>
          <p className="text-xs text-gray-400 truncate flex-1">{user.email}</p>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
          >
            <Icon d={icons.logout} size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={logout}
          title="Cerrar sesión"
          className="w-full flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors py-1"
        >
          <Icon d={icons.logout} size={14} />
        </button>
      )}
    </div>
  );
}

/* ─── Mobile Drawer ──────────────────────────────────────────────────────── */
function MobileDrawer({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth() || {};
  useEffect(() => { onClose(); }, [location.pathname]);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900 z-50 flex flex-col md:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9h6v12"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">MLN Construcciones</p>
              <p className="text-gray-500 text-[10px]">en Altura SL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-1 transition-colors">
            <Icon d={icons.x} size={17} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-600">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        className={`flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                        }`}
                      >
                        <Icon d={icons[item.icon]} size={15} />
                        {item.label}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User */}
        {FIREBASE_READY && user && (
          <div className="border-t border-gray-800 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold uppercase">{(user.email || "U")[0]}</span>
              </div>
              <p className="text-xs text-gray-400 truncate flex-1">{user.email}</p>
              <button onClick={logout} className="text-gray-600 hover:text-red-400 transition-colors">
                <Icon d={icons.logout} size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Bottom Nav (mobile only) ───────────────────────────────────────────── */
function BottomNav() {
  const location = useLocation();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex items-end"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {BOTTOM_NAV.map((item) => {
        const isActive = item.path === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(item.path);

        /* Centro: botón especial "Nuevo" */
        if (item.special) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-end pb-2"
            >
              <div className="w-13 h-13 -mt-4 bg-blue-600 hover:bg-blue-700 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-blue-500/40 transition-colors"
                style={{ width: 52, height: 52, marginTop: -14 }}>
                <Icon d={icons.plus} size={22} />
                <span className="text-[9px] font-black text-white/80 mt-0.5 tracking-wide">NUEVO</span>
              </div>
              <span className="text-[9px] font-bold text-blue-600 mt-1">Crear</span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors min-h-[56px] ${
              isActive ? "text-blue-600" : "text-gray-400"
            }`}
          >
            {/* Active indicator dot */}
            <div className={`w-1 h-1 rounded-full mb-0.5 transition-all ${isActive ? "bg-blue-600 scale-100" : "scale-0 bg-transparent"}`} />
            <Icon d={icons[item.icon]} size={isActive ? 20 : 19} />
            <span className={`text-[10px] font-bold transition-all ${isActive ? "text-blue-600" : "text-gray-400"}`}>
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ─── Top Bar ─────────────────────────────────────────────────────────────── */
const PAGE_TITLES = {
  "/":                       "Inicio",
  "/empresa":                "Mi Empresa",
  "/facturas":               "Nueva Factura",
  "/presupuestos":           "Nuevo Presupuesto",
  "/documento":              "Documento",
  "/gestion-empresarial":    "Gestión",
  "/facturas-guardadas":     "Facturas",
  "/presupuestos-guardadas": "Presupuestos",
  "/balances":               "Balances",
};

function TopBar({ onMenuClick }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "MLN";
  const { fbStatus, loading } = useData() || {};

  const statusCfg = {
    connected:  { dot: "bg-emerald-500", label: "Sincronizado" },
    local:      { dot: "bg-amber-400",   label: "Local"        },
    connecting: { dot: "bg-blue-400 animate-pulse", label: "Conectando" },
    error:      { dot: "bg-red-500",     label: "Error"        },
  };
  const s = statusCfg[fbStatus] || statusCfg.local;

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 shrink-0">
      <button onClick={onMenuClick} className="md:hidden text-gray-500 hover:text-gray-900 p-1 -ml-1 transition-colors">
        <Icon d={icons.menu} size={20} />
      </button>

      <h1 className="text-gray-900 font-semibold text-sm flex-1 truncate">{title}</h1>

      {loading && (
        <svg className="animate-spin w-3 h-3 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        <span className="text-xs text-gray-400 hidden sm:inline">{s.label}</span>
      </div>
    </header>
  );
}

/* ─── Firebase Banner ─────────────────────────────────────────────────────── */
function FirebaseBanner() {
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem("fb_banner_dismissed"));
  if (FIREBASE_READY || dismissed) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex items-center gap-2 text-xs text-amber-700 shrink-0">
      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
      <span className="flex-1">Modo local — los datos se guardan solo en este dispositivo.</span>
      <button
        onClick={() => { sessionStorage.setItem("fb_banner_dismissed","1"); setDismissed(true); }}
        className="shrink-0 text-amber-500 hover:text-amber-700 font-semibold text-sm leading-none transition-colors"
      >×</button>
    </div>
  );
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */
export default function Layout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <FirebaseBanner />
        <main className="flex-1 overflow-y-auto pb-nav-safe md:pb-0">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
