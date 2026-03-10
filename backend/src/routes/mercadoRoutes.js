const express = require('express');
const router = express.Router();
const mercadoController = require('../controllers/mercadoController');

// ===== RUTAS PRODUCTOS MERCADO =====
router.post('/productos', mercadoController.crearProducto);
router.get('/productos', mercadoController.getProductos);
router.get('/productos/:id', mercadoController.getProductoById);
router.put('/productos/:id', mercadoController.actualizarProducto);
router.delete('/productos/:id', mercadoController.eliminarProducto);

// Rutas especiales
router.patch('/productos/:id/vendido', mercadoController.marcarVendido);
router.patch('/productos/:id/estado', mercadoController.cambiarEstado);
router.post('/calcular', mercadoController.calcularPreview);

module.exports = router;