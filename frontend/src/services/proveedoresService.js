
// =============================================
// frontend/src/services/proveedoresService.js
// =============================================

import api from './api';

export const proveedoresService = {
  // ===== PROVEEDORES =====
  crearProveedor: async (datos) => {
    const response = await api.post('/proveedores/proveedores', datos);
    return response.data;
  },

  getProveedores: async (filtros = {}) => {
    const response = await api.get('/proveedores/proveedores', {
      params: filtros
    });
    return response.data;
  },

  actualizarProveedor: async (id, datos) => {
    const response = await api.put(`/proveedores/proveedores/${id}`, datos);
    return response.data;
  },

  eliminarProveedor: async (id) => {
    const response = await api.delete(`/proveedores/proveedores/${id}`);
    return response.data;
  },

  // ===== DÍAS DE PEDIDO =====
  configurarDiasPedido: async (proveedorId, dias) => {
    const response = await api.post('/proveedores/dias-pedido', {
      proveedorId,
      dias
    });
    return response.data;
  },

  getProveedoresDelDia: async (fecha) => {
    const response = await api.get('/proveedores/proveedores-del-dia', {
      params: { fecha }
    });
    return response.data;
  },

  // ===== PAGOS =====
  getPedidosPendientesPago: async (filtros = {}) => {
    const response = await api.get('/proveedores/pedidos-pendientes-pago', {
      params: filtros
    });
    return response.data;
  },

  crearPago: async (datos) => {
    const response = await api.post('/proveedores/pagos', datos);
    return response.data;
  },

  getPagos: async (filtros = {}) => {
    const response = await api.get('/proveedores/pagos', {
      params: filtros
    });
    return response.data;
  },

  eliminarPago: async (id) => {
    const response = await api.delete(`/proveedores/pagos/${id}`);
    return response.data;
  },

  // ===== EFECTIVO =====
  registrarEfectivo: async (datos) => {
    const response = await api.post('/proveedores/efectivo', datos);
    return response.data;
  },

  getEfectivoDelDia: async (fecha) => {
    const response = await api.get('/proveedores/efectivo', {
      params: { fecha }
    });
    return response.data;
  },

  // ===== PEDIDOS =====
  crearPedido: async (datos) => {
    const response = await api.post('/proveedores/pedidos', datos);
    return response.data;
  },

  getPedidos: async (filtros = {}) => {
    const response = await api.get('/proveedores/pedidos', {
      params: filtros
    });
    return response.data;
  },

  actualizarPedido: async (id, datos) => {
    const response = await api.put(`/proveedores/pedidos/${id}`, datos);
    return response.data;
  },

  eliminarPedido: async (id) => {
    const response = await api.delete(`/proveedores/pedidos/${id}`);
    return response.data;
  },
  // ===== FACTURAS =====

  crearFactura: async (data) => {
    const response = await api.post('/facturas', data); 
    return response.data;
  },

  marcarComoSubida: async (id, usuarioSubida) => {
  const response = await api.patch(`/facturas/${id}/subir`, { usuarioSubida });
  return response.data;
},

desmarcarSubida: async (id) => {
  const response = await api.patch(`/facturas/${id}/desmarcar`);
  return response.data;
},

  getFacturas: async (filtros = {}) => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.append(key, value);
      }
    });
    const response = await api.get(`/facturas?${params.toString()}`); 
    return response.data;
  },

  actualizarFactura: async (id, data) => {
    const response = await api.put(`/facturas/${id}`, data); 
    return response.data;
  },

  eliminarFactura: async (id) => {
    const response = await api.delete(`/facturas/${id}`);
    return response.data;
  }


};
