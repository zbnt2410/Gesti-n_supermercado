// =============================================
// backend/src/controllers/authController.js
// =============================================

const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supermercado_secret_key_2024';
const JWT_EXPIRES_IN = '8h'; // Token válido por 8 horas (turno completo)

// Registro público (sin necesidad de ser admin)
exports.registroPublico = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y contraseña son requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Este email ya está registrado'
      });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario (siempre como cajero en registro público)
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email: email.toLowerCase(),
        password: passwordHash,
        rol: 'cajero', // Siempre cajero en registro público
        activo: true
      }
    });

    // Generar token JWT automáticamente
    const token = jwt.sign(
      {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      token,
      usuario: usuarioSinPassword
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      error: 'Error al registrar usuario',
      message: error.message
    });
  }
};

exports.getUsuariosActivos = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      where: { activo: true },
      select: { id: true, nombre: true }
    });
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios activos' });
  }
};

exports.registrarUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({
        error: 'Nombre, email y contraseña son requeridos'
      });
    }

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuarios.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Este email ya está registrado'
      });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const nuevoUsuario = await prisma.usuarios.create({
      data: {
        nombre,
        email: email.toLowerCase(),
        password: passwordHash,
        rol: rol || 'cajero',
        activo: true
      }
    });

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = nuevoUsuario;

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      usuario: usuarioSinPassword
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      error: 'Error al registrar usuario',
      message: error.message
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Buscar usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Verificar si está activo
    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Usuario desactivado. Contacta al administrador'
      });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // No devolver la contraseña
    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      message: 'Login exitoso',
      token,
      usuario: usuarioSinPassword
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      message: error.message
    });
  }
};

// Verificar token y obtener datos del usuario
exports.verificarToken = async (req, res) => {
  try {
    // El middleware ya decodificó el token y lo puso en req.user
    const usuario = await prisma.usuarios.findUnique({
      where: { id: req.user.id }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        error: 'Usuario desactivado'
      });
    }

    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      valid: true,
      usuario: usuarioSinPassword
    });
  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({
      error: 'Error al verificar token',
      message: error.message
    });
  }
};

// Obtener todos los usuarios (solo admin)
exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuarios.findMany({
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios',
      message: error.message
    });
  }
};

// Actualizar usuario
exports.actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol, activo } = req.body;

    let updateData = {
      nombre: nombre || undefined,
      email: email ? email.toLowerCase() : undefined,
      rol: rol || undefined,
      activo: activo !== undefined ? activo : undefined
    };

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const usuarioActualizado = await prisma.usuarios.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true
      }
    });

    res.json({
      message: 'Usuario actualizado correctamente',
      usuario: usuarioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error al actualizar usuario',
      message: error.message
    });
  }
};

// Cambiar contraseña (usuario propio)
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const usuarioId = req.user.id; // Del token

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({
        error: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Obtener usuario
    const usuario = await prisma.usuarios.findUnique({
      where: { id: usuarioId }
    });

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(passwordActual, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    // Hashear nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordNueva, salt);

    // Actualizar
    await prisma.usuarios.update({
      where: { id: usuarioId },
      data: { password: passwordHash }
    });

    res.json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña',
      message: error.message
    });
  }
};