import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Trash2, Calendar, Clock, CreditCard, Banknote, AlertCircle, Check, X, Loader, ShoppingBag } from 'lucide-react';
import { proveedoresService } from '../../services/proveedoresService';
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
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 border-l-4 p-4 rounded-lg shadow-xl ${styles[type]} animate-slide-in`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <Check size={20} /> : type === 'warning' ? <AlertCircle size={20} /> : <X size={20} />}
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
};

const PagosProveedoresComponent = () => {
  const [pagos, setPagos] = useState([]);
  const [pedidosPendientes, setPedidosPendientes] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [efectivoDelDia, setEfectivoDelDia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModalEfectivo, setMostrarModalEfectivo] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    totalEfectivo: 0,
    totalTransferencia: 0,
    totalGeneral: 0
  });

  const [estadisticasPendientes, setEstadisticasPendientes] = useState({
    total: 0,
    totalPendiente: 0
  });

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    proveedorId: '',
    tipoPago: ''
  });

  const [formularioPago, setFormularioPago] = useState({
    fecha: new Date().toISOString().split('T')[0],
    hora: new Date().toTimeString().slice(0, 5),
    tipoPago: 'efectivo',
    turnoId: '',
    notas: ''
  });

  const [formularioEfectivo, setFormularioEfectivo] = useState({
    fecha: new Date().toISOString().split('T')[0],
    montoInicial: '',
    notas: ''
  });

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    cargarPagos();
  }, [filtros]);

  useEffect(() => {
    if (formularioPago.fecha) {
      cargarEfectivoDelDia(formularioPago.fecha);
    }
  }, [formularioPago.fecha]);

  const cargarDatosIniciales = async () => {
    try {
      const turns = await cajaService.getTurnos();
      setTurnos(turns);
      
      if (turns.length > 0) {
        setFormularioPago(prev => ({ ...prev, turnoId: turns[0].id }));
      }

      await cargarEfectivoDelDia(new Date().toISOString().split('T')[0]);
      await cargarPedidosPendientes();
      await cargarPagos();
    } catch (error) {
      console.error('Error al cargar datos iniciales:', error);
    }
  };

  const cargarPedidosPendientes = async () => {
    try {
      const data = await proveedoresService.getPedidosPendientesPago();
      setPedidosPendientes(data.pedidos);
      setEstadisticasPendientes(data.estadisticas);
    } catch (error) {
      console.error('Error al cargar pedidos pendientes:', error);
    }
  };

  const cargarEfectivoDelDia = async (fecha) => {
    try {
      const efectivo = await proveedoresService.getEfectivoDelDia(fecha);
      setEfectivoDelDia(efectivo);
    } catch (error) {
      setEfectivoDelDia(null);
    }
  };

  const cargarPagos = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getPagos(filtros);
      setPagos(data.pagos);
      setEstadisticas(data.estadisticas);
    } catch (error) {
      showNotification('error', 'Error al cargar pagos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  const handlePagarPedido = (pedido) => {
    setPedidoSeleccionado(pedido);
    setFormularioPago({
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().slice(0, 5),
      tipoPago: 'efectivo',
      turnoId: turnos[0]?.id || '',
      notas: `Pago del pedido del ${formatDateShort(pedido.fecha)}`
    });
    setMostrarModalPago(true);
  };

  const handleSubmitPago = async () => {
    if (!formularioPago.turnoId) {
      showNotification('error', 'Selecciona un turno');
      return;
    }

    if (!pedidoSeleccionado) {
      showNotification('error', 'No hay pedido seleccionado');
      return;
    }

    const montoFloat = parseFloat(pedidoSeleccionado.montoFinal);

    // Validar efectivo disponible si es pago en efectivo
    if (formularioPago.tipoPago === 'efectivo' && efectivoDelDia) {
      const disponible = parseFloat(efectivoDelDia.montoInicial) - parseFloat(efectivoDelDia.montoUtilizado);
      if (montoFloat > disponible) {
        showNotification('warning', `Efectivo insuficiente. Disponible: ${formatCurrency(disponible)}`);
        return;
      }
    }

    try {
      setLoading(true);
      await proveedoresService.crearPago({
        ...formularioPago,
        proveedorId: pedidoSeleccionado.proveedorId,
        monto: montoFloat,
        pedidoId: pedidoSeleccionado.id
      });
      
      showNotification('success', `Pago registrado: ${formatCurrency(montoFloat)}`);
      
      setMostrarModalPago(false);
      setPedidoSeleccionado(null);
      await cargarPedidosPendientes();
      await cargarPagos();
      await cargarEfectivoDelDia(formularioPago.fecha);
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al registrar pago');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarPago = async (id) => {
    if (!window.confirm('¿Eliminar este pago? El pedido volverá a estar pendiente.')) return;

    try {
      await proveedoresService.eliminarPago(id);
      showNotification('success', 'Pago eliminado y pedido marcado como pendiente');
      await cargarPedidosPendientes();
      await cargarPagos();
      await cargarEfectivoDelDia(formularioPago.fecha);
    } catch (error) {
      showNotification('error', 'Error al eliminar');
    }
  };

  const handleRegistrarEfectivo = async () => {
    if (!formularioEfectivo.montoInicial) {
      showNotification('error', 'El monto inicial es requerido');
      return;
    }

    try {
      setLoading(true);
      await proveedoresService.registrarEfectivo(formularioEfectivo);
      showNotification('success', 'Efectivo registrado correctamente');
      
      setMostrarModalEfectivo(false);
      setFormularioEfectivo({
        fecha: new Date().toISOString().split('T')[0],
        montoInicial: '',
        notas: ''
      });
      await cargarEfectivoDelDia(formularioEfectivo.fecha);
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al registrar efectivo');
    } finally {
      setLoading(false);
    }
  };

  const efectivoDisponible = efectivoDelDia 
    ? parseFloat(efectivoDelDia.montoInicial) - parseFloat(efectivoDelDia.montoUtilizado)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
              Pagos a Proveedores
            </h1>
            <p className="text-gray-600">Gestión automática desde pedidos recibidos</p>
          </div>
          <button
            onClick={() => setMostrarModalEfectivo(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Banknote size={20} />
            Registrar Efectivo del Jefe
          </button>
        </div>
      </div>

      {/* Efectivo Disponible */}
      {efectivoDelDia && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium uppercase mb-2">Efectivo del Jefe - Hoy</p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-blue-200">Monto Inicial</p>
                  <p className="text-2xl font-bold">{formatCurrency(parseFloat(efectivoDelDia.montoInicial))}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200">Utilizado</p>
                  <p className="text-2xl font-bold">{formatCurrency(parseFloat(efectivoDelDia.montoUtilizado))}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-200">Disponible</p>
                  <p className={`text-2xl font-bold ${efectivoDisponible > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {formatCurrency(efectivoDisponible)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-full p-4">
              <Banknote size={48} />
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN PRINCIPAL: PEDIDOS PENDIENTES DE PAGO */}
      <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShoppingBag size={32} />
              <div>
                <h2 className="text-2xl font-bold">Pedidos Pendientes de Pago</h2>
                <p className="text-orange-100 text-sm">Pedidos recibidos que requieren pago</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-200">Total Pendiente</p>
              <p className="text-3xl font-bold">{formatCurrency(parseFloat(estadisticasPendientes.totalPendiente))}</p>
              <p className="text-sm text-orange-100">{estadisticasPendientes.total} pedidos</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {pedidosPendientes.length === 0 ? (
            <div className="text-center p-12">
              <Check className="mx-auto text-green-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">¡Todos los pedidos están pagados!</p>
              <p className="text-gray-500 text-sm mt-2">No hay pedidos pendientes de pago en este momento</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className=" from-blue-600 to-indigo-600 text-white ">
                <tr>
                  <th className="px-12 py-10 text-left text-sm font-bold text-gray-700">Fecha Pedido</th>
                  <th className="px-12 py-10 text-left text-sm font-bold text-gray-700">Fecha Llegada</th>
                  <th className="px-12 py-10 text-left text-sm font-bold text-gray-700">Proveedor</th>
                  <th className="px-12 py-10 text-right text-sm font-bold text-gray-700">Factura</th>
                  <th className="px-12 py-10 text-right text-sm font-bold text-gray-700">Descuento</th>
                  <th className="px-12 py-10 text-right text-sm font-bold text-gray-700">Total a Pagar</th>
                  <th className="px-12 py-10 text-center text-sm font-bold text-gray-700">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pedidosPendientes.map((pedido, index) => (
                  <tr key={pedido.id} className={`border-b hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-12 py-4 text-sm">{formatDateShort(pedido.fecha)}</td>
                    <td className="px-12 py-4 text-sm">{formatDateShort(pedido.fechaLlegada)}</td>
                    <td className="px-12 py-4 font-semibold">{pedido.proveedor.nombre}</td>
                    <td className="px-12 py-4 text-right">{formatCurrency(parseFloat(pedido.montoFactura))}</td>
                    <td className="px-12 py-4 text-right text-red-600">
                      {pedido.descuento > 0 ? `-${formatCurrency(parseFloat(pedido.descuento))}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-bold text-orange-600">
                        {formatCurrency(parseFloat(pedido.montoFinal))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handlePagarPedido(pedido)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md flex items-center gap-2 mx-auto"
                      >
                        <DollarSign size={18} />
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Estadísticas de Pagos Realizados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Pagado</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(parseFloat(estadisticas.totalGeneral))}</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-4 shadow-lg">
              <DollarSign className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">En Efectivo</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(parseFloat(estadisticas.totalEfectivo))}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-4 shadow-lg">
              <Banknote className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Transferencias</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{formatCurrency(parseFloat(estadisticas.totalTransferencia))}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full p-4 shadow-lg">
              <CreditCard className="text-white" size={28} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Pagos</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{estadisticas.total}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-full p-4 shadow-lg">
              <DollarSign className="text-white" size={28} />
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Historial de Pagos Realizados</h3>
          
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Pago</label>
              <select
                value={filtros.tipoPago}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipoPago: e.target.value }))}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="">Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && pagos.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-green-600" size={48} />
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center p-12">
              <DollarSign className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay pagos registrados</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Hora</th>
                  <th className="px-6 py-4 text-left">Proveedor</th>
                  <th className="px-6 py-4 text-center">Tipo</th>
                  <th className="px-6 py-4 text-left">Turno</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-left">Notas</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago, index) => (
                  <tr key={pago.id} className={`border-b hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4">{formatDateShort(pago.fecha)}</td>
                    <td className="px-6 py-4">{formatTime(pago.hora)}</td>
                    <td className="px-6 py-4 font-semibold">{pago.proveedor.nombre}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        pago.tipoPago === 'efectivo' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {pago.tipoPago === 'efectivo' ? (
                          <span className="flex items-center gap-1 justify-center">
                            <Banknote size={14} />
                            Efectivo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 justify-center">
                            <CreditCard size={14} />
                            Transferencia
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
                        {pago.turno.nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">{formatCurrency(parseFloat(pago.monto))}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{pago.notas || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleEliminarPago(pago.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                          title="Eliminar pago (el pedido volverá a pendiente)"
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

      {/* Modal Pagar Pedido */}
      {mostrarModalPago && pedidoSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Registrar Pago</h2>
              <p className="text-green-100 text-sm mt-1">{pedidoSeleccionado.proveedor.nombre}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Información del Pedido */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Pedido del:</p>
                    <p className="text-lg font-bold text-gray-800">{formatDateShort(pedidoSeleccionado.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Llegó el:</p>
                    <p className="text-lg font-bold text-gray-800">{formatDateShort(pedidoSeleccionado.fechaLlegada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Factura:</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(parseFloat(pedidoSeleccionado.montoFactura))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 font-semibold">Descuento:</p>
                    <p className="text-lg font-bold text-red-600">
                      {pedidoSeleccionado.descuento > 0 ? `-${formatCurrency(parseFloat(pedidoSeleccionado.descuento))}` : '$0.00'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t-2 border-orange-300">
                  <p className="text-xs text-gray-600 font-semibold">TOTAL A PAGAR:</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(parseFloat(pedidoSeleccionado.montoFinal))}</p>
                </div>
              </div>

              {/* Formulario de Pago */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={18} />
                    Fecha de Pago
                  </label>
                  <input
                    type="date"
                    value={formularioPago.fecha}
                    onChange={(e) => setFormularioPago(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Clock className="inline mr-2" size={18} />
                    Hora
                  </label>
                  <input
                    type="time"
                    value={formularioPago.hora}
                    onChange={(e) => setFormularioPago(prev => ({ ...prev, hora: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Pago</label>
                  <select
                    value={formularioPago.tipoPago}
                    onChange={(e) => setFormularioPago(prev => ({ ...prev, tipoPago: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Turno</label>
                  <select
                    value={formularioPago.turnoId}
                    onChange={(e) => setFormularioPago(prev => ({ ...prev, turnoId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {turnos.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas (Opcional)</label>
                <textarea
                  value={formularioPago.notas}
                  onChange={(e) => setFormularioPago(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="2"
                  placeholder="Observaciones adicionales..."
                />
              </div>

              {formularioPago.tipoPago === 'efectivo' && efectivoDelDia && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p className="text-sm font-semibold text-blue-900">
                    Efectivo disponible: {formatCurrency(efectivoDisponible)}
                  </p>
                  {parseFloat(pedidoSeleccionado.montoFinal) > efectivoDisponible && (
                    <p className="text-sm font-semibold text-red-700 mt-1">
                      ⚠️ No hay suficiente efectivo para este pago
                    </p>
                  )}
                </div>
              )}

              {formularioPago.tipoPago === 'efectivo' && !efectivoDelDia && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                  <p className="text-sm font-semibold text-yellow-900">
                    ⚠️ No hay efectivo registrado para hoy. Registra el efectivo del jefe primero.
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmitPago}
                  disabled={loading || (formularioPago.tipoPago === 'efectivo' && !efectivoDelDia)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : 'Confirmar Pago'}
                </button>
                <button
                  onClick={() => {
                    setMostrarModalPago(false);
                    setPedidoSeleccionado(null);
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

      {/* Modal Registrar Efectivo */}
      {mostrarModalEfectivo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">Registrar Efectivo del Jefe</h2>
              <p className="text-blue-100 text-sm mt-1">Dinero dejado para pagos del día</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="inline mr-2" size={18} />
                  Fecha
                </label>
                <input
                  type="date"
                  value={formularioEfectivo.fecha}
                  onChange={(e) => setFormularioEfectivo(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <DollarSign className="inline mr-2" size={18} />
                  Monto Inicial
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formularioEfectivo.montoInicial}
                  onChange={(e) => setFormularioEfectivo(prev => ({ ...prev, montoInicial: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas (Opcional)</label>
                <textarea
                  value={formularioEfectivo.notas}
                  onChange={(e) => setFormularioEfectivo(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Concepto del efectivo..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleRegistrarEfectivo}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Registrar Efectivo'}
                </button>
                <button
                  onClick={() => setMostrarModalEfectivo(false)}
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

export default PagosProveedoresComponent;