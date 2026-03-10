// =============================================
// backend/src/routes/proveedoresRoutes.js
// =============================================

const express = require('express');
const router = express.Router();
const proveedoresController = require('../controllers/proveedoresController');
const facturasController = require('../controllers/facturasController');

// ===== RUTAS PROVEEDORES =====
router.post('/proveedores', proveedoresController.crearProveedor);
router.get('/proveedores', proveedoresController.getProveedores);
router.put('/proveedores/:id', proveedoresController.actualizarProveedor);
router.delete('/proveedores/:id', proveedoresController.eliminarProveedor);

// ===== RUTAS DÍAS DE PEDIDO =====
router.post('/dias-pedido', proveedoresController.configurarDiasPedido);
router.get('/proveedores-del-dia', proveedoresController.getProveedoresDelDia);

// ===== RUTAS PAGOS =====
router.get('/pedidos-pendientes-pago', proveedoresController.getPedidosPendientesPago);
router.post('/pagos', proveedoresController.crearPago);
router.get('/pagos', proveedoresController.getPagos);
router.delete('/pagos/:id', proveedoresController.eliminarPago);

// ===== RUTAS EFECTIVO =====
router.post('/efectivo', proveedoresController.registrarEfectivo);
router.get('/efectivo', proveedoresController.getEfectivoDelDia);

// ===== RUTAS PEDIDOS =====
router.post('/pedidos', proveedoresController.crearPedido);
router.get('/pedidos', proveedoresController.getPedidos);
router.put('/pedidos/:id', proveedoresController.actualizarPedido);
router.delete('/pedidos/:id', proveedoresController.eliminarPedido);

module.exports = router;