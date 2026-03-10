import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Edit2, Trash2, Calendar, CheckCircle, X, Clock, AlertTriangle, Loader, Check } from 'lucide-react';
import { proveedoresService } from '../../services/proveedoresService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

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

const PedidosComponent = () => {
  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresDelDia, setProveedoresDelDia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalDias, setMostrarModalDias] = useState(false);
  const [editando, setEditando] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    llegados: 0,
    pendientes: 0
  });

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    proveedorId: '',
    llego: ''
  });

  const [formulario, setFormulario] = useState({
    fecha: new Date().toISOString().split('T')[0],
    proveedorId: '',
    llego: false,
    fechaLlegada: '',
    montoFactura: '',
    descuento: '',
    productosCaducados: '',
    notas: ''
  });

  const [diasSeleccionados, setDiasSeleccionados] = useState([]);

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [filtros]);

  const cargarDatosIniciales = async () => {
    try {
      const provs = await proveedoresService.getProveedores({ activo: 'true' });
      setProveedores(provs);
      
      if (provs.length > 0) {
        setFormulario(prev => ({ ...prev, proveedorId: provs[0].id }));
      }

      await cargarProveedoresDelDia();
      await cargarPedidos();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const cargarProveedoresDelDia = async () => {
    try {
      const data = await proveedoresService.getProveedoresDelDia(new Date().toISOString().split('T')[0]);
      setProveedoresDelDia(data.proveedores);
    } catch (error) {
      console.error('Error al cargar proveedores del día:', error);
    }
  };

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getPedidos(filtros);
      setPedidos(data.pedidos);
      setEstadisticas(data.estadisticas);
    } catch (error) {
      showNotification('error', 'Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handleSubmit = async () => {
    if (!formulario.proveedorId) {
      showNotification('error', 'Selecciona un proveedor');
      return;
    }

    try {
      setLoading(true);
      if (editando) {
        await proveedoresService.actualizarPedido(editando.id, formulario);
        showNotification('success', 'Pedido actualizado');
      } else {
        await proveedoresService.crearPedido(formulario);
        showNotification('success', 'Pedido registrado');
      }
      
      resetFormulario();
      setMostrarModal(false);
      await cargarPedidos();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (pedido) => {
    setEditando(pedido);
    setFormulario({
      fecha: new Date(pedido.fecha).toISOString().split('T')[0],
      proveedorId: pedido.proveedorId,
      llego: pedido.llego,
      fechaLlegada: pedido.fechaLlegada ? new Date(pedido.fechaLlegada).toISOString().split('T')[0] : '',
      montoFactura: pedido.montoFactura || '',
      descuento: pedido.descuento || '',
      productosCaducados: pedido.productosCaducados || '',
      notas: pedido.notas || ''
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este pedido?')) return;

    try {
      await proveedoresService.eliminarPedido(id);
      showNotification('success', 'Pedido eliminado');
      await cargarPedidos();
    } catch (error) {
      showNotification('error', 'Error al eliminar');
    }
  };

  const handleConfigurarDias = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    const diasActuales = proveedor.diasPedido.map(d => d.diaSemana);
    setDiasSeleccionados(diasActuales);
    setMostrarModalDias(true);
  };

  const handleGuardarDias = async () => {
    try {
      setLoading(true);
      await proveedoresService.configurarDiasPedido(proveedorSeleccionado.id, diasSeleccionados);
      showNotification('success', 'Días configurados correctamente');
      setMostrarModalDias(false);
      await cargarDatosIniciales();
    } catch (error) {
      showNotification('error', 'Error al configurar días');
    } finally {
      setLoading(false);
    }
  };

  const toggleDia = (dia) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
    }
  };

  const resetFormulario = () => {
    setFormulario({
      fecha: new Date().toISOString().split('T')[0],
      proveedorId: proveedores[0]?.id || '',
      llego: false,
      fechaLlegada: '',
      montoFactura: '',
      descuento: '',
      productosCaducados: '',
      notas: ''
    });
    setEditando(null);
  };

  const getDiaNombre = (num) => diasSemana[num];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-rose-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Gestión de Pedidos
            </h1>
            <p className="text-gray-600">Control de pedidos a proveedores y calendario semanal</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Nuevo Pedido
          </button>
        </div>
      </div>

      {/* Proveedores que deben pedir HOY */}
      {proveedoresDelDia.length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={32} />
            <div>
              <h3 className="text-2xl font-bold">Proveedores para pedir HOY</h3>
              <p className="text-blue-100 text-sm">{diasSemana[new Date().getDay()]}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {proveedoresDelDia.map(p => (
              <div key={p.id} className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
                <p className="font-bold text-lg">{p.nombre}</p>
                {p.contacto && <p className="text-xs text-blue-100">{p.contacto}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Pedidos</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{estadisticas.total}</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-blue-500 rounded-full p-4 shadow-lg">
              <ShoppingBag className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Llegados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{estadisticas.llegados}</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
              <CheckCircle className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Pendientes</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{estadisticas.pendientes}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-4 shadow-lg">
              <Clock className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Configuración de días por proveedor */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Configuración de Días de Pedido</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedores.map(proveedor => (
            <div key={proveedor.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{proveedor.nombre}</h4>
                <button
                  onClick={() => handleConfigurarDias(proveedor)}
                  className="from-blue-600 to-indigo-600 text-white px-2 py-0 rounded-xl   shadow-lg"
                >
                  Conf
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {proveedor.diasPedido.length > 0 ? (
                  proveedor.diasPedido.map(d => (
                    <span key={d.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                      {getDiaNombre(d.diaSemana)}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">Sin días configurados</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
            <select
              value={filtros.proveedorId}
              onChange={(e) => setFiltros(prev => ({ ...prev, proveedorId: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {proveedores.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.llego}
              onChange={(e) => setFiltros(prev => ({ ...prev, llego: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="true">Llegados</option>
              <option value="false">Pendientes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading && pedidos.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center p-12">
              <ShoppingBag className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay pedidos registrados</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Proveedor</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-left">Fecha Llegada</th>
                  <th className="px-6 py-4 text-right">Factura</th>
                  <th className="px-6 py-4 text-right">Descuento</th>
                  <th className="px-6 py-4 text-right">Total</th>
                  <th className="px-6 py-4 text-left">Caducados</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((pedido, index) => (
                  <tr key={pedido.id} className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4">{formatDateShort(pedido.fecha)}</td>
                    <td className="px-6 py-4 font-semibold">{pedido.proveedor.nombre}</td>
                    <td className="px-6 py-4 text-center">
                      {pedido.llego ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1 justify-center">
                          <CheckCircle size={16} />
                          Llegó
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold flex items-center gap-1 justify-center">
                          <Clock size={16} />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{pedido.fechaLlegada ? formatDateShort(pedido.fechaLlegada) : '-'}</td>
                    <td className="px-6 py-4 text-right">{pedido.montoFactura ? formatCurrency(parseFloat(pedido.montoFactura)) : '-'}</td>
                    <td className="px-6 py-4 text-right">{pedido.descuento ? formatCurrency(parseFloat(pedido.descuento)) : '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      {pedido.montoFinal ? formatCurrency(parseFloat(pedido.montoFinal)) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {pedido.productosCaducados ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Sí
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditar(pedido)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminar(pedido.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
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

      {/* Modal Nuevo/Editar Pedido */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">{editando ? 'Editar' : 'Nuevo'} Pedido</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={18} />
                    Fecha del Pedido
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Proveedor</label>
                  <select
                    value={formulario.proveedorId}
                    onChange={(e) => setFormulario(prev => ({ ...prev, proveedorId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={formulario.llego}
                    onChange={(e) => setFormulario(prev => ({ ...prev, llego: e.target.checked }))}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm font-bold text-gray-700">¿El pedido ya llegó?</label>
                </div>

                {formulario.llego && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Fecha de Llegada</label>
                    <input
                      type="date"
                      value={formulario.fechaLlegada}
                      onChange={(e) => setFormulario(prev => ({ ...prev, fechaLlegada: e.target.value }))}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Monto Factura</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.montoFactura}
                    onChange={(e) => setFormulario(prev => ({ ...prev, montoFactura: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Descuento</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.descuento}
                    onChange={(e) => setFormulario(prev => ({ ...prev, descuento: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {formulario.montoFactura && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm font-bold text-blue-900">
                    Total a pagar: {formatCurrency((parseFloat(formulario.montoFactura) || 0) - (parseFloat(formulario.descuento) || 0))}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Productos Caducados</label>
                <textarea
                  value={formulario.productosCaducados}
                  onChange={(e) => setFormulario(prev => ({ ...prev, productosCaducados: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Lista de productos caducados encontrados..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formulario.notas}
                  onChange={(e) => setFormulario(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModal(false);
                    resetFormulario();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Configurar Días */}
      {mostrarModalDias && proveedorSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Configurar Días de Pedido</h2>
              <p className="text-indigo-100 text-sm mt-1">{proveedorSeleccionado.nombre}</p>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4 font-semibold">Selecciona los días en que se debe hacer el pedido:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {diasSemana.map((dia, index) => (
                  <button
                    key={index}
                    onClick={() => toggleDia(index)}
                    className={`p-4 rounded-xl font-semibold transition-all border-2 ${
                      diasSeleccionados.includes(index)
                        ? 'bg-gradient-to-r from-blue-600 to-green-600 text-black border-blue-600 shadow-lg'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {dia}
                  </button>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <p className="text-sm text-blue-900 font-semibold">
                  {diasSeleccionados.length === 0 
                    ? 'No hay días seleccionados' 
                    : `Días seleccionados: ${diasSeleccionados.length}`
                  }
                </p>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleGuardarDias}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModalDias(false);
                    setProveedorSeleccionado(null);
                    setDiasSeleccionados([]);
                  }}
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

export default PedidosComponent;