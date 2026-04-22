import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { FIREBASE_READY } from "../services/firebase.js";

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
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
  chevronR: "M9 18l6-6-6-6",
  logout:   "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  plus:     "M12 5v14 M5 12h14",
};

/* ─── Nav config ─────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {
    label: "Principal",
    items: [
      { path: "/",          label: "Dashboard",          icon: "home"     },
      { path: "/empresa",   label: "Mi Empresa",         icon: "building" },
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
      { path: "/gestion-empresarial",    label: "Resumen",              icon: "chart"   },
      { path: "/presupuestos-guardadas", label: "Presupuestos",         icon: "file"    },
      { path: "/facturas-guardadas",     label: "Borradores",           icon: "receipt" },
      { path: "/balances",               label: "Balances",             icon: "chart"   },
    ],
  },
];

// Bottom nav: 5 most-used items on mobile
const BOTTOM_NAV = [
  { path: "/",                       label: "Inicio",       icon: "home"     },
  { path: "/presupuestos",           label: "Presupuesto",  icon: "file"     },
  { path: "/facturas",               label: "Factura",      icon: "receipt"  },
  { path: "/facturas-guardadas",     label: "Borradores",   icon: "chart"    },
  { path: "/empresa",                label: "Empresa",      icon: "building" },
];

/* ─── Sidebar (desktop only) ─────────────────────────────────────────────── */
function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  return (
    <aside
      className="hidden md:flex flex-col h-screen bg-slate-900 border-r border-slate-800 transition-all duration-300 shrink-0"
      style={{ width: collapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center px-3 py-4 border-b border-slate-800 gap-3 min-h-[60px]">
        <div className="shrink-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9h6v12"/>
          </svg>
        </div>
        {!collapsed && (
          <span className="text-white font-bold text-sm leading-tight truncate">
            MLN<br/><span className="text-slate-400 font-normal text-xs">Construcciones</span>
          </span>
        )}
        <button onClick={onToggle} className="ml-auto text-slate-500 hover:text-white transition-colors">
          <Icon d={collapsed ? icons.chevronR : icons.menu} size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <NavLink to={item.path} title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                      }`}>
                      <span className="shrink-0"><Icon d={icons[item.icon]} size={16} /></span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
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
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-xs text-slate-600">v1.0.0</p>
      </div>
    ) : null;
  }
  return (
    <div className="border-t border-slate-800 p-3 shrink-0">
      {!collapsed ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold uppercase">{(user.email || "U")[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white font-medium truncate">{user.email}</p>
            <p className="text-[10px] text-slate-500">Administrador</p>
          </div>
          <button onClick={logout} title="Cerrar sesión" className="shrink-0 text-slate-500 hover:text-red-400 transition-colors">
            <Icon d={icons.logout} size={15} />
          </button>
        </div>
      ) : (
        <button onClick={logout} title="Cerrar sesión"
          className="w-full flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors py-1">
          <Icon d={icons.logout} size={16} />
        </button>
      )}
    </div>
  );
}

/* ─── Mobile Drawer ──────────────────────────────────────────────────────── */
function MobileDrawer({ open, onClose }) {
  const location = useLocation();
  const { user, logout } = useAuth() || {};

  // Close on route change
  useEffect(() => { onClose(); }, [location.pathname]);

  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />
      <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 z-50 flex flex-col md:hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M3 21h18M3 7l9-4 9 4M4 7v14M20 7v14M9 21V9h6v12"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm">MLN Construcciones</p>
              <p className="text-slate-400 text-xs">en Altura SL</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <Icon d={icons.x} size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
                  return (
                    <li key={item.path}>
                      <NavLink to={item.path}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                          isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                        }`}>
                        <Icon d={icons[item.icon]} size={17} />
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
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold uppercase">{(user.email || "U")[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{user.email}</p>
                <p className="text-xs text-slate-500">Administrador</p>
              </div>
              <button onClick={logout} className="text-slate-500 hover:text-red-400 transition-colors p-1">
                <Icon d={icons.logout} size={18} />
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {BOTTOM_NAV.map((item) => {
        const isActive = item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path);
        return (
          <NavLink key={item.path} to={item.path}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-[10px] font-medium transition-colors min-h-[56px] ${
              isActive ? "text-blue-600" : "text-slate-500"
            }`}>
            <span className={`p-1 rounded-lg transition-colors ${isActive ? "bg-blue-50" : ""}`}>
              <Icon d={icons[item.icon]} size={20} />
            </span>
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ─── Top Bar ─────────────────────────────────────────────────────────────── */
const PAGE_TITLES = {
  "/":                       "Dashboard",
  "/empresa":                "Mi Empresa",
  "/facturas":               "Nueva Factura",
  "/presupuestos":           "Nuevo Presupuesto",
  "/documento":              "Documento",
  "/gestion-empresarial":    "Gestión",
  "/facturas-guardadas":     "Borradores",
  "/presupuestos-guardadas": "Presupuestos",
  "/balances":               "Balances",
};

function TopBar({ onMenuClick }) {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || "MLN";
  const { fbStatus, loading } = useData() || {};

  const statusCfg = {
    connected:  { dot: "bg-emerald-500", label: "Firebase" },
    local:      { dot: "bg-amber-400",   label: "Local"    },
    connecting: { dot: "bg-blue-400 animate-pulse", label: "Sync…" },
    error:      { dot: "bg-red-500",     label: "Error"    },
  };
  const s = statusCfg[fbStatus] || statusCfg.local;

  return (
    <header className="h-[56px] md:h-[60px] border-b border-slate-200 bg-white flex items-center px-4 gap-3 shrink-0">
      {/* Hamburger — mobile only */}
      <button onClick={onMenuClick} className="md:hidden text-slate-600 hover:text-slate-900 p-1 -ml-1">
        <Icon d={icons.menu} size={22} />
      </button>

      <h1 className="text-slate-800 font-semibold text-base truncate flex-1">{title}</h1>

      {loading && (
        <svg className="animate-spin w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className={`w-2 h-2 rounded-full ${s.dot}`} />
        <span className="text-xs text-slate-500 hidden sm:inline">{s.label}</span>
      </div>
    </header>
  );
}

/* ─── Firebase Banner ─────────────────────────────────────────────────────── */
function FirebaseBanner() {
  const [dismissed, setDismissed] = useState(() => !!sessionStorage.getItem("fb_banner_dismissed"));
  if (FIREBASE_READY || dismissed) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-3 py-2 flex items-start gap-2 text-xs text-amber-800 shrink-0">
      <svg className="shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span className="flex-1">Modo local — datos solo en este dispositivo.</span>
      <button onClick={() => { sessionStorage.setItem("fb_banner_dismissed","1"); setDismissed(true); }}
        className="shrink-0 text-amber-600 font-bold text-base leading-none">×</button>
    </div>
  );
}

/* ─── Layout ──────────────────────────────────────────────────────────────── */
export default function Layout() {
  const [collapsed,    setCollapsed]    = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Mobile drawer */}
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <FirebaseBanner />

        {/* Main content — pb-nav-safe on mobile clears bottom nav + safe area */}
        <main className="flex-1 overflow-y-auto pb-nav-safe md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
