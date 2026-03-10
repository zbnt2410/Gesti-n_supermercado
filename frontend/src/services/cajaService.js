// =============================================
// frontend/src/services/cajaService.js
// =============================================

import api from './api';

export const cajaService = {
  // Obtener turnos
  getTurnos: async () => {
    const response = await api.get('/caja/turnos');
    return response.data;
  },

  // Crear caja inicial
  crearCajaInicial: async (datos) => {
    const response = await api.post('/caja/caja-inicial', datos);
    return response.data;
  },

  // Obtener caja inicial por fecha y turno
  getCajaInicial: async (fecha, turnoId) => {
    const response = await api.get('/caja/caja-inicial', {
      params: { fecha, turnoId }
    });
    return response.data;
  },

  // Obtener todas las cajas iniciales con filtros
  getCajasIniciales: async (filtros = {}) => {
    const response = await api.get('/caja/cajas-iniciales', {
      params: filtros
    });
    return response.data;
  },

  // Actualizar caja inicial
  actualizarCajaInicial: async (id, datos) => {
    const response = await api.put(`/caja/caja-inicial/${id}`, datos);
    return response.data;
  },

  // Eliminar caja inicial
  eliminarCajaInicial: async (id) => {
    const response = await api.delete(`/caja/caja-inicial/${id}`);
    return response.data;
  },

  // ===== ENVÍOS =====
  crearEnvio: async (datos) => {
    const response = await api.post('/caja/envios', datos);
    return response.data;
  },

  getEnvios: async (filtros = {}) => {
    const response = await api.get('/caja/envios', {
      params: filtros
    });
    return response.data;
  },

  actualizarEnvio: async (id, datos) => {
    const response = await api.put(`/caja/envios/${id}`, datos);
    return response.data;
  },

  eliminarEnvio: async (id) => {
    const response = await api.delete(`/caja/envios/${id}`);
    return response.data;
  },

  // ===== TRANSFERENCIAS =====
  crearTransferencia: async (datos) => {
    const response = await api.post('/caja/transferencias', datos);
    return response.data;
  },

  getTransferencias: async (filtros = {}) => {
    const response = await api.get('/caja/transferencias', {
      params: filtros
    });
    return response.data;
  },

  actualizarTransferencia: async (id, datos) => {
    const response = await api.put(`/caja/transferencias/${id}`, datos);
    return response.data;
  },

  eliminarTransferencia: async (id) => {
    const response = await api.delete(`/caja/transferencias/${id}`);
    return response.data;
  },

  // ===== FIADOS =====
  crearFiado: async (datos) => {
    const response = await api.post('/caja/fiados', datos);
    return response.data;
  },

  getFiados: async (filtros = {}) => {
    const response = await api.get('/caja/fiados', {
      params: filtros
    });
    return response.data;
  },

  actualizarFiado: async (id, datos) => {
    const response = await api.put(`/caja/fiados/${id}`, datos);
    return response.data;
  },

  marcarFiadoPagado: async (id, fechaPago) => {
    const response = await api.patch(`/caja/fiados/${id}/pagar`, { fechaPago });
    return response.data;
  },

  eliminarFiado: async (id) => {
    const response = await api.delete(`/caja/fiados/${id}`);
    return response.data;
  },

    // Abonos
  crearAbono: (data) =>
    api.post('/caja/abonos', data).then(r => r.data),

  getAbonos: (params) =>
    api.get('/caja/abonos', { params }).then(r => r.data),

  eliminarAbono: (id) =>
    api.delete(`/caja/abonos/${id}`).then(r => r.data),

  getResumenPersona: (nombrePersona) =>
    api.get(`/caja/resumen/${encodeURIComponent(nombrePersona)}`).then(r => r.data),
  
};
