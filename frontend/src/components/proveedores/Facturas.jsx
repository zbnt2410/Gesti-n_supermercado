import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Edit2, 
  Trash2, 
  Calendar, 
  CheckCircle, 
  X, 
  Clock, 
  AlertTriangle, 
  Loader, 
  Check,
  Upload,
  Filter,
  User,
  DollarSign
} from 'lucide-react';
import { proveedoresService } from '../../services/proveedoresService';
import { usuariosService } from '../../services/usuariosService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';

// 👇 COMPONENTE DE NOTIFICACIÓN - IGUAL QUE PEDIDOS
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

const Facturas = () => {
  const [proveedores, setProveedores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [facturaEditando, setFacturaEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroSubida, setFiltroSubida] = useState("");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");
  const [busqueda, setBusqueda] = useState("");
  
  const [formData, setFormData] = useState({
    proveedor_id: '',
    numero_documento: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    monto: '',
    subida_sistema: false,
    usuario_subida: '',
    recibido_por: '',
    notas: ''
  });

  // 👇 FUNCIÓN PARA MOSTRAR NOTIFICACIONES
  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  // Cargar proveedores, usuarios y facturas
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const provs = await proveedoresService.getProveedores({ activo: 'true' });
        setProveedores(provs);

        const usrs = await usuariosService.getUsuariosActivos();
        setUsuarios(Array.isArray(usrs) ? usrs : []);

        const facs = await proveedoresService.getFacturas();
        setFacturas(Array.isArray(facs) ? facs : []);
      } catch (error) {
        console.error("Error cargando datos:", error);
        showNotification('error', 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (facturaEditando) {
        await proveedoresService.actualizarFactura(facturaEditando, formData);
        showNotification('success', 'Factura actualizada correctamente');
        setFacturaEditando(null);
      } else {
        await proveedoresService.crearFactura(formData);
        showNotification('success', 'Factura registrada correctamente');
      }
      setFacturas(await proveedoresService.getFacturas());
      setFormData({
        proveedor_id: '',
        numero_documento: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        monto: '',
        subida_sistema: false,
        usuario_subida: '',
        recibido_por: '',
        notas: ''
      });
      setMostrarModal(false);
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error al guardar factura');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta factura?')) return;
    
    try {
      await proveedoresService.eliminarFactura(id);
      showNotification('success', 'Factura eliminada');
      setFacturas(await proveedoresService.getFacturas());
    } catch (error) {
      showNotification('error', 'Error al eliminar');
    }
  };

  const handleEditar = (f) => {
    setFormData({
      proveedor_id: f.proveedor_id,
      numero_documento: f.numero_documento,
      fecha_emision: f.fecha_emision.split('T')[0],
      monto: f.monto,
      subida_sistema: f.subida_sistema,
      usuario_subida: f.usuario_subida || '',
      recibido_por: f.recibido_por || '',
      notas: f.notas || ''
    });
    setFacturaEditando(f.id);
    setMostrarModal(true);
  };

  const resetFormulario = () => {
    setFormData({
      proveedor_id: '',
      numero_documento: '',
      fecha_emision: new Date().toISOString().split('T')[0],
      monto: '',
      subida_sistema: false,
      usuario_subida: '',
      recibido_por: '',
      notas: ''
    });
    setFacturaEditando(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-rose-50">
      {/* 👇 NOTIFICACIÓN */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/*HEADER*/}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Control de Facturas y DNAs
            </h1>
            <p className="text-gray-600">Registro y seguimiento de documentos recibidos</p>
          </div>
          <button
            onClick={() => {
              resetFormulario();
              setMostrarModal(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
          >
            <Plus size={20} />
            Registrar Documento
          </button>
        </div>
      </div>

        {/*FILTROS */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Proveedor</label>
            <select
                value={filtroProveedor}
                onChange={(e) => setFiltroProveedor(e.target.value)}
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
                value={filtroSubida}
                onChange={(e) => setFiltroSubida(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
                <option value="">Todas</option>
                <option value="true">Subidas</option>
                <option value="false">Pendientes</option>
            </select>
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Desde</label>
            <input
                type="date"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Hasta</label>
            <input
                type="date"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            </div>

            <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
            <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nº documento o proveedor..."
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            </div>

            {/* Botón Filtrar con estilo igual que los inputs */}
            <div className="flex items-end">
            <button
                onClick={async () => {
                const data = await proveedoresService.getFacturas({
                    proveedor_id: filtroProveedor,
                    subida_sistema: filtroSubida,
                    fecha_desde: filtroDesde,
                    fecha_hasta: filtroHasta,
                    busqueda
                });
                setFacturas(data);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 transition-all"
            >
                Filtrar
            </button>
            </div>
        </div>
        </div>

      {/* 👇 TABLA - IGUAL QUE PEDIDOS */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading && facturas.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
          ) : facturas.length === 0 ? (
            <div className="text-center p-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay facturas registradas</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Nº Documento</th>
                  <th className="px-6 py-4 text-left">Proveedor</th>
                  <th className="px-6 py-4 text-left">Fecha Emisión</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f, index) => (
                  <tr key={f.id} className={`border-b hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                    <td className="px-6 py-4 font-semibold">{f.numero_documento}</td>
                    <td className="px-6 py-4">{f.proveedores?.nombre}</td>
                    <td className="px-6 py-4">{formatDateShort(f.fecha_emision)}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      {formatCurrency(parseFloat(f.monto))}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {f.subida_sistema ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-1 justify-center">
                          <CheckCircle size={16} />
                          Subida
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold flex items-center gap-1 justify-center">
                          <Clock size={16} />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {f.subida_sistema ? (
                          <button
                            onClick={async () => {
                              await proveedoresService.desmarcarSubida(f.id);
                              setFacturas(await proveedoresService.getFacturas());
                              showNotification('success', 'Desmarcada del sistema');
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                            title="Desmarcar subida"
                          >
                            <X size={18} />
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await proveedoresService.marcarComoSubida(f.id, formData.usuario_subida);
                              setFacturas(await proveedoresService.getFacturas());
                              showNotification('success', 'Marcada como subida');
                            }}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                            title="Marcar como subida"
                          >
                            <Upload size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditar(f)}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleEliminar(f.id)}
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

      {/* 👇 MODAL - IGUAL QUE PEDIDOS */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">
                {facturaEditando ? 'Editar' : 'Registrar'} Factura
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Proveedor *</label>
                    <select
                      name="proveedor_id"
                      value={formData.proveedor_id}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione proveedor</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nº Documento *</label>
                    <input
                      type="text"
                      name="numero_documento"
                      placeholder="001-001-0000001"
                      value={formData.numero_documento}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <Calendar className="inline mr-2" size={18} />
                      Fecha Emisión *
                    </label>
                    <input
                      type="date"
                      name="fecha_emision"
                      value={formData.fecha_emision}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      <DollarSign className="inline mr-2" size={18} />
                      Monto *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="monto"
                      placeholder="0.00"
                      value={formData.monto}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Usuario que Recibió *</label>
                    <select
                      name="recibido_por"
                      value={formData.recibido_por}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione usuario</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Usuario que Subió</label>
                    <select
                      name="usuario_subida"
                      value={formData.usuario_subida}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione usuario</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="subida_sistema"
                    checked={formData.subida_sistema}
                    onChange={handleChange}
                    className="w-5 h-5 text-blue-600"
                  />
                  <label className="text-sm font-bold text-gray-700">¿Factura subida al sistema?</label>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Notas (Opcional)</label>
                  <textarea
                    name="notas"
                    placeholder="Observaciones adicionales..."
                    value={formData.notas}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : facturaEditando ? 'Actualizar' : 'Registrar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModal(false);
                      resetFormulario();
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturas;