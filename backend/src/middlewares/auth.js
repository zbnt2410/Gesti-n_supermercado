
// =============================================
// backend/src/middlewares/auth.js
// =============================================

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supermercado_secret_key_2024';

// Middleware para verificar token JWT
exports.verificarAuth = (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Agregar datos del usuario al request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Por favor, inicia sesión nuevamente'
      });
    }

    return res.status(401).json({
      error: 'Token inválido',
      message: error.message
    });
  }
};

// Middleware para verificar que sea admin
exports.verificarAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de administrador'
    });
  }
  next();
};