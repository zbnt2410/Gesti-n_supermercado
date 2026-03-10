import { useEffect, useState, useCallback, useMemo } from "react";
import { CalendarDays, Save, CheckCircle, XCircle } from "lucide-react";
import { proveedoresService } from "../../services/proveedoresService";

/* =====================
   Constantes
===================== */
const DIAS_SEMANA = [
  { id: 0, nombre: "Domingo" },
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
];

const DiasPedido = () => {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState([]);
  const [proveedoresConPedido, setProveedoresConPedido] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarProveedores = useCallback(async () => {
    try {
      const data = await proveedoresService.getProveedores();
      setProveedores(data);
    } catch {
      setMensaje({ texto: "Error al cargar proveedores", tipo: "error" });
    }
  }, []);

  useEffect(() => {
    cargarProveedores();
  }, [cargarProveedores]);

  const toggleDia = (diaId) => {
    setDiasSeleccionados((prev) =>
      prev.includes(diaId)
        ? prev.filter((d) => d !== diaId)
        : [...prev, diaId]
    );
  };

  const seleccionarProveedor = (id) => {
    const proveedor = proveedores.find((p) => p.id === Number(id));
    setProveedorSeleccionado(proveedor || null);
    setDiasSeleccionados(
      proveedor?.diasPedido?.map((d) => d.diaSemana) || []
    );
  };

  const proveedoresFiltrados = useMemo(() => {
  return proveedores.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  }, [proveedores, busqueda]);

  const guardarConfiguracion = async () => {
    if (!proveedorSeleccionado) return;

    try {
      setLoading(true);
      await proveedoresService.configurarDiasPedido(
        proveedorSeleccionado.id,
        diasSeleccionados
      );
      setMensaje({ texto: "Configuración guardada", tipo: "success" });
      cargarProveedores();
    } catch {
      setMensaje({ texto: "Error al guardar", tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
          Días de Pedido
        </h1>
        <p className="text-gray-600">
          Configuración semanal de pedidos por proveedor
        </p>
      </div>

      {/* CARD CONFIGURACIÓN */}
      <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-4 rounded-full">
            <CalendarDays className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Configuración de proveedor
            </h2>
            <p className="text-gray-500 text-sm">
              Selecciona los días en los que se realiza pedido
            </p>
          </div>
        </div>

        <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Buscar proveedor
        </label>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Escriba el nombre..."
          className="w-64 px-2 py-1.5 text-sm border border-gray-300 rounded-lg
                    focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <select
        className="w-64 px-2 py-1.5 text-sm border border-gray-300 rounded-lg
                  focus:ring-2 focus:ring-blue-500 mb-4"
        value={proveedorSeleccionado?.id || ""}
        onChange={(e) => seleccionarProveedor(e.target.value)}
      >
        <option value="">Seleccionar proveedor</option>
        {proveedoresFiltrados.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </select>

        {proveedorSeleccionado && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {DIAS_SEMANA.map((dia) => {
                const activo = diasSeleccionados.includes(dia.id);
                return (
                  <button
                    key={dia.id}
                    onClick={() => toggleDia(dia.id)}
                    className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                      ${
                        activo
                          ? "bg-green-500 text-white shadow-lg"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                  >
                    {activo ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    {dia.nombre}
                  </button>
                );
              })}
            </div>

            <button
            onClick={guardarConfiguracion}
            disabled={loading}
            className="w-64 bg-gradient-to-r from-blue-600 to-indigo-600 text-white
                        py-1.5 text-sm font-semibold rounded-lg
                        hover:from-green-700 hover:to-blue-700
                        transition-all shadow-md"
            >
            {loading ? "Guardando..." : "Guardar configuración"}
            </button>

          </>
        )}

        {mensaje && (
          <p
            className={`mt-4 font-semibold ${
              mensaje.tipo === "success"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {mensaje.texto}
          </p>
        )}
      </div>

      {/* TABLA CALENDARIO */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full table-fixed">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              <th className="px-6 py-4 text-left">Proveedor</th>
              {DIAS_SEMANA.map((d) => (
                <th key={d.id} className="px-4 py-4 text-center">
                  {d.nombre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proveedoresFiltrados.map((p, index) => (
              <tr
                key={p.id}
                className={`border-b transition-colors hover:bg-purple-50 ${
                  index % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <td className="px-6 py-4 font-semibold">{p.nombre}</td>

                {DIAS_SEMANA.map((d) => {
                  const activo = p.diasPedido?.some(
                    (x) => x.diaSemana === d.id && x.activo
                  );
                  const marcado = proveedoresConPedido.includes(p.id);

                  return (
                    <td key={d.id} className="px-4 py-4 text-center">
                      {activo && (
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() =>
                            setProveedoresConPedido((prev) =>
                              prev.includes(p.id)
                                ? prev.filter((id) => id !== p.id)
                                : [...prev, p.id]
                            )
                          }
                          className={`w-5 h-5 rounded cursor-pointer accent-${
                            marcado ? "green" : "red"
                          }-500`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DiasPedido;
