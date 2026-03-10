import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Edit2, Trash2, Calendar, DollarSign, Loader, X, Check, TrendingUp, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { mercadoService } from '../../services/mercadoService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

// Fecha local del navegador (evita bug UTC que cambia de día a las 20:00 EC)
const fechaLocal = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};


const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-800',
  };

  return (
    <div className={`fixed top-6 right-6 z-50 border-l-4 p-4 rounded-lg shadow-xl ${styles[type]} animate-slide-in max-w-md`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <Check size={20} /> : type === 'warning' ? <AlertTriangle size={20} /> : <X size={20} />}
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
};

const MercadoComponent = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    totalInvertido: 0,
    promedioRentabilidad: 0,
    porUnidad: 0,
    porLibra: 0
  });

  const [calculosPreview, setCalculosPreview] = useState(null);
  const [validandoRentabilidad, setValidandoRentabilidad] = useState(false);

  const [filtros, setFiltros] = useState({
    fechaInicio: fechaLocal(),   // solo muestra el día de hoy por defecto
    fechaFin:    fechaLocal(),
    tipoVenta: '',
    activo: ''
  });

  const [formulario, setFormulario] = useState({
    fecha: fechaLocal(),
    nombre: '',
    costo: '',
    tipoVenta: 'unidad',
    cantidad: '',
    cantidadPorDolar: '' // nuevo campo para probar cantidades por $1
  });

  // Normaliza producto recibido desde API para usar propiedades JS-friendly
    const normalizeProducto = (p) => {
    return {
        ...p,
        costoUnitario: Number(p.costo_unitario ?? p.costoUnitario ?? 0),
        ventaPorUnidad: Number(p.venta_por_unidad ?? p.ventaPorUnidad ?? 0),
        cantidadPorDolar: Number(p.cantidad_por_dolar ?? p.cantidadPorDolar ?? 0),
        rentabilidad: Number(p.rentabilidad ?? 0), // <-- aquí en decimal
        precioLibra: Number(p.precio_libra ?? p.precioLibra ?? 0)
    };
    };

  useEffect(() => {
    cargarProductos();
  }, []);

  useEffect(() => {
    // cada vez que cambian los filtros se recargan (filtrado por backend)
    cargarProductos();
  }, [filtros]);

  // Calcular valores en tiempo real cuando cambian costo, cantidad o el override manual
  useEffect(() => {
    if (formulario.costo && formulario.cantidad) {
      calcularValoresPreview();
    } else {
      setCalculosPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario.costo, formulario.cantidad, formulario.cantidadPorDolar]);

  const calcularValoresPreview = async () => {
    try {
      setValidandoRentabilidad(true);

      // pasar el override manual si existe
      const manual = formulario.cantidadPorDolar !== '' ? formulario.cantidadPorDolar : null;

      const preview = await mercadoService.calcularPreview(
        formulario.costo,
        formulario.cantidad,
        manual
      );

      // Asegurar que los campos existen y convertir a números
      const safePreview = {
        costoUnitario: Number(preview.costoUnitario ?? preview.costo_unitario ?? 0),
        ventaPorUnidad: Number(preview.ventaPorUnidad ?? preview.venta_por_unidad ?? 0),
        cantidadPorDolar: Number(preview.cantidadPorDolar ?? preview.cantidad_por_dolar ?? 0),
        rentabilidad: Number(preview.rentabilidad ?? 0),
        rentabilidadValida: !!preview.rentabilidadValida,
        mensaje: preview.mensaje ?? ''
      };

      setCalculosPreview(safePreview);
    } catch (error) {
      console.error('Error al calcular preview:', error);
      setCalculosPreview(null);
    } finally {
      setValidandoRentabilidad(false);
    }
  };

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await mercadoService.getProductos(filtros);

      // Normalizar la respuesta para usar propiedades amigables
      const normalized = data.productos.map(normalizeProducto);
      setProductos(normalized);

      // Estadisticas (ya vienen del backend, solo aseguramos tipos)
      setEstadisticas({
        total: data.estadisticas.total || 0,
        totalInvertido: Number(data.estadisticas.totalInvertido || 0),
        promedioRentabilidad: Number(data.estadisticas.promedioRentabilidad || 0),
        porUnidad: data.estadisticas.porUnidad || 0,
        porLibra: data.estadisticas.porLibra || 0,
        activos: data.estadisticas.activos || 0,
        vendidos: data.estadisticas.vendidos || 0
      });
    } catch (error) {
      showNotification('error', 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  // Guardar producto (ahora NO bloquea por rentabilidad; solo muestra advertencia)
  const handleSubmit = async () => {
    if (!formulario.nombre || !formulario.costo || !formulario.cantidad) {
      showNotification('error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);

      // Prepare payload con posible cantidadPorDolar manual
      const payload = {
        fecha: formulario.fecha,
        nombre: formulario.nombre,
        costo: Number(formulario.costo),
        tipoVenta: formulario.tipoVenta,
        cantidad: Number(formulario.cantidad)
      };
        if (formulario.cantidadPorDolar !== '' && formulario.cantidadPorDolar !== null) {
        payload.cantidadPorDolar = Number(formulario.cantidadPorDolar);
        }

      if (editando) {
        // actualizar
        const updated = await mercadoService.actualizarProducto(editando.id, payload);
        // actualizar en state (map)
        setProductos(prev => prev.map(p => p.id === updated.id ? normalizeProducto(updated) : p));
        showNotification('success', 'Producto actualizado correctamente');
      } else {
        // crear (no bloquea por rentabilidad) y añadir inmediatamente al state
        const created = await mercadoService.crearProducto(payload);

        // created puede devolver valores calculados y advertencia según backend
        const createdNormalized = normalizeProducto(created);
        setProductos(prev => [createdNormalized, ...prev]); // añadir en top

        // mostrar mensaje informando si hay advertencia
        if (created.advertencia) {
          showNotification('warning', created.advertencia);
        } else {
          showNotification('success', 'Producto registrado correctamente');
        }
      }

      resetFormulario();
      setMostrarModal(false);
      // no es obligatorio recargar, pero podríamos forzar un refresh si quieres
      // cargarProductos();
    } catch (error) {
      console.error(error);
      const mensaje = error?.response?.data?.message || error?.response?.data?.error || 'Error al guardar';
      showNotification('error', mensaje);
      // si algo salió mal, recargar para asegurar consistencia
      cargarProductos();
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (item) => {
    setEditando(item);
    setFormulario({
      fecha: item.fecha.split('T')[0],
      nombre: item.nombre,
      costo: item.costo,
      tipoVenta: item.tipoVenta,
      cantidad: item.cantidad,
      cantidadPorDolar: item.cantidadPorDolar ?? '' // si venía del backend
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;

    try {
      await mercadoService.eliminarProducto(id);
      showNotification('success', 'Producto eliminado');
      setProductos(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      showNotification('error', 'Error al eliminar');
      cargarProductos();
    }
  };

  const handleMarcarVendido = async (id) => {
    if (!window.confirm('¿Marcar este producto como vendido?')) return;

    try {
      await mercadoService.marcarVendido(id);
      showNotification('success', 'Producto marcado como vendido');
      // actualizar en lista
      setProductos(prev => prev.map(p => p.id === id ? { ...p, vendido: true, activo: false } : p));
    } catch (error) {
      showNotification('error', 'Error al marcar como vendido');
      cargarProductos();
    }
  };

  const resetFormulario = () => {
    setFormulario({
      fecha: fechaLocal(),
      nombre: '',
      costo: '',
      tipoVenta: 'unidad',
      cantidad: '',
      cantidadPorDolar: ''
    });
    setEditando(null);
    setCalculosPreview(null);
  };

  const getRentabilidadColor = (rentabilidad) => {
    const valor = Number(rentabilidad);
    if (isNaN(valor)) return 'text-gray-600';
    if (valor >= 0.40) return 'text-green-600';
    if (valor >= 0.333333) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
              Gestión de Mercado
            </h1>
            <p className="text-gray-600 text-sm">Control de frutas y verduras con cálculo automático de rentabilidad</p>
          </div>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-red-700 transition-all shadow-lg text-sm"
          >
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Costo Total</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">{formatCurrency(Number(estadisticas.totalInvertido))}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full p-3 shadow-lg">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Rentabilidad Promedio</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{(Number(estadisticas.promedioRentabilidad) * 100).toFixed(2)}%</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-3 shadow-lg">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Total Productos</p>
              <p className="text-2xl font-bold text-gray-800 mt-2">{estadisticas.total}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-3 shadow-lg">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Por Unidad</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{estadisticas.porUnidad}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full p-3 shadow-lg">
              <ShoppingCart className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium uppercase">Por Libra</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{estadisticas.porLibra}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full p-3 shadow-lg">
              <ShoppingCart className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Venta</label>
            <select
              value={filtros.tipoVenta}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoVenta: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos</option>
              <option value="unidad">Por Unidad</option>
              <option value="libra">Por Libra</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.activo}
              onChange={(e) => setFiltros(prev => ({ ...prev, activo: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
        <div className="overflow-x-auto">
          {loading && productos.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-orange-600" size={48} />
            </div>
          ) : productos.length === 0 ? (
            <div className="text-center p-12">
              <ShoppingCart className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay productos registrados</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-4 text-left text-sm">Fecha</th>
                  <th className="px-4 py-4 text-left text-sm">Producto</th>
                  <th className="px-4 py-4 text-right text-sm">Costo</th>
                  <th className="px-4 py-4 text-right text-sm">Cantidad</th>
                  <th className="px-4 py-4 text-right text-sm">Costo Unit.</th>
                  <th className="px-4 py-4 text-right text-sm">Venta Unit.</th>
                  <th className="px-4 py-4 text-right text-sm">Cant. x $1</th>
                  <th className="px-4 py-4 text-right text-sm">Rentabilidad</th>
                  <th className="px-4 py-4 text-center text-sm">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((item, index) => (
                  <tr key={item.id} className={`border-b hover:bg-orange-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-4 py-3 text-sm">{formatDateShort(item.fecha)}</td>
                    <td className="px-4 py-3 font-semibold text-sm">{item.nombre}</td>
                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(Number(item.costo))}</td>
                    <td className="px-4 py-3 text-right text-sm">{Number(item.cantidad).toFixed(2)}</td>

                    {/* Mostrar 5 decimales en cálculos */}
                    <td className="px-4 py-3 text-right text-sm">{Number(item.costoUnitario ?? 0).toFixed(5)}</td>
                    <td className="px-4 py-3 text-right text-sm">{Number(item.ventaPorUnidad ?? 0).toFixed(5)}</td>
                    <td className="px-4 py-3 text-right text-sm">{Number(item.cantidadPorDolar ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-sm ${getRentabilidadColor(item.rentabilidad)}`}>
                        {Number(item.rentabilidad).toFixed(5)}
                    </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        {!item.vendido && (
                          <button
                            onClick={() => handleMarcarVendido(item.id)}
                            className="p-1.5 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            title="Marcar vendido"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditar(item)}
                          className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleEliminar(item.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        >
                          <Trash2 size={16} />
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

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 md:p-6 text-white">
              <h2 className="text-xl md:text-2xl font-bold">{editando ? 'Editar' : 'Nuevo'} Producto del Mercado</h2>
              <p className="text-blue-100 text-sm mt-1">Los cálculos se actualizan automáticamente</p>
            </div>

            <div className="p-6">
              {/* Formulario */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={18} />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formulario.fecha}
                    onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Producto</label>
                  <input
                    type="text"
                    value={formulario.nombre}
                    onChange={(e) => setFormulario(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: Tomate, Naranja..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <DollarSign className="inline mr-2" size={18} />
                    Costo Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.costo}
                    onChange={(e) => setFormulario(prev => ({ ...prev, costo: e.target.value }))} // mantiene string hasta submit
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Venta</label>
                  <select
                    value={formulario.tipoVenta}
                    onChange={(e) => setFormulario(prev => ({ ...prev, tipoVenta: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="unidad">Por Unidad</option>
                    <option value="libra">Por Libra</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cantidad {formulario.tipoVenta === 'libra' ? '(en libras)' : '(en unidades)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.cantidad}
                    onChange={(e) => setFormulario(prev => ({ ...prev, cantidad: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="0.00"
                  />
                </div>

                {/* NUEVO: campo para probar cantidad por dolar manualmente */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cantidad por $1 (manual) — opcional
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    value={formulario.cantidadPorDolar}
                    onChange={(e) => setFormulario(prev => ({ ...prev, cantidadPorDolar: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Ej: 14.28571 (opcional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Si dejas vacío el sistema calcula automáticamente la cantidad por $1</p>
                </div>
              </div>

              {/* Panel de Cálculos en Tiempo Real */}
              {calculosPreview && (
                <div className={`p-6 rounded-xl mb-6 border-2 ${calculosPreview.rentabilidadValida ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      {calculosPreview.rentabilidadValida ? (
                        <CheckCircle2 className="text-green-600" size={24} />
                      ) : (
                        <AlertTriangle className="text-red-600" size={24} />
                      )}
                      Cálculos Automáticos
                    </h3>
                    {validandoRentabilidad && <Loader className="animate-spin text-orange-600" size={20} />}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Costo Unitario</p>
                      <p className="text-lg font-bold text-gray-800">{Number(calculosPreview.costoUnitario).toFixed(5)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Venta por Unidad (+50%)</p>
                      <p className="text-lg font-bold text-green-600">{Number(calculosPreview.ventaPorUnidad).toFixed(5)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Cantidad por $1</p>
                      <p className="text-lg font-bold text-blue-600">{Number(calculosPreview.cantidadPorDolar).toFixed(5)}</p>
                    </div>

                    <div className="bg-white p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Rentabilidad</p>
                        <p className={`text-lg font-bold ${calculosPreview.rentabilidadValida ? 'text-green-600' : 'text-red-600'}`}>
                        {Number(calculosPreview.rentabilidad).toFixed(5)}
                        </p>
                    </div>
                  </div>

                  <div className={`mt-4 p-3 rounded-lg ${calculosPreview.rentabilidadValida ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p className={`text-sm font-semibold ${calculosPreview.rentabilidadValida ? 'text-green-800' : 'text-red-800'}`}>
                      {calculosPreview.mensaje}
                    </p>
                    {!calculosPreview.rentabilidadValida && (
                      <p className="text-xs text-red-700 mt-1">
                        Prueba con otra cantidad por $1 (campo opcional) para ver si mejora la rentabilidad.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:to-red-700'}`}
                >
                  {loading ? 'Guardando...' : editando ? 'Actualizar Producto' : 'Guardar Producto'}
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
    </div>
  );
};

export default MercadoComponent;