const prisma = require('../config/database');

// Crear nuevo envío
exports.crearEnvio = async (req, res) => {
  try {
    const { fecha, hora, descripcion, monto, turnoId, usuario_id } = req.body;

    // Validaciones
    if (!fecha || !hora || !descripcion || !monto || !turnoId) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos'
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser mayor a cero'
      });
    }
    // Convertir hora string ("13:26") a Date válido
    const horaDate = new Date(`1970-01-01T${hora}:00Z`);

    const envio = await prisma.envio.create({
      data: {
        fecha:      new Date(fecha),
        hora:       horaDate,
        descripcion,
        monto:      parseFloat(monto),
        turnoId:    parseInt(turnoId),
        usuario_id: usuario_id ? parseInt(usuario_id) : null
      },
      include: {
        turno:    true,
        usuarios: true
      }
    });

    res.status(201).json(envio);
  } catch (error) {
    console.error('Error al crear envío:', error);
    res.status(500).json({ error: 'Error al crear envío', message: error.message });
  }
};

// Obtener todos los envíos con filtros
exports.getEnvios = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, turnoId, usuarioId, limit = 100 } = req.query;

    let whereClause = {};

    // Default fecha hoy si no vienen parámetros
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Para fechaFin: si viene como string "YYYY-MM-DD" se convierte a inicio del día (00:00:00Z)
    // lo que excluye todos los registros de ese día. Se ajusta al final del día (23:59:59.999)
    const parseFechaFin = (str) => {
      const d = new Date(str);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    whereClause.fecha = {
      gte: fechaInicio ? new Date(fechaInicio) : hoy,
      lte: fechaFin    ? parseFechaFin(fechaFin) : manana
    };

    if (turnoId) {
      whereClause.turnoId = parseInt(turnoId);
    }

    // Filtro por cajero — cada usuario ve solo sus envíos
    if (usuarioId) {
      whereClause.usuario_id = parseInt(usuarioId);
    }

    const envios = await prisma.envio.findMany({
      where: whereClause,
      include: {
        turno:    true,
        usuarios: true
      },
      orderBy: [
        { fecha: 'desc' },
        { hora:  'desc' }
      ],
      take: parseInt(limit)
    });

    // Calcular total
    const total = envios.reduce((sum, envio) => sum + parseFloat(envio.monto), 0);

    res.json({
      envios,
      total: total.toFixed(2),
      count: envios.length
    });
  } catch (error) {
    console.error('Error al obtener envíos:', error);
    res.status(500).json({ error: 'Error al obtener envíos', message: error.message });
  }
};

// Obtener envío por ID
exports.getEnvioById = async (req, res) => {
  try {
    const { id } = req.params;

    const envio = await prisma.envio.findUnique({
      where: { id: parseInt(id) },
      include: {
        turno:    true,
        usuarios: true
      }
    });

    if (!envio) {
      return res.status(404).json({ error: 'Envío no encontrado' });
    }

    res.json(envio);
  } catch (error) {
    console.error('Error al obtener envío:', error);
    res.status(500).json({ error: 'Error al obtener envío', message: error.message });
  }
};

// Actualizar envío
exports.actualizarEnvio = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, descripcion, monto, turnoId } = req.body;

    const envioActualizado = await prisma.envio.update({
      where: { id: parseInt(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        hora: hora && /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora)
        ? new Date(`1970-01-01T${hora}:00Z`)
        : undefined,
        descripcion: descripcion || undefined,
        monto: monto ? parseFloat(monto) : undefined,
        turnoId: turnoId ? parseInt(turnoId) : undefined
      },
      include: {
        turno:    true,
        usuarios: true
      }
    });

    res.json(envioActualizado);
  } catch (error) {
    console.error('Error al actualizar envío:', error);
    res.status(500).json({ error: 'Error al actualizar envío', message: error.message });
  }
};

// Eliminar envío
exports.eliminarEnvio = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.envio.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Envío eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar envío:', error);
    res.status(500).json({ error: 'Error al eliminar envío', message: error.message });
  }
};