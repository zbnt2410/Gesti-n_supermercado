// =============================================
// frontend/src/components/layout/Layout.jsx
// =============================================

import React, { useState, useEffect } from 'react';
import { Menu, X, LayoutDashboard, Wallet, ShoppingCart, Users } from 'lucide-react';
import Sidebar from './Sidebar';
import Dashboard from '../../pages/Dashboard';
import CajaPage from '../../pages/CajaPage';
import ProveedoresPage from '../../pages/ProveedoresPage';
import MercadoPage from '../../pages/MercadoPage';

// Mapa de títulos para el topbar mobile
const PAGE_TITLES = {
  dashboard:   { label: 'Dashboard',    icon: LayoutDashboard },
  caja:        { label: 'Caja',         icon: Wallet },
  proveedores: { label: 'Proveedores',  icon: Users },
  mercado:     { label: 'Mercado',      icon: ShoppingCart },
};

const SUB_TITLES = {
  envios:         'Envíos',
  transferencias: 'Transferencias',
  fiados:         'Fiados',
  'dias-pedido':  'Días de Pedido',
  crear:          'Crear Proveedor',
  pagos:          'Pagos',
  pedidos:        'Pedidos',
  facturas:       'Facturas',
};

const Layout = () => {
  const [activeSection,    setActiveSection]    = useState('dashboard');
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [sidebarOpen,      setSidebarOpen]      = useState(false);

  // Cerrar sidebar en mobile cuando cambia de sección
  const handleSetSection = (section) => {
    setActiveSection(section);
  };

  // Bloquear scroll del body cuando el sidebar mobile está abierto
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':   return <Dashboard standalone />;
      case 'caja':        return <CajaPage activeSubsection={activeSubsection} />;
      case 'proveedores': return <ProveedoresPage activeSubsection={activeSubsection} />;
      case 'mercado':     return <MercadoPage />;
      default:            return <Dashboard standalone />;
    }
  };

  const pageInfo = PAGE_TITLES[activeSection] || PAGE_TITLES.dashboard;
  const PageIcon = pageInfo.icon;
  const subLabel = activeSubsection ? SUB_TITLES[activeSubsection] : null;

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Overlay oscuro mobile — clic para cerrar ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <Sidebar
        activeSection={activeSection}
        setActiveSection={handleSetSection}
        activeSubsection={activeSubsection}
        setActiveSubsection={setActiveSubsection}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">

        {/* ── Topbar mobile ── */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between
          px-4 py-3 bg-[#0f1623] border-b border-white/5 shadow-lg">

          {/* Botón hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>

          {/* Título de sección actual */}
          <div className="flex items-center gap-2">
            <PageIcon size={16} className="text-sky-400" />
            <span className="text-sm font-bold text-white">
              {subLabel ? `${pageInfo.label} · ${subLabel}` : pageInfo.label}
            </span>
          </div>

          {/* Logo pequeño */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center">
            <span className="text-[10px] font-black text-white">ZB</span>
          </div>
        </header>

        {/* ── Contenido de la página ── */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          {renderContent()}
        </main>

      </div>
    </div>
  );
};

export default Layout;