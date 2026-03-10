// =============================================
// frontend/src/components/layout/Sidebar.jsx
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Wallet, Users, ShoppingCart, Send, CreditCard,
  FileText, DollarSign, Package, ChevronDown, Store, UserPlus,
  CalendarDays, LogOut, Receipt, UserCircle, X, Menu
} from 'lucide-react';

// ─── Paleta de colores por sección ───────────────────────────────────────────
const SECTION_ACCENT = {
  dashboard:   { dot: 'bg-sky-400',     text: 'text-sky-400',     activeBg: 'bg-sky-500/10 text-sky-300 border-l-2 border-sky-400' },
  caja:        { dot: 'bg-emerald-400', text: 'text-emerald-400', activeBg: 'bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-400' },
  proveedores: { dot: 'bg-violet-400',  text: 'text-violet-400',  activeBg: 'bg-violet-500/10 text-violet-300 border-l-2 border-violet-400' },
  mercado:     { dot: 'bg-amber-400',   text: 'text-amber-400',   activeBg: 'bg-amber-500/10 text-amber-300 border-l-2 border-amber-400' },
};

const menuItems = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  {
    id: 'caja', label: 'Caja', icon: Wallet,
    subsections: [
      { id: 'envios',          label: 'Envíos',          icon: Send },
      { id: 'transferencias',  label: 'Transferencias',  icon: CreditCard },
      { id: 'fiados',          label: 'Fiados',          icon: FileText },
    ]
  },
  {
    id: 'proveedores', label: 'Proveedores', icon: Users,
    subsections: [
      { id: 'dias-pedido', label: 'Días de Pedido',  icon: CalendarDays },
      { id: 'crear',       label: 'Crear Proveedor', icon: UserPlus },
      { id: 'pagos',       label: 'Pagos',           icon: DollarSign },
      { id: 'pedidos',     label: 'Pedidos',         icon: Package },
      { id: 'facturas',    label: 'Facturas',        icon: Receipt },
    ]
  },
  { id: 'mercado', label: 'Mercado', icon: ShoppingCart },
];

// ─── Componente principal ─────────────────────────────────────────────────────
const Sidebar = ({ activeSection, setActiveSection, activeSubsection, setActiveSubsection, isOpen, onClose }) => {
  const [usuario, setUsuario] = useState(null);
  const [expandedSection, setExpandedSection] = useState(activeSection);
  const sidebarRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('usuario');
      if (raw) setUsuario(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  // Expandir automáticamente la sección activa
  useEffect(() => {
    setExpandedSection(activeSection);
  }, [activeSection]);

  // Cerrar al hacer click fuera (mobile)
  useEffect(() => {
    const handleOutside = (e) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isOpen, onClose]);

  const handleSectionClick = (item) => {
    if (item.subsections?.length) {
      // Toggle acordeón
      setExpandedSection(prev => prev === item.id ? null : item.id);
      setActiveSection(item.id);
      setActiveSubsection(null);
    } else {
      setActiveSection(item.id);
      setActiveSubsection(null);
      setExpandedSection(item.id);
      onClose(); // cerrar mobile al navegar
    }
  };

  const handleSubClick = (sectionId, subId) => {
    setActiveSection(sectionId);
    setActiveSubsection(subId);
    onClose(); // cerrar mobile al navegar
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  };

  const getRolBadge = (rol) => {
    const badges = {
      admin:  'bg-sky-500/20 text-sky-300 border border-sky-500/30',
      cajero: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    };
    return badges[rol] || 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
  };

  return (
    <div
      ref={sidebarRef}
      className={`
        fixed left-0 top-0 h-full z-40
        w-64 lg:w-64
        flex flex-col
        bg-[#0f1623] border-r border-white/5
        shadow-2xl shadow-black/50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}
    >
      {/* ── Línea decorativa superior ── */}
      <div className="h-0.5 bg-gradient-to-r from-sky-500 via-violet-500 to-emerald-500" />

      {/* ── Header: Logo + cierre mobile ── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/25">
              <Store size={18} className="text-white" />
            </div>
            {/* Punto activo */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0f1623]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wide">ZBNT24</p>
            <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Sistema de Gestión</p>
          </div>
        </div>
        {/* Botón cerrar — solo visible en mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── Usuario ── */}
      {usuario && (
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/5 border border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <UserCircle size={16} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{usuario.nombre}</p>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 capitalize ${getRolBadge(usuario.rol)}`}>
                {usuario.rol || 'usuario'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav label ── */}
      <p className="px-5 mt-5 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
        Navegación
      </p>

      {/* ── Menu Items ── */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5 scrollbar-thin">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive   = activeSection === item.id;
          const isExpanded = expandedSection === item.id;
          const accent     = SECTION_ACCENT[item.id] || SECTION_ACCENT.dashboard;

          return (
            <div key={item.id}>
              {/* Item principal */}
              <button
                onClick={() => handleSectionClick(item)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl
                  text-sm font-medium transition-all duration-150 group
                  ${isActive
                    ? `${accent.activeBg}`
                    : 'text-slate-400 hover:text-white hover:bg-white/6'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {/* Dot indicador */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${isActive ? accent.dot : 'bg-slate-700 group-hover:bg-slate-500'}`} />
                  <Icon size={17} className={`flex-shrink-0 ${isActive ? accent.text : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.subsections && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''} ${isActive ? accent.text : 'text-slate-600'}`}
                  />
                )}
              </button>

              {/* Subsecciones — acordeón animado */}
              {item.subsections && isExpanded && (
                <div className="mt-0.5 ml-4 pl-3 border-l border-white/6 space-y-0.5 py-1">
                  {item.subsections.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeSection === item.id && activeSubsection === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubClick(item.id, sub.id)}
                        className={`
                          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                          text-xs font-medium transition-all duration-150
                          ${isSubActive
                            ? `${accent.activeBg}`
                            : 'text-slate-500 hover:text-white hover:bg-white/6'
                          }
                        `}
                      >
                        <SubIcon size={14} className={isSubActive ? accent.text : ''} />
                        <span>{sub.label}</span>
                        {isSubActive && (
                          <span className={`ml-auto w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer: Cerrar sesión + versión ── */}
      <div className="border-t border-white/5 p-4 space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
            bg-red-500/10 text-red-400 border border-red-500/20
            hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40
            transition-all duration-150 text-sm font-semibold"
        >
          <LogOut size={15} />
          Cerrar Sesión
        </button>
        <p className="text-center text-[10px] text-slate-700 font-medium">
          © 2024 zbnt24 · v1.3.0
        </p>
      </div>
    </div>
  );
};

export default Sidebar;