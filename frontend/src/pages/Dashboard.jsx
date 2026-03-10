import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Clock, AlertCircle, CheckCircle, Loader, Plus,
  CreditCard, ArrowRightLeft, ChevronDown, ChevronUp, X, Check,
  Calculator, User, FileText, Trash2, Calendar, RefreshCw, Send
} from 'lucide-react';
import { cajaService } from '../services/cajaService';
import { formatCurrency } from '../utils/formatters';
import Layout from '../components/layout/Layout';

// ─────────────────────────────────────────────
// Fecha local (sin bug UTC)
// ─────────────────────────────────────────────
const fechaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const formatDateShort = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  return `${String(d.getUTCDate()).padStart(2,'0')}/${String(d.getUTCMonth()+1).padStart(2,'0')}/${d.getUTCFullYear()}`;
};

// ─────────────────────────────────────────────
// Notificación
// ─────────────────────────────────────────────
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const estilos = {
    success: 'bg-emerald-50 border-emerald-500 text-emerald-800',
    error:   'bg-red-50 border-red-500 text-red-800',
    info:    'bg-blue-50 border-blue-500 text-blue-800',
  };
  const iconos = {
    success: <CheckCircle size={18} />,
    error:   <AlertCircle size={18} />,
    info:    <AlertCircle size={18} />,
  };

  return (
    <div className={`fixed top-5 right-5 z-[100] border-l-4 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${estilos[type]}`}>
      {iconos[type]}
      <p className="font-semibold text-sm">{message}</p>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 font-bold">×</button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal: Nuevo Fiado rápido
// ─────────────────────────────────────────────
const ModalFiado = ({ turnos, turnoId, onClose, onSuccess, showNotification }) => {
  const [form, setForm] = useState({
    fecha: fechaLocal(), descripcion: '', monto: '',
    nombrePersona: '', tipoPersona: 'cliente',
    turnoId: turnoId || ''
  });
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!form.descripcion || !form.monto || !form.nombrePersona || !form.turnoId) {
      showNotification('error', 'Completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await cajaService.crearFiado(form);
      showNotification('success', `Fiado registrado para ${form.nombrePersona}`);
      onSuccess();
      onClose();
    } catch (e) {
      showNotification('error', e.response?.data?.error || 'Error al registrar fiado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 rounded-t-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <FileText size={22} />
            <div>
              <h3 className="font-bold text-lg">Nuevo Fiado</h3>
              <p className="text-violet-200 text-xs">Registrar crédito rápido</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Persona</label>
              <input
                value={form.nombrePersona}
                onChange={e => setForm(p => ({...p, nombrePersona: e.target.value}))}
                placeholder="Juan Pérez"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Tipo</label>
              <select
                value={form.tipoPersona}
                onChange={e => setForm(p => ({...p, tipoPersona: e.target.value}))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
              >
                <option value="cliente">Cliente</option>
                <option value="empleado">Empleado</option>
                <option value="jefe">Jefe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Descripción</label>
            <input
              value={form.descripcion}
              onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
              placeholder="Concepto del fiado..."
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Monto</label>
              <input
                type="number" step="0.01"
                value={form.monto}
                onChange={e => setForm(p => ({...p, monto: e.target.value}))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Turno</label>
              <select
                value={form.turnoId}
                onChange={e => setForm(p => ({...p, turnoId: e.target.value}))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-violet-500 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGuardar} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin mx-auto" size={18} /> : 'Registrar Fiado'}
            </button>
            <button onClick={onClose} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal: Nueva Transferencia rápida
// ─────────────────────────────────────────────
const ModalTransferencia = ({ turnos, turnoId, onClose, onSuccess, showNotification }) => {
  const [form, setForm] = useState({
    fecha: fechaLocal(), descripcion: '', monto: '',
    turnoId: turnoId || ''
  });
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!form.descripcion || !form.monto || !form.turnoId) {
      showNotification('error', 'Completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await cajaService.crearTransferencia(form);
      showNotification('success', 'Transferencia registrada');
      onSuccess();
      onClose();
    } catch (e) {
      showNotification('error', e.response?.data?.error || 'Error al registrar transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-teal-500 to-emerald-600 p-5 rounded-t-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <ArrowRightLeft size={22} />
            <div>
              <h3 className="font-bold text-lg">Nueva Transferencia</h3>
              <p className="text-teal-100 text-xs">Registrar transferencia bancaria</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Descripción / Banco / Referencia</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
              placeholder="Transferencia Banco X, referencia #..."
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Monto</label>
              <input
                type="number" step="0.01"
                value={form.monto}
                onChange={e => setForm(p => ({...p, monto: e.target.value}))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Turno</label>
              <select
                value={form.turnoId}
                onChange={e => setForm(p => ({...p, turnoId: e.target.value}))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-teal-500 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGuardar} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin mx-auto" size={18} /> : 'Registrar Transferencia'}
            </button>
            <button onClick={onClose} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Modal: Nuevo Envío rápido
// ─────────────────────────────────────────────
const ModalEnvio = ({ turnos, turnoId, onClose, onSuccess, showNotification }) => {
  const usuarioActual = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  })();

  const [form, setForm] = useState({
    fecha: fechaLocal(),
    hora: new Date().toTimeString().slice(0, 5),
    descripcion: '',
    monto: '',
    turnoId: turnoId || ''
  });
  const [loading, setLoading] = useState(false);

  const handleGuardar = async () => {
    if (!form.descripcion || !form.monto || !form.turnoId) {
      showNotification('error', 'Completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      await cajaService.crearEnvio({
        ...form,
        ...(usuarioActual?.id ? { usuario_id: usuarioActual.id } : {})
      });
      showNotification('success', 'Envío registrado correctamente');
      onSuccess();
      onClose();
    } catch (e) {
      showNotification('error', e.response?.data?.error || 'Error al registrar envío');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-5 rounded-t-2xl flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Send size={22} />
            <div>
              <h3 className="font-bold text-lg">Nuevo Envío</h3>
              <p className="text-orange-100 text-xs">Registrar envío de dinero</p>
            </div>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}
              placeholder="Destino, motivo del envío..."
              rows={2}
              className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Monto</label>
              <input
                type="number" step="0.01"
                value={form.monto}
                onChange={e => setForm(p => ({...p, monto: e.target.value}))}
                placeholder="0.00"
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">Turno</label>
              <select
                value={form.turnoId}
                onChange={e => setForm(p => ({...p, turnoId: e.target.value}))}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="">Seleccionar</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleGuardar} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader className="animate-spin mx-auto" size={18} /> : 'Registrar Envío'}
            </button>
            <button onClick={onClose} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────
const DashboardContent = () => {
  const [fecha, setFecha]                     = useState(fechaLocal());
  const [turnos, setTurnos]                   = useState([]);
  const [turnoSeleccionado, setTurnoSel]      = useState(null);
  const [loadingTurnos, setLoadingTurnos]     = useState(true);
  const [loading, setLoading]                 = useState(false);
  const [loadingDatos, setLoadingDatos]       = useState(false);
  const [notification, setNotification]       = useState(null);
  const [cajaExistente, setCajaExistente]     = useState(null);

  // ─── Usuario logueado — filtra fiados y transferencias por cajero ───
  const usuarioActual = (() => {
    try { return JSON.parse(localStorage.getItem('usuario')); }
    catch { return null; }
  })();

  // Datos del turno
  const [fiados, setFiados]                   = useState([]);
  const [transferencias, setTransferencias]   = useState([]);
  const [envios, setEnvios]                   = useState([]);

  // Modales
  const [modalFiado, setModalFiado]           = useState(false);
  const [modalTransf, setModalTransf]         = useState(false);
  const [modalEnvio, setModalEnvio]           = useState(false);

  // ─── Cierre POS: valores digitados manualmente ───
  // El cajero toma estos datos del punto de venta físico
  const [saldoFinalPOS, setSaldoFinalPOS]     = useState('');
  const [totalTarjetas, setTotalTarjetas]     = useState('');

  // Caja inicial
  const [cajaInicial, setCajaInicial] = useState({
    billetes20: 0, billetes10: 0, billetes5: 0,
    monedas1: 0, monedas050: 0, monedas025: 0,
    monedas010: 0, monedas005: 0, monedas001: 0
  });

  const denominaciones = [
    { key: 'billetes20',  label: '$20',   valor: 20,   icon: '💵' },
    { key: 'billetes10',  label: '$10',   valor: 10,   icon: '💵' },
    { key: 'billetes5',   label: '$5',    valor: 5,    icon: '💵' },
    { key: 'monedas1',    label: '$1',    valor: 1,    icon: '🪙' },
    { key: 'monedas050',  label: '$0.50', valor: 0.50, icon: '🪙' },
    { key: 'monedas025',  label: '$0.25', valor: 0.25, icon: '🪙' },
    { key: 'monedas010',  label: '$0.10', valor: 0.10, icon: '🪙' },
    { key: 'monedas005',  label: '$0.05', valor: 0.05, icon: '🪙' },
    { key: 'monedas001',  label: '$0.01', valor: 0.01, icon: '🪙' },
  ];

  const showNotification = (type, message) => setNotification({ type, message });

  const totalCaja = denominaciones.reduce((t, d) => t + (cajaInicial[d.key] * d.valor), 0);

  // Totales del turno
  const totalFiados         = fiados.filter(f => !f.pagado && !f.cubierto_por_abono)
                                     .reduce((s, f) => s + parseFloat(f.monto), 0);
  const totalTransferencias = transferencias.reduce((s, t) => s + parseFloat(t.monto), 0);
  const totalEnvios         = envios.reduce((s, e) => s + parseFloat(e.monto), 0);

  // ── Cierre POS: Saldo Final POS − Tarjetas − Transferencias = efectivo esperado
  const saldoPOS      = parseFloat(saldoFinalPOS)  || 0;
  const tarjetasPOS   = parseFloat(totalTarjetas)  || 0;
  const efectivoEsperado = saldoPOS - tarjetasPOS - totalTransferencias - totalEnvios;

  // ── Diferencia: efectivo esperado vs lo que hay físicamente contado
  const diferenciaCierre = efectivoEsperado - totalCaja;

  // ── (se mantiene por compatibilidad con las tarjetas del resumen superior)
  const totalEsperadoEnCaja = totalCaja - totalTransferencias - totalEnvios - totalFiados;

  // ─── Carga inicial ───
  useEffect(() => {
    const init = async () => {
      try {
        const data = await cajaService.getTurnos();
        setTurnos(data);
        if (data.length > 0) {
          // Recuperar turno guardado — si el cajero vuelve a la pestaña mantiene el mismo turno
          const turnoGuardado = localStorage.getItem('dashboard_turno_id');
          const turnoValido = turnoGuardado && data.find(t => t.id === parseInt(turnoGuardado));
          setTurnoSel(turnoValido ? parseInt(turnoGuardado) : data[0].id);
        }
      } catch {
        showNotification('error', 'Error al cargar turnos');
      } finally {
        setLoadingTurnos(false);
      }
    };
    init();
  }, []);

  // ─── Recargar datos cuando cambia fecha o turno ───
  const cargarDatosTurno = useCallback(async () => {
    if (!turnoSeleccionado || !fecha) return;
    setLoadingDatos(true);
    try {
      // Caja inicial
      try {
        const caja = await cajaService.getCajaInicial(fecha, turnoSeleccionado);
        setCajaExistente(caja);
        setCajaInicial({
          billetes20: caja.billetes20 || 0, billetes10: caja.billetes10 || 0,
          billetes5:  caja.billetes5  || 0, monedas1:   caja.monedas1   || 0,
          monedas050: caja.monedas050 || 0, monedas025: caja.monedas025 || 0,
          monedas010: caja.monedas010 || 0, monedas005: caja.monedas005 || 0,
          monedas001: caja.monedas001 || 0,
        });
        // Caja cargada desde BD — borrar borrador local si existía
        localStorage.removeItem('dashboard_caja_borrador');
      } catch {
        setCajaExistente(null);
        // Recuperar borrador local si el cajero ya había contado antes de guardar
        const claveBorrador = `dashboard_caja_borrador_${fecha}_${turnoSeleccionado}`;
        try {
          const borrador = JSON.parse(localStorage.getItem(claveBorrador));
          if (borrador) {
            setCajaInicial(borrador);
          } else {
            setCajaInicial({ billetes20:0,billetes10:0,billetes5:0,monedas1:0,monedas050:0,monedas025:0,monedas010:0,monedas005:0,monedas001:0 });
          }
        } catch {
          setCajaInicial({ billetes20:0,billetes10:0,billetes5:0,monedas1:0,monedas050:0,monedas025:0,monedas010:0,monedas005:0,monedas001:0 });
        }
      }

      // Fiados del turno y día — solo los de este cajero
      const dataFiados = await cajaService.getFiados({
        fechaInicio: fecha, fechaFin: fecha,
        turnoId: turnoSeleccionado,
        ...(usuarioActual?.id ? { registradoPorId: usuarioActual.id } : {})
      });
      setFiados(dataFiados.fiados || []);

      // Transferencias del turno y día — solo las de este cajero
      const dataTransf = await cajaService.getTransferencias({
        fechaInicio: fecha, fechaFin: fecha,
        turnoId: turnoSeleccionado,
        ...(usuarioActual?.id ? { usuarioId: usuarioActual.id } : {})
      });
      setTransferencias(dataTransf.transferencias || []);

      // Envíos del turno y día — todos los del turno (sin filtro por cajero)
      const dataEnvios = await cajaService.getEnvios({
        fechaInicio: fecha, fechaFin: fecha,
        turnoId: turnoSeleccionado,
        ...(usuarioActual?.id ? { usuarioId: usuarioActual.id } : {})
      });
      setEnvios(dataEnvios.envios || []);

    } catch {
      showNotification('error', 'Error al cargar datos del turno');
    } finally {
      setLoadingDatos(false);
    }
  }, [fecha, turnoSeleccionado]);

  useEffect(() => { cargarDatosTurno(); }, [cargarDatosTurno]);

  const handleGuardarCaja = async () => {
    try {
      setLoading(true);
      const datos = { fecha, turnoId: turnoSeleccionado, ...cajaInicial };
      if (cajaExistente) {
        await cajaService.actualizarCajaInicial(cajaExistente.id, cajaInicial);
        showNotification('success', `Caja actualizada: ${formatCurrency(totalCaja)}`);
      } else {
        const res = await cajaService.crearCajaInicial(datos);
        setCajaExistente(res);
        // Limpiar borrador local — ya está persistido en BD
        localStorage.removeItem(`dashboard_caja_borrador_${fecha}_${turnoSeleccionado}`);
        showNotification('success', `Caja inicial guardada: ${formatCurrency(totalCaja)}`);
      }
    } catch (e) {
      showNotification('error', e.response?.data?.error || 'Error al guardar caja');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarFiado = async (id) => {
    if (!window.confirm('¿Eliminar este fiado?')) return;
    try {
      await cajaService.eliminarFiado(id);
      showNotification('success', 'Fiado eliminado');
      cargarDatosTurno();
    } catch {
      showNotification('error', 'Error al eliminar fiado');
    }
  };

  const handleEliminarTransferencia = async (id) => {
    if (!window.confirm('¿Eliminar esta transferencia?')) return;
    try {
      await cajaService.eliminarTransferencia(id);
      showNotification('success', 'Transferencia eliminada');
      cargarDatosTurno();
    } catch {
      showNotification('error', 'Error al eliminar transferencia');
    }
  };

  const handleEliminarEnvio = async (id) => {
    if (!window.confirm('¿Eliminar este envío?')) return;
    try {
      await cajaService.eliminarEnvio(id);
      showNotification('success', 'Envío eliminado');
      cargarDatosTurno();
    } catch {
      showNotification('error', 'Error al eliminar envío');
    }
  };

  const turnoActual = turnos.find(t => t.id === turnoSeleccionado);

  // ─── Cerrar turno día y pasar al turno tarde ───
  // Guarda la caja actual, luego cambia al siguiente turno
  // llevando el mismo conteo de billetes/monedas como punto de partida
  const handleCerrarCaja = async () => {
    if (!window.confirm('¿Cerrar el turno del día y pasar al turno de la tarde?\nEl conteo actual se trasladará al turno de la tarde.')) return;

    try {
      setLoading(true);

      // 1. Guardar la caja del turno actual si no estaba guardada
      const datos = { fecha, turnoId: turnoSeleccionado, ...cajaInicial };
      if (!cajaExistente) {
        await cajaService.crearCajaInicial(datos);
        localStorage.removeItem(`dashboard_caja_borrador_${fecha}_${turnoSeleccionado}`);
      }

      // 2. Identificar el turno siguiente (el de la tarde)
      const idxActual = turnos.findIndex(t => t.id === turnoSeleccionado);
      const turnoSiguiente = turnos[idxActual + 1];
      if (!turnoSiguiente) {
        showNotification('error', 'No hay turno siguiente configurado');
        return;
      }

      // 3. Guardar el conteo actual como borrador del turno tarde
      //    para que el cajero no tenga que volver a contar
      const claveTarde = `dashboard_caja_borrador_${fecha}_${turnoSiguiente.id}`;
      localStorage.setItem(claveTarde, JSON.stringify(cajaInicial));

      // 4. Cambiar al turno tarde y persistir la selección
      localStorage.setItem('dashboard_turno_id', turnoSiguiente.id);
      setTurnoSel(turnoSiguiente.id);

      showNotification('success', `Turno día cerrado. Ahora en: ${turnoSiguiente.nombre} — conteo trasladado ✓`);
    } catch (e) {
      showNotification('error', e.response?.data?.error || 'Error al cerrar turno');
    } finally {
      setLoading(false);
    }
  };

  if (loadingTurnos) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader className="animate-spin mx-auto mb-4 text-indigo-600" size={40} />
          <p className="text-gray-500 font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100">
      {notification && (
        <Notification type={notification.type} message={notification.message} onClose={() => setNotification(null)} />
      )}

      {/* ── HEADER ── */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Centro de Turno</h1>
            <p className="text-slate-400 text-sm mt-0.5">Control de caja, fiados y transferencias</p>
          </div>
          {/* Selector de fecha y turno */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-700 rounded-xl px-4 py-2">
              <Calendar size={15} className="text-slate-400" />
              <input
                type="date" value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="bg-transparent text-white text-sm font-semibold focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              {turnos.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTurnoSel(t.id);
                    localStorage.setItem('dashboard_turno_id', t.id);
                  }}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                    turnoSeleccionado === t.id
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
            <button
              onClick={cargarDatosTurno}
              className="p-2 bg-slate-700 rounded-xl hover:bg-slate-600 text-slate-400 hover:text-white transition-all"
              title="Actualizar datos"
            >
              <RefreshCw size={16} className={loadingDatos ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── FILA 1: Resumen de cierre de caja ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">

          {/* Caja inicial */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Caja Inicial</p>
            <p className="text-3xl font-black text-slate-800">{formatCurrency(totalCaja)}</p>
            <p className="text-xs text-slate-400 mt-1">{cajaExistente ? 'Registrada ✓' : 'Sin registrar'}</p>
          </div>

          {/* Transferencias */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-5">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">Transferencias</p>
            <p className="text-xl md:text-3xl font-black text-teal-700">− {formatCurrency(totalTransferencias)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{transferencias.length} registro(s)</p>
          </div>

          {/* Envíos */}
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Envíos</p>
            <p className="text-xl md:text-3xl font-black text-orange-700">− {formatCurrency(totalEnvios)}</p>
            <p className="text-xs text-slate-400 mt-0.5">{envios.length} envío(s)</p>
          </div>

          {/* Fiados */}
          <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-5">
            <p className="text-xs font-bold text-violet-600 uppercase tracking-widest mb-1">Fiados Pendientes</p>
            <p className="text-3xl font-black text-violet-700">− {formatCurrency(totalFiados)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {fiados.filter(f => !f.pagado && !f.cubierto_por_abono).length} fiado(s) activos
            </p>
          </div>

          {/* Lo que debe haber en caja */}
          <div className={`rounded-2xl shadow-sm border p-5 ${
            totalEsperadoEnCaja >= 0
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              totalEsperadoEnCaja >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              <Calculator size={12} className="inline mr-1" />
              Debe Haber en Caja
            </p>
            <p className={`text-3xl font-black ${
              totalEsperadoEnCaja >= 0 ? 'text-emerald-700' : 'text-red-700'
            }`}>
              {formatCurrency(Math.abs(totalEsperadoEnCaja))}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Caja − Transf. − Envíos − Fiados</p>
          </div>
        </div>

        {/* ── FILA 2: Fiados, Transferencias y Envíos del turno ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* ── FIADOS DEL TURNO ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-violet-100 rounded-xl p-2">
                  <FileText size={18} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Fiados del Turno</h2>
                  <p className="text-xs text-slate-400">{turnoActual?.nombre} · {fecha} · <span className="text-violet-500 font-semibold">{usuarioActual?.nombre || '—'}</span></p>
                </div>
              </div>
              <button
                onClick={() => setModalFiado(true)}
                className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-violet-700 transition-all"
              >
                <Plus size={14} /> Nuevo
              </button>
            </div>

            {loadingDatos ? (
              <div className="flex justify-center items-center p-8">
                <Loader className="animate-spin text-violet-500" size={28} />
              </div>
            ) : fiados.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <FileText size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay fiados en este turno</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Persona</th>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Descripción</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase">Monto</th>
                      <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
                      <th className="px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fiados.map((f, i) => {
                      const pendiente = !f.pagado && !f.cubierto_por_abono;
                      return (
                        <tr key={f.id} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-800 text-xs">{f.nombrePersona}</p>
                            <p className="text-xs text-slate-400">{f.tipoPersona}</p>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[120px] truncate">{f.descripcion}</td>
                          <td className={`px-4 py-2.5 text-right font-bold text-xs ${
                            f.cubierto_por_abono ? 'text-teal-500 line-through' :
                            f.pagado ? 'text-emerald-500 line-through' : 'text-violet-700'
                          }`}>
                            {formatCurrency(parseFloat(f.monto))}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {f.cubierto_por_abono ? (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">Abonado</span>
                            ) : f.pagado ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">Pagado</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-bold">Pendiente</span>
                            )}
                          </td>
                          <td className="px-2 py-2.5">
                            {pendiente && (
                              <button
                                onClick={() => handleEliminarFiado(f.id)}
                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-violet-50 border-t-2 border-violet-100">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-violet-700 uppercase">
                        Total pendiente
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-violet-700 text-sm">
                        {formatCurrency(totalFiados)}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── TRANSFERENCIAS DEL TURNO ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 rounded-xl p-2">
                  <ArrowRightLeft size={18} className="text-teal-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Transferencias del Turno</h2>
                  <p className="text-xs text-slate-400">{turnoActual?.nombre} · {fecha} · <span className="text-teal-500 font-semibold">{usuarioActual?.nombre || '—'}</span></p>
                </div>
              </div>
              <button
                onClick={() => setModalTransf(true)}
                className="flex items-center gap-1.5 bg-teal-600 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-teal-700 transition-all"
              >
                <Plus size={14} /> Nueva
              </button>
            </div>

            {loadingDatos ? (
              <div className="flex justify-center items-center p-8">
                <Loader className="animate-spin text-teal-500" size={28} />
              </div>
            ) : transferencias.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <ArrowRightLeft size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay transferencias en este turno</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Descripción</th>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Cajero</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase">Monto</th>
                      <th className="px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferencias.map((t, i) => (
                      <tr key={t.id} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[160px] truncate">{t.descripcion}</td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                            {t.usuarios?.nombre || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-teal-700 text-xs">
                          {formatCurrency(parseFloat(t.monto))}
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => handleEliminarTransferencia(t.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-teal-50 border-t-2 border-teal-100">
                    <tr>
                      <td colSpan={2} className="px-4 py-2.5 text-xs font-bold text-teal-700 uppercase">
                        Total transferido
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-teal-700 text-sm">
                        {formatCurrency(totalTransferencias)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* ── ENVÍOS DEL TURNO ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 rounded-xl p-2">
                  <Send size={18} className="text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-sm">Envíos del Turno</h2>
                  <p className="text-xs text-slate-400">{turnoActual?.nombre} · {fecha} · <span className="text-orange-500 font-semibold">{usuarioActual?.nombre || '—'}</span></p>
                </div>
              </div>
              <button
                onClick={() => setModalEnvio(true)}
                className="flex items-center gap-1.5 bg-orange-500 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-orange-600 transition-all"
              >
                <Plus size={14} /> Nuevo
              </button>
            </div>

            {loadingDatos ? (
              <div className="flex justify-center items-center p-8">
                <Loader className="animate-spin text-orange-500" size={28} />
              </div>
            ) : envios.length === 0 ? (
              <div className="text-center p-8 text-slate-400">
                <Send size={36} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay envíos en este turno</p>
              </div>
            ) : (
              <div className="overflow-auto max-h-72">
                <table className="w-full text-sm min-w-[280px]">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-500 uppercase">Descripción</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold text-slate-500 uppercase">Monto</th>
                      <th className="px-2 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {envios.map((e, i) => (
                      <tr key={e.id} className={`border-t border-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[160px] truncate">{e.descripcion}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-orange-700 text-xs">
                          {formatCurrency(parseFloat(e.monto))}
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            onClick={() => handleEliminarEnvio(e.id)}
                            className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-orange-50 border-t-2 border-orange-100">
                    <tr>
                      <td className="px-4 py-2.5 text-xs font-bold text-orange-700 uppercase">Total enviado</td>
                      <td className="px-4 py-2.5 text-right font-black text-orange-700 text-sm">
                        {formatCurrency(totalEnvios)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* ── FILA 3: Apertura de Caja ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 rounded-xl p-2">
                <DollarSign size={18} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">Conteo de Caja</h2>
                <p className="text-xs text-slate-400">
                  {cajaExistente ? '✓ Caja registrada — editando' : 'Sin registro para este turno'}
                </p>
              </div>
            </div>
            {cajaExistente && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                Registrada
              </span>
            )}
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tabla de denominaciones */}
              <div className="overflow-hidden rounded-xl border border-slate-200 text-sm">
                <table className="w-full">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="px-4 py-2.5 text-left text-xs font-bold">Denominación</th>
                      <th className="px-4 py-2.5 text-center text-xs font-bold">Cant.</th>
                      <th className="px-4 py-2.5 text-right text-xs font-bold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denominaciones.map((d, i) => (
                      <tr key={d.key} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                        <td className="px-4 py-2 font-medium text-slate-700 text-xs">{d.icon} {d.label}</td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number" min="0"
                            value={cajaInicial[d.key]}
                            onChange={e => {
                              const nuevo = {...cajaInicial, [d.key]: parseInt(e.target.value)||0};
                              setCajaInicial(nuevo);
                              // Guardar borrador en localStorage para no perder el conteo al cambiar de pestaña
                              if (!cajaExistente) {
                                const clave = `dashboard_caja_borrador_${fecha}_${turnoSeleccionado}`;
                                localStorage.setItem(clave, JSON.stringify(nuevo));
                              }
                            }}
                            className="w-16 px-2 py-1 text-center text-xs font-bold border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-4 py-2 text-right text-xs font-semibold text-slate-700">
                          {formatCurrency(cajaInicial[d.key] * d.valor)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-emerald-600 text-white">
                    <tr>
                      <td className="px-4 py-3 font-black text-sm" colSpan={2}>TOTAL EN CAJA</td>
                      <td className="px-4 py-3 text-right font-black text-lg">{formatCurrency(totalCaja)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ── Panel de Verificación de Cierre con POS ── */}
              <div className="flex flex-col gap-4">

                {/* Datos del Punto de Venta — digitados manualmente */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Calculator size={13} />
                    Datos del Punto de Venta
                  </p>

                  {/* Saldo Final POS */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Saldo Final del turno (POS)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={saldoFinalPOS}
                        onChange={e => setSaldoFinalPOS(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-4 py-2.5 text-sm font-bold border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tomar del reporte del POS al cierre del turno</p>
                  </div>

                  {/* Total Tarjetas */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Total Tarjetas (crédito/débito)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number" step="0.01" min="0"
                        value={totalTarjetas}
                        onChange={e => setTotalTarjetas(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-4 py-2.5 text-sm font-bold border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none bg-white"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Ventas cobradas con tarjeta en el POS</p>
                  </div>
                </div>

                {/* Fórmula de verificación */}
                <div className={`rounded-xl border p-4 space-y-2 ${
                  saldoPOS > 0
                    ? diferenciaCierre === 0
                      ? 'bg-emerald-50 border-emerald-200'
                      : Math.abs(diferenciaCierre) < 1
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Verificación de Cierre
                  </p>

                  <div className="space-y-1.5 text-sm">
                    {/* Saldo POS */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Saldo final POS</span>
                      <span className="font-bold text-slate-800">
                        {saldoPOS > 0 ? formatCurrency(saldoPOS) : <span className="text-slate-300 italic text-xs">pendiente</span>}
                      </span>
                    </div>

                    {/* − Tarjetas */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">− Tarjetas</span>
                      <span className="font-semibold text-blue-600">
                        {tarjetasPOS > 0 ? `− ${formatCurrency(tarjetasPOS)}` : <span className="text-slate-300 text-xs">—</span>}
                      </span>
                    </div>

                    {/* − Transferencias (del sistema) */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">− Transferencias</span>
                      <span className="font-semibold text-teal-600">− {formatCurrency(totalTransferencias)}</span>
                    </div>

                    {/* − Envíos (del sistema) */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">− Envíos</span>
                      <span className="font-semibold text-orange-600">− {formatCurrency(totalEnvios)}</span>
                    </div>

                    {/* = Efectivo esperado */}
                    <div className="border-t border-slate-200 pt-1.5 flex justify-between items-center">
                      <span className="font-bold text-slate-700">Efectivo esperado</span>
                      <span className="font-black text-slate-800">
                        {saldoPOS > 0 ? formatCurrency(efectivoEsperado) : <span className="text-slate-300 italic text-xs">—</span>}
                      </span>
                    </div>

                    {/* Conteo físico */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Conteo físico en caja</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(totalCaja)}</span>
                    </div>

                    {/* Diferencia — el resultado final */}
                    {saldoPOS > 0 && (
                      <div className={`border-t-2 pt-2 flex justify-between items-center rounded-lg px-2 -mx-2 ${
                        diferenciaCierre === 0
                          ? 'border-emerald-400 bg-emerald-100'
                          : Math.abs(diferenciaCierre) < 1
                            ? 'border-yellow-400 bg-yellow-100'
                            : 'border-red-400 bg-red-100'
                      }`}>
                        <div>
                          <p className={`font-black text-sm ${
                            diferenciaCierre === 0 ? 'text-emerald-700'
                            : Math.abs(diferenciaCierre) < 1 ? 'text-yellow-700'
                            : 'text-red-700'
                          }`}>
                            {diferenciaCierre === 0 ? '✓ Cuadrado' : diferenciaCierre > 0 ? '↑ Sobrante' : '↓ Faltante'}
                          </p>
                          <p className="text-[10px] text-slate-500">Efectivo esperado − Conteo físico</p>
                        </div>
                        <span className={`font-black text-2xl ${
                          diferenciaCierre === 0 ? 'text-emerald-600'
                          : Math.abs(diferenciaCierre) < 1 ? 'text-yellow-600'
                          : 'text-red-600'
                        }`}>
                          {diferenciaCierre === 0 ? '✓' : (diferenciaCierre > 0 ? '+' : '')}{formatCurrency(diferenciaCierre)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botones guardar/limpiar/cerrar caja */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-3">
                    <button
                      onClick={handleGuardarCaja} disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader className="animate-spin" size={16} /> Guardando...
                        </span>
                      ) : cajaExistente ? '✓ Actualizar Caja' : 'Guardar Caja Inicial'}
                    </button>
                    <button
                      onClick={() => {
                        setCajaInicial({billetes20:0,billetes10:0,billetes5:0,monedas1:0,monedas050:0,monedas025:0,monedas010:0,monedas005:0,monedas001:0});
                        setSaldoFinalPOS('');
                        setTotalTarjetas('');
                        if (fecha && turnoSeleccionado) {
                          localStorage.removeItem(`dashboard_caja_borrador_${fecha}_${turnoSeleccionado}`);
                        }
                      }}
                      className="px-5 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200"
                    >
                      Limpiar
                    </button>
                  </div>

                  {/* Botón Cerrar Caja — solo visible si hay más de un turno y este no es el último */}
                  {turnos.length > 1 && turnoSeleccionado === turnos[0]?.id && (
                    <button
                      onClick={handleCerrarCaja}
                      disabled={loading}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                    >
                      <ArrowRightLeft size={16} />
                      Cerrar Turno Día → Pasar a Turno Tarde
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      {modalFiado && (
        <ModalFiado
          turnos={turnos} turnoId={turnoSeleccionado}
          onClose={() => setModalFiado(false)}
          onSuccess={cargarDatosTurno}
          showNotification={showNotification}
        />
      )}
      {modalTransf && (
        <ModalTransferencia
          turnos={turnos} turnoId={turnoSeleccionado}
          onClose={() => setModalTransf(false)}
          onSuccess={cargarDatosTurno}
          showNotification={showNotification}
        />
      )}
      {modalEnvio && (
        <ModalEnvio
          turnos={turnos} turnoId={turnoSeleccionado}
          onClose={() => setModalEnvio(false)}
          onSuccess={cargarDatosTurno}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Export con Layout
// ─────────────────────────────────────────────
const Dashboard = ({ standalone = false }) => {
  if (standalone) return <DashboardContent />;
  return <Layout><DashboardContent /></Layout>;
};

export default Dashboard;