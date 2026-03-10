// =============================================
// backend/src/routes/authRoutes.js
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarAuth, verificarAdmin } = require('../middlewares/auth');

// Rutas públicas
router.post('/login', authController.login);
router.post('/registro-publico', authController.registroPublico); // NUEVA RUTA PÚBLICA
router.get('/usuarios-activos', verificarAuth, authController.getUsuariosActivos);

// Rutas protegidas
router.get('/verificar', verificarAuth, authController.verificarToken);
router.post('/cambiar-password', verificarAuth, authController.cambiarPassword);

// Rutas solo para admin
router.post('/registrar', verificarAuth, verificarAdmin, authController.registrarUsuario);
router.get('/usuarios', verificarAuth, verificarAdmin, authController.getUsuarios);
router.put('/usuarios/:id', verificarAuth, verificarAdmin, authController.actualizarUsuario);

module.exports = router;