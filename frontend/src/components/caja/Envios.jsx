import React, { useState, useEffect } from 'react';
import { Send, Plus, Edit2, Trash2, Calendar, Clock, DollarSign, Loader, X, Check, User, Globe } from 'lucide-react';
import { cajaService } from '../../services/cajaService';
import { formatCurrency, formatDateShort, formatTime } from '../../utils/formatters';

const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 border-l-4 p-4 rounded-lg shadow-xl ${styles[type]} animate-slide-in`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <Check size={20} /> : <X size={20} />}
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
};

// Fecha local sin bug UTC (Ecuador UTC-5, >20:00 cambia de día con toISOString)
const fechaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const EnviosComponent = () => {
  const [envios, setEnvios] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [envioEditando, setEnvioEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState({ total: 0, count: 0 });

  // Usuario logueado — filtra solo sus envíos
  const usuarioActual = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  })();

  // Vista: 'mio' = mis envíos de hoy | 'todos' = todos con filtros
  const [vista, setVista] = useState('mio');

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: fechaLocal(),
    turnoId: ''
  });

  const [formulario, setFormulario] = useState({
    fecha: fechaLocal(),
    hora: new Date().toTimeString().slice(0, 5),
    descripcion: '',
    monto: '',
    turnoId: ''
  });

  useEffect(() => {
    cargarTurnos();
    cargarEnvios();
  }, []);

  useEffect(() => {
    cargarEnvios();
  }, [filtros, vista]);

  const cargarTurnos = async () => {
    try {
      const data = await cajaService.getTurnos();
      setTurnos(data);
      if (data.length > 0 && !formulario.turnoId) {
        setFormulario(prev => ({ ...prev, turnoId: data[0].id }));
      }
    } catch (error) {
      showNotification('error', 'Error al cargar turnos');
    }
  };

  const cargarEnvios = async () => {
    try {
      setLoading(true);
      // Vista 'mio': solo mis envíos de hoy sin mostrar filtros de fecha
      const params = vista === 'mio'
        ? {
            fechaInicio: fechaLocal(),
            fechaFin:    fechaLocal(),
            ...(usuarioActual?.id ? { usuarioId: usuarioActual.id } : {})
          }
        : filtros;
      const data = await cajaService.getEnvios(params);
      setEnvios(data.envios);
      setEstadisticas({ total: data.total, count: data.count });
    } catch (error) {
      showNotification('error', 'Error al cargar envíos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleSubmit = async () => {
    if (!formulario.descripcion || !formulario.monto || !formulario.turnoId) {
      showNotification('error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      if (envioEditando) {
        await cajaService.actualizarEnvio(envioEditando.id, formulario);
        showNotification('success', 'Envío actualizado correctamente');
      } else {
        await cajaService.crearEnvio({
          ...formulario,
          ...(usuarioActual?.id ? { usuario_id: usuarioActual.id } : {})
        });
        showNotification('success', 'Envío registrado correctamente');
      }
      
      resetFormulario();
      setMostrarModal(false);
      cargarEnvios();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al guardar envío');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (envio) => {
    setEnvioEditando(envio);
    setFormulario({
      fecha: envio.fecha ? String(envio.fecha).split('T')[0] : fechaLocal(),
      hora: envio.hora,
      descripcion: envio.descripcion,
      monto: envio.monto,
      turnoId: envio.turnoId
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este envío?')) return;

    try {
      await cajaService.eliminarEnvio(id);
      showNotification('success', 'Envío eliminado correctamente');
      cargarEnvios();
    } catch (error) {
      showNotification('error', 'Error al eliminar envío');
    }
  };

  const resetFormulario = () => {
    setFormulario({
      fecha: fechaLocal(),
      hora: new Date().toTimeString().slice(0, 5),
      descripcion: '',
      monto: '',
      turnoId: turnos[0]?.id || ''
    });
    setEnvioEditando(null);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    resetFormulario();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Gestión de Envíos
            </h1>
            <p className="text-gray-600 text-sm">Registra y controla todos los envíos de dinero</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg text-sm"
          >
            <Plus size={18} />
            Nuevo Envío
          </button>
        </div>
      </div>

      {/* Toggle vista */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setVista('mio')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all ${
              vista === 'mio' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <User size={14} />
            Mis envíos de hoy
          </button>
          <button
            onClick={() => setVista('todos')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold transition-all ${
              vista === 'todos' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Globe size={14} />
            Todos los envíos
          </button>
        </div>
        {vista === 'mio' && usuarioActual && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
            <User size={13} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-700">{usuarioActual.nombre}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Enviado</p>
              <p className="text-xl md:text-3xl font-bold text-gray-800 mt-2">{formatCurrency(parseFloat(estadisticas.total))}</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
              <DollarSign className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total de Envíos</p>
              <p className="text-xl md:text-3xl font-bold text-gray-800 mt-2">{estadisticas.count}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-4 shadow-lg">
              <Send className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {vista === 'todos' && (
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
          <h3 className="text-base font-bold text-gray-800 mb-3">Filtros de Búsqueda</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Turno</label>
              <select
                value={filtros.turnoId}
                onChange={(e) => setFiltros(prev => ({ ...prev, turnoId: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los turnos</option>
                {turnos.map(turno => (
                  <option key={turno.id} value={turno.id}>{turno.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading && envios.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
          ) : envios.length === 0 ? (
            <div className="text-center p-12">
              <Send className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay envíos registrados</p>
              <p className="text-gray-500 mt-2">Comienza registrando tu primer envío</p>
            </div>
          ) : (
            <table className="w-full min-w-[550px]">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Hora</th>
                  <th className="px-6 py-4 text-left">Descripción</th>
                  <th className="px-6 py-4 text-left">Turno</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {envios.map((envio, index) => (
                  <tr key={envio.id} className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 font-medium">{formatDateShort(envio.fecha)}</td>
                    <td className="px-6 py-4">{formatTime(envio.hora)}</td>
                    <td className="px-6 py-4">{envio.descripcion}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {envio.turno.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(parseFloat(envio.monto))}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditar(envio)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminar(envio.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">{envioEditando ? 'Editar Envío' : 'Nuevo Envío'}</h2>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={18} />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Clock className="inline mr-2" size={18} />
                    Hora
                  </label>
                  <input
                    type="time"
                    value={formulario.hora}
                    onChange={(e) => setFormulario(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Describe el envío..."
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
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Turno</label>
                  <select
                    value={formulario.turnoId}
                    onChange={(e) => setFormulario(prev => ({ ...prev, turnoId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar turno</option>
                    {turnos.map(turno => (
                      <option key={turno.id} value={turno.id}>{turno.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : envioEditando ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={cerrarModal}
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

export default EnviosComponent;