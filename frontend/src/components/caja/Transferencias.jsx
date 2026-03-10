// =============================================
// frontend/src/components/caja/Transferencias.jsx
// =============================================

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Plus, Edit2, Trash2, Calendar, DollarSign,
  Loader, X, Check, User, Globe, Eye
} from 'lucide-react';
import { cajaService } from '../../services/cajaService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

// ─────────────────────────────────────────────────────────
// Utilidad: obtener usuario autenticado desde localStorage
// Ajusta esta función si tu app guarda el usuario diferente
// ─────────────────────────────────────────────────────────
const getUsuarioActual = () => {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Fecha local del navegador (evita el bug de UTC que cambia de día a las 20:00 EC)
const fechaLocal = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─────────────────────────────────────────────────────────
// Notificación
// ─────────────────────────────────────────────────────────
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error:   'bg-red-100 border-red-500 text-red-800',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 border-l-4 p-4 rounded-lg shadow-xl ${styles[type]}`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <Check size={20} /> : <X size={20} />}
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────
const TransferenciasComponent = () => {
  const usuarioActual = getUsuarioActual();

  const [transferencias, setTransferencias]   = useState([]);
  const [turnos, setTurnos]                   = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [notification, setNotification]       = useState(null);
  const [mostrarModal, setMostrarModal]       = useState(false);
  const [editando, setEditando]               = useState(null);
  const [estadisticas, setEstadisticas]       = useState({ total: 0, count: 0 });

  // ── Vista: 'mio' = solo del usuario hoy | 'todas' = con filtros completos
  const [vista, setVista] = useState('mio');

  // Filtros completos (solo activos en vista 'todas')
  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin:    fechaLocal(),
    turnoId:     ''
  });

  const [formulario, setFormulario] = useState({
    fecha:       fechaLocal(),
    descripcion: '',
    monto:       '',
    turnoId:     ''
  });

  useEffect(() => { cargarTurnos(); }, []);

  // Recargar cada vez que cambia la vista o los filtros
  useEffect(() => { cargarTransferencias(); }, [vista, filtros]);

  const cargarTurnos = async () => {
    try {
      const data = await cajaService.getTurnos();
      setTurnos(data);
      if (data.length > 0 && !formulario.turnoId) {
        setFormulario(prev => ({ ...prev, turnoId: data[0].id }));
      }
    } catch {
      showNotification('error', 'Error al cargar turnos');
    }
  };

  const cargarTransferencias = async () => {
    try {
      setLoading(true);

      // En vista "mio": solo hoy + usuario actual
      // En vista "todas": rango de fechas completo sin restricción de usuario
      const params = vista === 'mio'
        ? { fechaInicio: fechaLocal(), fechaFin: fechaLocal(), usuarioId: usuarioActual?.id }
        : { ...filtros };

      const data = await cajaService.getTransferencias(params);
      setTransferencias(data.transferencias);
      setEstadisticas({ total: data.total, count: data.count });
    } catch {
      showNotification('error', 'Error al cargar transferencias');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => setNotification({ type, message });

  const handleSubmit = async () => {
    if (!formulario.descripcion || !formulario.monto || !formulario.turnoId) {
      showNotification('error', 'Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      if (editando) {
        await cajaService.actualizarTransferencia(editando.id, formulario);
        showNotification('success', 'Transferencia actualizada');
      } else {
        await cajaService.crearTransferencia(formulario);
        showNotification('success', 'Transferencia registrada');
      }
      resetFormulario();
      setMostrarModal(false);
      cargarTransferencias();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (item) => {
    setEditando(item);
    setFormulario({
      fecha:       item.fecha.split('T')[0],
      descripcion: item.descripcion,
      monto:       item.monto,
      turnoId:     item.turnoId
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta transferencia?')) return;
    try {
      await cajaService.eliminarTransferencia(id);
      showNotification('success', 'Transferencia eliminada');
      cargarTransferencias();
    } catch {
      showNotification('error', 'Error al eliminar');
    }
  };

  const resetFormulario = () => {
    setFormulario({ fecha: fechaLocal(), descripcion: '', monto: '', turnoId: turnos[0]?.id || '' });
    setEditando(null);
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Gestión de Transferencias
            </h1>
            <p className="text-gray-600">Transferencias bancarias recibidas</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Nueva Transferencia
          </button>
        </div>
      </div>

      {/* ── Toggle de vista ── */}
      <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {/* Indicador de modo activo */}
          {vista === 'mio' ? (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <User size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                Mis transferencias de hoy
                {usuarioActual?.nombre && (
                  <span className="font-normal text-indigo-500"> — {usuarioActual.nombre}</span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
              <Globe size={16} className="text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">Mostrando todas las transferencias</span>
            </div>
          )}
        </div>

        {/* Botón toggle */}
        <button
          onClick={() => setVista(v => v === 'mio' ? 'todas' : 'mio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
            vista === 'mio'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
              : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700'
          }`}
        >
          <Eye size={16} />
          {vista === 'mio' ? 'Ver todas las transferencias' : 'Ver solo las mías de hoy'}
        </button>
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">
                {vista === 'mio' ? 'Total Recibido Hoy (mis)' : 'Total Recibido'}
              </p>
              <p className="text-xl md:text-3xl font-bold text-gray-800 mt-2">{formatCurrency(parseFloat(estadisticas.total))}</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
              <DollarSign className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-teal-500">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Transferencias</p>
              <p className="text-xl md:text-3xl font-bold text-gray-800 mt-2">{estadisticas.count}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full p-4 shadow-lg">
              <CreditCard className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Filtros (solo visibles en vista "todas") ── */}
      {vista === 'todas' && (
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Turno</label>
              <select
                value={filtros.turnoId}
                onChange={(e) => setFiltros(prev => ({ ...prev, turnoId: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos</option>
                {turnos.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera de la tabla con contexto */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vista === 'mio'
              ? <><User size={16} className="text-indigo-500" /><span className="text-sm font-semibold text-gray-600">Mis transferencias de hoy — {fechaLocal()}</span></>
              : <><Globe size={16} className="text-emerald-500" /><span className="text-sm font-semibold text-gray-600">Todas las transferencias</span></>
            }
          </div>
          {loading && <Loader className="animate-spin text-green-500" size={18} />}
        </div>

        <div className="overflow-x-auto">
          {loading && transferencias.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-green-600" size={48} />
            </div>
          ) : transferencias.length === 0 ? (
            <div className="text-center p-12">
              <CreditCard className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">
                {vista === 'mio'
                  ? 'No has registrado transferencias hoy'
                  : 'No hay transferencias registradas'}
              </p>
              {vista === 'mio' && (
                <p className="text-gray-400 text-sm mt-2">
                  Puedes ver todas las transferencias con el botón de arriba
                </p>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[600px]">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Descripción</th>
                  <th className="px-6 py-4 text-left">Turno</th>
                  {/* ✅ Columna Usuario — siempre visible pero más útil en vista "todas" */}
                  <th className="px-6 py-4 text-left">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      Registrado por
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {transferencias.map((item, index) => {
                  // Destacar visualmente las propias del usuario en vista "todas"
                  const esMia = item.usuarios?.id === usuarioActual?.id;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b transition-colors ${
                        vista === 'todas' && esMia
                          ? 'bg-indigo-50 hover:bg-indigo-100'
                          : index % 2 === 0 ? 'bg-gray-50 hover:bg-green-50' : 'bg-white hover:bg-green-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium">{formatDateShort(item.fecha)}</td>
                      <td className="px-6 py-4">{item.descripcion}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {item.turno?.nombre}
                        </span>
                      </td>
                      {/* ✅ Columna usuario */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            esMia
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.usuarios?.nombre || '—'}
                          </span>
                          {esMia && (
                            <span className="text-xs text-indigo-400 font-medium">tú</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        {formatCurrency(parseFloat(item.monto))}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditar(item)}
                            className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleEliminar(item.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal nueva / editar transferencia ── */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">{editando ? 'Editar' : 'Nueva'} Transferencia</h2>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="inline mr-2" size={18} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="3"
                  placeholder="Banco, referencia, concepto..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <DollarSign className="inline mr-2" size={18} />
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(e) => setFormulario(prev => ({ ...prev, monto: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Turno</label>
                  <select
                    value={formulario.turnoId}
                    onChange={(e) => setFormulario(prev => ({ ...prev, turnoId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Seleccionar</option>
                    {turnos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={() => { setMostrarModal(false); resetFormulario(); }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferenciasComponent;