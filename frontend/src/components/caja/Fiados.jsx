import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Edit2, Trash2, Calendar, DollarSign, Loader, X,
  Check, CheckCircle, User, CreditCard, ChevronDown, ChevronUp, History, AlertCircle,
  Globe, Eye
} from 'lucide-react';
import { cajaService } from '../../services/cajaService';
import { formatCurrency, formatDateShort } from '../../utils/formatters';


const fechaLocal = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─────────────────────────────────────────────
// Componente de notificación
// ─────────────────────────────────────────────
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-green-100 border-green-500 text-green-800',
    error: 'bg-red-100 border-red-500 text-red-800',
    info: 'bg-blue-100 border-blue-500 text-blue-800'
  };

  return (
    <div className={`fixed top-6 right-6 z-50 border-l-4 p-4 rounded-lg shadow-xl ${styles[type]} animate-slide-in`}>
      <div className="flex items-center gap-3">
        {type === 'success' ? <Check size={20} /> : type === 'info' ? <AlertCircle size={20} /> : <X size={20} />}
        <p className="font-semibold">{message}</p>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal para registrar un Abono
// ─────────────────────────────────────────────
const ModalAbono = ({ personas, onClose, onSuccess, showNotification }) => {
  const [paso, setPaso] = useState(1); // 1: seleccionar persona, 2: confirmar
  const [nombrePersona, setNombrePersona] = useState('');
  const [tipoPersona, setTipoPersona] = useState('cliente');
  const [monto, setMonto] = useState('');
  const [notas, setNotas] = useState('');
  const [fecha, setFecha] = useState(fechaLocal());
  const [resumen, setResumen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Previsualizar qué fiados se cubrirían con el monto ingresado
  useEffect(() => {
    if (!resumen || !monto || parseFloat(monto) <= 0) {
      setPreview(null);
      return;
    }

    let saldo = parseFloat(monto);
    const cubiertos = [];
    const pendientes = [];

    for (const f of resumen.fiadosPendientes) {
      const montoF = parseFloat(f.monto);
      if (saldo >= montoF) {
        cubiertos.push(f);
        saldo -= montoF;
      } else {
        pendientes.push(f);
      }
    }

    const totalDeuda = parseFloat(resumen.totalDeuda);
    const montoAbono = parseFloat(monto);

    setPreview({
      cubiertos,
      pendientes,
      montoAplicado: Math.min(montoAbono, totalDeuda),
      deudaRestante: Math.max(0, totalDeuda - montoAbono),
      exceso: Math.max(0, montoAbono - totalDeuda)
    });
  }, [monto, resumen]);

  const buscarResumen = async () => {
    if (!nombrePersona.trim()) {
      showNotification('error', 'Ingresa el nombre de la persona');
      return;
    }
    try {
      setLoading(true);
      const data = await cajaService.getResumenPersona(nombrePersona);
      setResumen(data);
      setTipoPersona(data.fiadosPendientes[0]?.tipoPersona || 'cliente');
      setPaso(2);
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'No se encontraron fiados pendientes para esta persona');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!monto || parseFloat(monto) <= 0) {
      showNotification('error', 'Ingresa un monto válido');
      return;
    }

    try {
      setLoading(true);
      const resultado = await cajaService.crearAbono({
        fecha,
        monto: parseFloat(monto),
        nombrePersona,
        tipoPersona,
        notas
      });

      const { resumen: res } = resultado;
      showNotification('success',
        `Abono registrado: ${res.fiadosCubiertos} fiado(s) cubierto(s). Deuda restante: ${formatCurrency(res.deudaRestante)}`
      );
      onSuccess();
      onClose();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };

  const getTipoColor = (tipo) => {
    const colores = {
      empleado: 'bg-blue-100 text-blue-800',
      cliente: 'bg-purple-100 text-purple-800',
      jefe: 'bg-orange-100 text-orange-800'
    };
    return colores[tipo] || colores.cliente;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={28} />
              <div>
                <h2 className="text-2xl font-bold">Registrar Abono</h2>
                <p className="text-emerald-100 text-sm">
                  {paso === 1 ? 'Paso 1: Selecciona la persona' : `Paso 2: Monto a abonar — ${nombrePersona}`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-emerald-200">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* PASO 1: Seleccionar persona */}
          {paso === 1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <User className="inline mr-2" size={16} />
                  Nombre de la Persona
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nombrePersona}
                    onChange={(e) => setNombrePersona(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && buscarResumen()}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Nombre exacto de la persona..."
                    list="lista-personas"
                  />
                  <datalist id="lista-personas">
                    {personas.map(p => <option key={p} value={p} />)}
                  </datalist>
                  <button
                    onClick={buscarResumen}
                    disabled={loading}
                    className="px-5 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {loading ? <Loader size={18} className="animate-spin" /> : 'Buscar'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Ingresa el nombre tal como aparece en los fiados</p>
              </div>
            </>
          )}

          {/* PASO 2: Monto + preview */}
          {paso === 2 && resumen && (
            <>
              {/* Resumen de deuda */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600 font-semibold uppercase">Deuda total pendiente</p>
                    <p className="text-3xl font-bold text-red-700">{formatCurrency(parseFloat(resumen.totalDeuda))}</p>
                    <p className="text-xs text-red-500 mt-1">{resumen.cantidadFiados} fiado(s) pendiente(s)</p>
                  </div>
                  <div className="bg-red-100 rounded-full p-4">
                    <DollarSign className="text-red-600" size={32} />
                  </div>
                </div>
              </div>

              {/* Campos del abono */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Calendar className="inline mr-2" size={16} />
                    Fecha del Abono
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <DollarSign className="inline mr-2" size={16} />
                    Monto del Abono
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Notas (opcional)</label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  rows="2"
                  placeholder="Observaciones del abono..."
                />
              </div>

              {/* Preview de fiados cubiertos */}
              {preview && (
                <div className="border-2 border-emerald-200 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
                    <h4 className="font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCircle size={18} />
                      Vista previa del abono
                    </h4>
                  </div>

                  {/* Barra de progreso */}
                  <div className="px-4 pt-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Monto aplicado: {formatCurrency(preview.montoAplicado)}</span>
                      <span>Deuda restante: {formatCurrency(preview.deudaRestante)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (preview.montoAplicado / parseFloat(resumen.totalDeuda)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {/* Fiados que se cubrirán */}
                    {preview.cubiertos.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-1">
                          <Check size={14} /> {preview.cubiertos.length} fiado(s) que quedarán cubiertos
                        </p>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {preview.cubiertos.map(f => (
                            <div key={f.id} className="flex justify-between items-center bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-200">
                              <div className="flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-600 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-gray-700 line-through decoration-emerald-500">
                                    {f.descripcion}
                                  </p>
                                  <p className="text-xs text-gray-500">{formatDateShort(f.fecha)}</p>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-emerald-700">{formatCurrency(parseFloat(f.monto))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fiados que quedan pendientes */}
                    {preview.pendientes.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-red-600 uppercase mb-2 flex items-center gap-1">
                          <AlertCircle size={14} /> {preview.pendientes.length} fiado(s) que quedan pendientes
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {preview.pendientes.map(f => (
                            <div key={f.id} className="flex justify-between items-center bg-red-50 rounded-lg px-3 py-2 border border-red-200">
                              <div>
                                <p className="text-xs font-semibold text-gray-700">{f.descripcion}</p>
                                <p className="text-xs text-gray-500">{formatDateShort(f.fecha)}</p>
                              </div>
                              <span className="text-sm font-bold text-red-600">{formatCurrency(parseFloat(f.monto))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Exceso */}
                    {preview.exceso > 0 && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                        <p className="text-sm text-yellow-800 font-semibold">
                          ⚠️ El abono supera la deuda total. Exceso: {formatCurrency(preview.exceso)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setPaso(1); setResumen(null); setPreview(null); setMonto(''); }}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300"
                >
                  ← Volver
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !monto || parseFloat(monto) <= 0 || !preview || preview.cubiertos.length === 0}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-bold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registrando...' : `Confirmar Abono de ${monto ? formatCurrency(parseFloat(monto)) : '$0.00'}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal historial de abonos de una persona
// ─────────────────────────────────────────────
const ModalHistorialAbonos = ({ nombrePersona, onClose, showNotification, onRefresh }) => {
  const [abonos, setAbonos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await cajaService.getAbonos({ nombrePersona });
        setAbonos(data.abonos);
      } catch {
        showNotification('error', 'Error al cargar historial de abonos');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [nombrePersona]);

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este abono? Los fiados cubiertos volverán a estado pendiente.')) return;
    try {
      await cajaService.eliminarAbono(id);
      setAbonos(prev => prev.filter(a => a.id !== id));
      showNotification('success', 'Abono eliminado. Los fiados volvieron a pendiente.');
      onRefresh();
    } catch {
      showNotification('error', 'Error al eliminar abono');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <History size={24} />
            <div>
              <h2 className="text-xl font-bold">Historial de Abonos</h2>
              <p className="text-indigo-200 text-sm">{nombrePersona}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-indigo-200"><X size={22} /></button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="animate-spin text-indigo-500" size={40} /></div>
          ) : abonos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No hay abonos registrados para esta persona</p>
            </div>
          ) : (
            <div className="space-y-3">
              {abonos.map(abono => (
                <div key={abono.id} className="border-2 border-indigo-100 rounded-xl overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-indigo-50 transition-colors"
                    onClick={() => setExpandido(expandido === abono.id ? null : abono.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 rounded-full p-2">
                        <CreditCard size={18} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{formatCurrency(parseFloat(abono.monto))}</p>
                        <p className="text-xs text-gray-500">{formatDateShort(abono.fecha)} · {abono.fiados?.length || 0} fiado(s) cubierto(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {parseFloat(abono.monto_restante || 0) > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-semibold">
                          Exceso: {formatCurrency(parseFloat(abono.monto_restante))}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEliminar(abono.id); }}
                        className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                        title="Eliminar abono"
                      >
                        <Trash2 size={15} />
                      </button>
                      {expandido === abono.id ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
                    </div>
                  </div>

                  {expandido === abono.id && (
                    <div className="border-t border-indigo-100 bg-gray-50 p-4 space-y-2">
                      {abono.notas && (
                        <p className="text-sm text-gray-600 italic mb-3">"{abono.notas}"</p>
                      )}
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Fiados cubiertos por este abono:</p>
                      {(!abono.fiados || abono.fiados.length === 0) ? (
                        <p className="text-sm text-gray-400">Sin fiados asociados</p>
                      ) : (
                        abono.fiados.map(f => (
                          <div key={f.id} className="flex justify-between items-center bg-white rounded-lg px-3 py-2 border border-emerald-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={14} className="text-emerald-500" />
                              <div>
                                <p className="text-xs font-semibold text-gray-700 line-through decoration-gray-400">{f.descripcion}</p>
                                <p className="text-xs text-gray-400">{formatDateShort(f.fecha)}</p>
                              </div>
                            </div>
                            <span className="text-sm font-bold text-gray-600">{formatCurrency(parseFloat(f.monto))}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// Utilidad: obtener usuario autenticado
// ─────────────────────────────────────────────
const getUsuarioActual = () => {
  try {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Fecha local del navegador (evita el bug de UTC que cambia de día a las 20:00 EC)

const FiadosComponent = () => {
  const [fiados, setFiados] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false);
  const [mostrarHistorialAbono, setMostrarHistorialAbono] = useState(null); // nombre de persona
  const [editando, setEditando] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0, totalPendiente: 0, totalPagado: 0,
    count: 0, pendientes: 0, pagados: 0, cubiertosAbono: 0, totalAbonadoParcial: 0
  });

  // ── Vista: 'mio' = pendientes registrados por mí | 'todos' = con filtros completos
  const usuarioActual = getUsuarioActual();
  const [vista, setVista] = useState('mio');

  const [filtros, setFiltros] = useState({
    fechaInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    fechaFin: fechaLocal(),
    turnoId: '',
    pagado: '',
    tipoPersona: '',
    nombrePersona: ''
  });

  const [formulario, setFormulario] = useState({
    fecha: fechaLocal(),
    descripcion: '',
    monto: '',
    nombrePersona: '',
    tipoPersona: 'cliente',
    turnoId: ''
  });

  useEffect(() => { cargarTurnos(); cargarFiados(); }, []);
  useEffect(() => { cargarFiados(); }, [filtros, vista]);

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

  const cargarFiados = async () => {
    try {
      setLoading(true);
      // Vista "mio": solo pendientes registrados por el usuario actual
      // Vista "todos": filtros completos sin restricción de usuario
      const params = vista === 'mio'
        ? { pagado: 'false', registradoPorId: usuarioActual?.id }
        : { ...filtros };
      const data = await cajaService.getFiados(params);
      setFiados(data.fiados);
      setEstadisticas({
        total: data.total,
        totalPendiente: data.totalPendiente,
        totalPagado: data.totalPagado,
        count: data.count,
        pendientes: data.pendientes,
        pagados: data.pagados,
        cubiertosAbono: data.cubiertosAbono || 0,
        totalAbonadoParcial: data.totalAbonadoParcial || 0
      });
    } catch {
      showNotification('error', 'Error al cargar fiados');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => setNotification({ type, message });

  const handleSubmit = async () => {
    if (!formulario.descripcion || !formulario.monto || !formulario.nombrePersona || !formulario.turnoId) {
      showNotification('error', 'Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      if (editando) {
        await cajaService.actualizarFiado(editando.id, formulario);
        showNotification('success', 'Fiado actualizado');
      } else {
        await cajaService.crearFiado(formulario);
        showNotification('success', 'Fiado registrado');
      }
      resetFormulario();
      setMostrarModal(false);
      cargarFiados();
    } catch (error) {
      showNotification('error', error.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarPagado = async (id) => {
    if (!window.confirm('¿Marcar este fiado como pagado (pago directo)?')) return;
    try {
      await cajaService.marcarFiadoPagado(id, fechaLocal());
      showNotification('success', 'Fiado marcado como pagado');
      cargarFiados();
    } catch {
      showNotification('error', 'Error al marcar como pagado');
    }
  };

  const handleEditar = (item) => {
    setEditando(item);
    setFormulario({
      fecha: item.fecha.split('T')[0],
      descripcion: item.descripcion,
      monto: item.monto,
      nombrePersona: item.nombrePersona,
      tipoPersona: item.tipoPersona || 'cliente',
      turnoId: item.turnoId
    });
    setMostrarModal(true);
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este fiado?')) return;
    try {
      await cajaService.eliminarFiado(id);
      showNotification('success', 'Fiado eliminado');
      cargarFiados();
    } catch {
      showNotification('error', 'Error al eliminar');
    }
  };

  const resetFormulario = () => {
    setFormulario({
      fecha: fechaLocal(),
      descripcion: '',
      monto: '',
      nombrePersona: '',
      tipoPersona: 'cliente',
      turnoId: turnos[0]?.id || ''
    });
    setEditando(null);
  };

  const getTipoColor = (tipo) => {
    const colores = {
      empleado: 'bg-blue-100 text-blue-800',
      cliente: 'bg-purple-100 text-purple-800',
      jefe: 'bg-orange-100 text-orange-800'
    };
    return colores[tipo] || colores.cliente;
  };

  // Lista de personas únicas para el autocomplete del modal de abono
  const personasUnicas = [...new Set(fiados.map(f => f.nombrePersona))].sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
              Gestión de Fiados
            </h1>
            <p className="text-gray-600">Control de créditos a empleados, clientes y jefe</p>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {/* Botón de Abono */}
            <button
              onClick={() => setMostrarModalAbono(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg text-sm md:text-base"
            >
              <CreditCard size={20} />
              Registrar Abono
            </button>
            <button
              onClick={() => setMostrarModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 md:px-6 md:py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg text-sm md:text-base"
            >
              <Plus size={20} />
              Nuevo Fiado
            </button>
          </div>
        </div>
      </div>

      {/* ── Toggle de vista ── */}
      <div className="bg-white rounded-2xl shadow-xl p-3 md:p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {vista === 'mio' ? (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2">
              <User size={16} className="text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">
                Mis fiados pendientes
                {usuarioActual?.nombre && (
                  <span className="font-normal text-indigo-500"> — {usuarioActual.nombre}</span>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
              <Globe size={16} className="text-purple-600" />
              <span className="text-sm font-semibold text-purple-700">Mostrando todos los fiados</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setVista(v => v === 'mio' ? 'todos' : 'mio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md ${
            vista === 'mio'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700'
              : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700'
          }`}
        >
          <Eye size={16} />
          {vista === 'mio' ? 'Ver todos los fiados' : 'Ver solo los míos pendientes'}
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5 mb-6 md:mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-5 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">{vista === 'mio' ? 'Mis Pendientes' : 'Pendiente'}</p>
              <p className="text-lg md:text-2xl font-bold text-red-600 mt-1">{formatCurrency(parseFloat(estadisticas.totalPendiente))}</p>
              <p className="text-xs text-gray-600 mt-1">{estadisticas.pendientes} fiados</p>
            </div>
            <div className="bg-gradient-to-br from-red-400 to-rose-500 rounded-full p-3 shadow-lg">
              <DollarSign className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-5 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Pagado (directo)</p>
              <p className="text-lg md:text-2xl font-bold text-green-600 mt-1">{formatCurrency(parseFloat(estadisticas.totalPagado))}</p>
              <p className="text-xs text-gray-600 mt-1">{estadisticas.pagados} fiados</p>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-full p-3 shadow-lg">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </div>

        {/* Cubiertos por abono */}
        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-5 border-l-4 border-teal-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Cubiertos por Abono</p>
              <p className="text-lg md:text-2xl font-bold text-teal-600 mt-1">{estadisticas.cubiertosAbono}</p>
              <p className="text-xs text-gray-600 mt-1">fiados saldados</p>
              {parseFloat(estadisticas.totalAbonadoParcial) > 0 && (
                <p className="text-xs text-orange-500 mt-0.5">
                  {formatCurrency(parseFloat(estadisticas.totalAbonadoParcial))} abonado parcial
                </p>
              )}
            </div>
            <div className="bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full p-3 shadow-lg">
              <CreditCard className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-5 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Deuda Real Pendiente</p>
              <p className="text-lg md:text-2xl font-bold text-purple-700 mt-1">{formatCurrency(parseFloat(estadisticas.totalPendiente))}</p>
              <p className="text-xs text-gray-400 mt-0.5">bruto: {formatCurrency(parseFloat(estadisticas.total))}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-full p-3 shadow-lg">
              <FileText className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-3 md:p-5 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium uppercase">Total Fiados</p>
              <p className="text-lg md:text-2xl font-bold text-gray-800 mt-1">{estadisticas.count}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full p-3 shadow-lg">
              <User className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros — solo en vista "todos" */}
      {vista === 'todos' && <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha Fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Turno</label>
            <select
              value={filtros.turnoId}
              onChange={(e) => setFiltros(prev => ({ ...prev, turnoId: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
            <select
              value={filtros.pagado}
              onChange={(e) => setFiltros(prev => ({ ...prev, pagado: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="false">Pendientes</option>
              <option value="true">Pagados</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
            <select
              value={filtros.tipoPersona}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipoPersona: e.target.value }))}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todos</option>
              <option value="empleado">Empleado</option>
              <option value="cliente">Cliente</option>
              <option value="jefe">Jefe</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Buscar por nombre</label>
            <input
              type="text"
              value={filtros.nombrePersona}
              onChange={(e) => setFiltros(prev => ({ ...prev, nombrePersona: e.target.value }))}
              placeholder="Ingrese nombre..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>}

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Cabecera de contexto */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vista === 'mio'
              ? <><User size={16} className="text-indigo-500" /><span className="text-sm font-semibold text-gray-600">Mis fiados pendientes</span></>
              : <><Globe size={16} className="text-purple-500" /><span className="text-sm font-semibold text-gray-600">Todos los fiados</span></>
            }
          </div>
          {loading && <Loader className="animate-spin text-purple-500" size={18} />}
        </div>
        <div className="overflow-x-auto">
          {loading && fiados.length === 0 ? (
            <div className="flex justify-center items-center p-12">
              <Loader className="animate-spin text-purple-600" size={48} />
            </div>
          ) : fiados.length === 0 ? (
            <div className="text-center p-12">
              <FileText className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-xl text-gray-600 font-semibold">
                {vista === 'mio' ? 'No tienes fiados pendientes registrados' : 'No hay fiados registrados'}
              </p>
              {vista === 'mio' && (
                <p className="text-gray-400 text-sm mt-2">Puedes ver todos los fiados con el botón de arriba</p>
              )}
            </div>
          ) : (
            <table className="w-full min-w-[700px]">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Fecha</th>
                  <th className="px-6 py-4 text-left">Persona</th>
                  <th className="px-6 py-4 text-left">Tipo</th>
                  <th className="px-6 py-4 text-left">Descripción</th>
                  <th className="px-6 py-4 text-left">Turno</th>
                  <th className="px-6 py-4 text-left">Cajero</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fiados.map((item, index) => {
                  const esCubiertoPorAbono = item.cubierto_por_abono;
                  const esPagado = item.pagado && !esCubiertoPorAbono;
                  const montoAbonado = parseFloat(item.monto_abonado || 0);
                  const tieneAbonosParciales = !esCubiertoPorAbono && !esPagado && montoAbonado > 0;
                  const montoRestanteFiado = parseFloat(item.monto) - montoAbonado;
                  const esMio = item.usuarios?.id === usuarioActual?.id;

                  return (
                    <tr
                      key={item.id}
                      className={`border-b transition-colors ${
                        esCubiertoPorAbono
                          ? 'bg-teal-50 hover:bg-teal-100 opacity-80'
                          : esPagado
                          ? 'bg-green-50 hover:bg-green-100 opacity-80'
                          : vista === 'todos' && esMio
                          ? 'bg-indigo-50 hover:bg-indigo-100'
                          : index % 2 === 0 ? 'bg-gray-50 hover:bg-purple-50' : 'bg-white hover:bg-purple-50'
                      }`}
                    >
                      <td className={`px-6 py-4 font-medium ${(esCubiertoPorAbono || esPagado) ? 'line-through text-gray-400' : ''}`}>
                        {formatDateShort(item.fecha)}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`font-semibold ${(esCubiertoPorAbono || esPagado) ? 'line-through text-gray-400' : ''}`}>
                          {item.nombrePersona}
                        </div>
                        {/* Botón para ver historial de abonos de esa persona */}
                        <button
                          onClick={() => setMostrarHistorialAbono(item.nombrePersona)}
                          className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-0.5"
                        >
                          <History size={11} /> ver abonos
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTipoColor(item.tipoPersona)}`}>
                          {item.tipoPersona}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm ${(esCubiertoPorAbono || esPagado) ? 'line-through text-gray-400' : ''}`}>
                        {item.descripcion}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-semibold">
                          {item.turno?.nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            esMio ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.usuarios?.nombre || '—'}
                          </span>
                          {esMio && vista === 'todos' && (
                            <span className="text-xs text-indigo-400 font-medium">tú</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tieneAbonosParciales ? (
                          <div>
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(parseFloat(item.monto))}</p>
                            <p className="font-bold text-orange-600">{formatCurrency(montoRestanteFiado)}</p>
                            <p className="text-xs text-orange-400">abonado: {formatCurrency(montoAbonado)}</p>
                          </div>
                        ) : (
                          <span className={`font-bold ${
                            esCubiertoPorAbono ? 'text-teal-500 line-through' :
                            esPagado ? 'text-green-500 line-through' : 'text-purple-600'
                          }`}>
                            {formatCurrency(parseFloat(item.monto))}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {esCubiertoPorAbono ? (
                          <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-semibold flex items-center gap-1 justify-center">
                            <CreditCard size={13} />
                            Cubierto
                          </span>
                        ) : esPagado ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold flex items-center gap-1 justify-center">
                            <CheckCircle size={13} />
                            Pagado
                          </span>
                        ) : tieneAbonosParciales ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold flex items-center gap-1">
                              <CreditCard size={13} />
                              Abono parcial
                            </span>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          {!item.pagado && !esCubiertoPorAbono && (
                            <button
                              onClick={() => handleMarcarPagado(item.id)}
                              className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                              title="Marcar como pagado (pago total directo)"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                          {!item.pagado && !esCubiertoPorAbono && (
                            <button
                              onClick={() => handleEditar(item)}
                              className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                          )}
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

      {/* Modal: Nuevo / Editar Fiado */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-2">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <h2 className="text-2xl font-bold">{editando ? 'Editar' : 'Nuevo'} Fiado</h2>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <Calendar className="inline mr-2" size={18} />Fecha
                </label>
                <input
                  type="date"
                  value={formulario.fecha}
                  onChange={(e) => setFormulario(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <User className="inline mr-2" size={18} />Nombre de la Persona
                  </label>
                  <input
                    type="text"
                    value={formulario.nombrePersona}
                    onChange={(e) => setFormulario(prev => ({ ...prev, nombrePersona: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Juan Pérez"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de Persona</label>
                  <select
                    value={formulario.tipoPersona}
                    onChange={(e) => setFormulario(prev => ({ ...prev, tipoPersona: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="cliente">Cliente</option>
                    <option value="empleado">Empleado</option>
                    <option value="jefe">Jefe</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descripción</label>
                <textarea
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Concepto del fiado..."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <DollarSign className="inline mr-2" size={18} />Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formulario.monto}
                    onChange={(e) => setFormulario(prev => ({ ...prev, monto: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Turno</label>
                  <select
                    value={formulario.turnoId}
                    onChange={(e) => setFormulario(prev => ({ ...prev, turnoId: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Seleccionar</option>
                    {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-purple-700 hover:to-pink-700"
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

      {/* Modal: Registrar Abono */}
      {mostrarModalAbono && (
        <ModalAbono
          personas={personasUnicas}
          onClose={() => setMostrarModalAbono(false)}
          onSuccess={cargarFiados}
          showNotification={showNotification}
        />
      )}

      {/* Modal: Historial de Abonos */}
      {mostrarHistorialAbono && (
        <ModalHistorialAbonos
          nombrePersona={mostrarHistorialAbono}
          onClose={() => setMostrarHistorialAbono(null)}
          showNotification={showNotification}
          onRefresh={cargarFiados}
        />
      )}
    </div>
  );
};

export default FiadosComponent;