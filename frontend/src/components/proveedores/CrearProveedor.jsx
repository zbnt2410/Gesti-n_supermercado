import { useEffect, useMemo, useState } from "react";
import { UserPlus, Mail, Phone, Search, IdCard, Edit2, Trash2, Loader, Check, X } from "lucide-react";
import { proveedoresService } from "../../services/proveedoresService";

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

const CrearProveedor = () => {
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    cedula: ""
  });

  // 👇 FUNCIÓN PARA MOSTRAR NOTIFICACIONES
  const showNotification = (type, message) => {
    setNotification({ type, message });
  };

  /* =====================
     Cargar proveedores
  ===================== */
  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch {
      showNotification('error', 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, []);

  /* =====================
     Filtro
  ===================== */
  const proveedoresFiltrados = useMemo(() => {
    return proveedores.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [proveedores, busqueda]);

  /* =====================
     Handlers
  ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      return showNotification('error', 'El nombre del proveedor es obligatorio');
    }

    try {
      setLoading(true);
      if (proveedorEditando) {
        await proveedoresService.actualizarProveedor(proveedorEditando, formData);
        showNotification('success', 'Proveedor actualizado correctamente');
        setProveedorEditando(null);
      } else {
        const nuevo = await proveedoresService.crearProveedor(formData);
        setProveedores((prev) => [nuevo, ...prev]);
        showNotification('success', 'Proveedor creado correctamente');
      }
      setFormData({ nombre: "", contacto: "", telefono: "", cedula: "" });
      cargarProveedores();
    } catch {
      showNotification('error', 'Error al guardar proveedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return;

    try {
      await proveedoresService.eliminarProveedor(id);
      showNotification('success', 'Proveedor eliminado correctamente');
      cargarProveedores();
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Error al eliminar proveedor');
    }
  };

  const resetFormulario = () => {
    setFormData({ nombre: "", contacto: "", telefono: "", cedula: "" });
    setProveedorEditando(null);
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

      {/* 👇 HEADER - IGUAL QUE PEDIDOS */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Gestión de Proveedores
            </h1>
            <p className="text-gray-600">Registro y administración de proveedores</p>
          </div>
        </div>
      </div>

      {/* 👇 CARD FORMULARIO - ESTILO PEDIDOS */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-full shadow-lg">
            <UserPlus className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
            </h2>
            <p className="text-gray-500 text-sm">
              {proveedorEditando
                ? "Actualiza los datos del proveedor"
                : "Registra un nuevo proveedor en el sistema"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nombre del Proveedor *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Distribuidora XYZ"
              />
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <Mail className="inline mr-2" size={16} />
                Contacto
              </label>
              <input
                type="text"
                name="contacto"
                value={formData.contacto}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Email o nombre"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                <IdCard className="inline mr-2" size={16} />
                Cédula / RUC
              </label>
              <input
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0000000000001"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Guardando...' : proveedorEditando ? 'Actualizar Proveedor' : 'Crear Proveedor'}
            </button>

            {proveedorEditando && (
              <button
                type="button"
                onClick={resetFormulario}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* TABLA*/}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Proveedores Registrados</h3>

          <div className="relative w-64">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proveedor..."
              className="w-full pl-10 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && proveedores.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-blue-600" size={48} />
            </div>
          ) : proveedoresFiltrados.length === 0 ? (
            <div className="text-center p-12">
              <UserPlus className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">No hay proveedores registrados</p>
            </div>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Nombre</th>
                  <th className="px-6 py-4 text-left">Contacto</th>
                  <th className="px-6 py-4 text-left">Cédula / RUC</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {proveedoresFiltrados.map((p, index) => (
                  <tr
                    key={p.id}
                    className={`border-b hover:bg-blue-50 transition-colors ${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4 font-semibold">{p.nombre}</td>
                    <td className="px-6 py-4">{p.contacto || "-"}</td>
                    <td className="px-6 py-4">{p.telefono || "-"}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setFormData({
                              nombre: p.nombre,
                              contacto: p.contacto || "",
                              telefono: p.telefono || "",
                              cedula: p.cedula || ""
                            });
                            setProveedorEditando(p.id);
                          }}
                          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          onClick={() => handleEliminar(p.id)}
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
    </div>
  );
};

export default CrearProveedor;