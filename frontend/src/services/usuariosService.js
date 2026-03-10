// =============================================
// frontend/src/services/usuariosService.js
// =============================================

import api from './api';

export const usuariosService = {
  crearUsuario: async (datos) => {
    const response = await api.post('/auth/usuarios', datos);
    return response.data;
  },

  getUsuarios: async (filtros = {}) => {
    const response = await api.get('/auth/usuarios', { params: filtros });
    return response.data;
  },

  actualizarUsuario: async (id, datos) => {
    const response = await api.put(`/auth/usuarios/${id}`, datos);
    return response.data;
  },

  eliminarUsuario: async (id) => {
    const response = await api.delete(`/auth/usuarios/${id}`);
    return response.data;
  },

  getUsuariosActivos: async () => {
  const response = await api.get('/auth/usuarios-activos');
  return response.data;
  }
};