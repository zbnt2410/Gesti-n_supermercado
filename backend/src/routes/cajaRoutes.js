const express = require('express');
const router = express.Router();
const cajaController = require('../controllers/cajaController');
const enviosController = require('../controllers/enviosController');
const transferenciasController = require('../controllers/transferenciasController');
const fiadosController = require('../controllers/fiadosController');
const { verificarAuth } = require('../middlewares/auth');

router.use(verificarAuth); 

// Rutas para turnos
router.get('/turnos', cajaController.getTurnos);

// Rutas para caja inicial
router.post('/caja-inicial', cajaController.crearCajaInicial);
router.get('/caja-inicial', cajaController.getCajaInicial);
router.get('/cajas-iniciales', cajaController.getCajasIniciales);
router.put('/caja-inicial/:id', cajaController.actualizarCajaInicial);
router.delete('/caja-inicial/:id', cajaController.eliminarCajaInicial);
// ===== RUTAS ENVÍOS =====
router.post('/envios', enviosController.crearEnvio);
router.get('/envios', enviosController.getEnvios);
router.get('/envios/:id', enviosController.getEnvioById);
router.put('/envios/:id', enviosController.actualizarEnvio);
router.delete('/envios/:id', enviosController.eliminarEnvio);

// ===== RUTAS TRANSFERENCIAS =====
router.post('/transferencias', transferenciasController.crearTransferencia);
router.get('/transferencias', transferenciasController.getTransferencias);
router.put('/transferencias/:id', transferenciasController.actualizarTransferencia);
router.delete('/transferencias/:id', transferenciasController.eliminarTransferencia);

// ===== RUTAS FIADOS =====
router.post('/fiados', fiadosController.crearFiado);
router.get('/fiados', fiadosController.getFiados);
router.put('/fiados/:id', fiadosController.actualizarFiado);
router.patch('/fiados/:id/pagar', fiadosController.marcarFiadoPagado);
router.delete('/fiados/:id', fiadosController.eliminarFiado);
router.post('/abonos', verificarAuth, fiadosController.crearAbono);
router.get('/abonos', verificarAuth, fiadosController.getAbonos);
router.delete('/abonos/:id', verificarAuth, fiadosController.eliminarAbono);
router.get('/resumen/:nombrePersona', verificarAuth, fiadosController.getResumenPersona);


module.exports = router;