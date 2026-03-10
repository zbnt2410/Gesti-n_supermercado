// frontend/src/services/mercadoService.js
import api from './api';

export const mercadoService = {
  // Crear producto
  crearProducto: async (datos) => {
    const response = await api.post('/mercado/productos', datos);
    return response.data;
  },

  // Obtener productos con filtros
  getProductos: async (filtros = {}) => {
    // eliminar filtros vacíos para no enviar params innecesarios
    const clean = {};
    Object.keys(filtros).forEach(k => {
      if (filtros[k] !== '' && filtros[k] !== null && filtros[k] !== undefined) {
        clean[k] = filtros[k];
      }
    });
    const response = await api.get('/mercado/productos', {
      params: clean
    });
    return response.data;
  },

  // Obtener producto por ID
  getProductoById: async (id) => {
    const response = await api.get(`/mercado/productos/${id}`);
    return response.data;
  },

  // Actualizar producto
  actualizarProducto: async (id, datos) => {
    const response = await api.put(`/mercado/productos/${id}`, datos);
    return response.data;
  },

  // Eliminar producto
  eliminarProducto: async (id) => {
    const response = await api.delete(`/mercado/productos/${id}`);
    return response.data;
  },

  // Marcar como vendido
  marcarVendido: async (id) => {
    const response = await api.patch(`/mercado/productos/${id}/vendido`);
    return response.data;
  },

  // Cambiar estado activo
  cambiarEstado: async (id, activo) => {
    const response = await api.patch(`/mercado/productos/${id}/estado`, { activo });
    return response.data;
  },

// Calcular valores sin guardar (preview)
calcularPreview: async (costo, cantidad, cantidadPorDolar = null) => {
  const payload = { costo, cantidad };

  if (cantidadPorDolar !== null && cantidadPorDolar !== undefined && cantidadPorDolar !== '') {
    payload.cantidadPorDolar = cantidadPorDolar;
  }

  const response = await api.post('/mercado/calcular', payload);
  return response.data;
},


};
