const express = require('express');
const router = express.Router();
const facturasController = require('../controllers/facturasController');

router.post('/', facturasController.crearFactura);
router.get('/', facturasController.getFacturas);
router.put('/:id', facturasController.actualizarFactura);
router.patch('/:id/subir', facturasController.marcarComoSubida);
router.patch('/:id/desmarcar', facturasController.desmarcarSubida);
router.delete('/:id', facturasController.eliminarFactura);

module.exports = router;