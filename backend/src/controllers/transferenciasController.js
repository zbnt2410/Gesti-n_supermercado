const prisma = require('../config/database');

// Crear nueva transferencia
exports.crearTransferencia = async (req, res) => {
  try {
    const { fecha, descripcion, monto, turnoId } = req.body;
    const usuarioId = req.user.id; // ✅ del token JWT

    if (!fecha || !descripcion || !monto || !turnoId) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos'
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser mayor a cero'
      });
    }

    const transferencia = await prisma.transferencia.create({
      data: {
        fecha:      new Date(fecha),
        descripcion,
        monto:      parseFloat(monto),
        turnoId:    parseInt(turnoId),
        usuario_id: usuarioId          // ✅ guardar quién registró
      },
      include: {
        turno:    true,
        usuarios: true                 // ✅ retornar usuario en respuesta
      }
    });

    res.status(201).json(transferencia);
  } catch (error) {
    console.error('Error al crear transferencia:', error);
    res.status(500).json({ error: 'Error al crear transferencia', message: error.message });
  }
};

// Obtener todas las transferencias con filtros
exports.getTransferencias = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, turnoId, usuarioId, limit = 50 } = req.query;

    let whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    if (turnoId) {
      whereClause.turnoId = parseInt(turnoId);
    }

    // ✅ filtro por usuario (vista "mis transferencias de hoy")
    if (usuarioId) {
      whereClause.usuario_id = parseInt(usuarioId);
    }

    const transferencias = await prisma.transferencia.findMany({
      where: whereClause,
      include: {
        turno:    true,
        usuarios: true   // ✅ incluir usuario en cada fila
      },
      orderBy: [
        { fecha: 'desc' }
      ],
      take: parseInt(limit)
    });

    const total = transferencias.reduce((sum, t) => sum + parseFloat(t.monto), 0);

    res.json({
      transferencias,
      total: total.toFixed(2),
      count: transferencias.length
    });
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    res.status(500).json({ error: 'Error al obtener transferencias', message: error.message });
  }
};

// Actualizar transferencia
exports.actualizarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, descripcion, monto, turnoId } = req.body;

    const transferencia = await prisma.transferencia.update({
      where: { id: parseInt(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        descripcion: descripcion || undefined,
        monto: monto ? parseFloat(monto) : undefined,
        turnoId: turnoId ? parseInt(turnoId) : undefined
      },
      include: {
        turno:    true,
        usuarios: true   // ✅ incluir usuario en respuesta
      }
    });

    res.json(transferencia);
  } catch (error) {
    console.error('Error al actualizar transferencia:', error);
    res.status(500).json({ error: 'Error al actualizar transferencia', message: error.message });
  }
};

// Eliminar transferencia
exports.eliminarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.transferencia.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Transferencia eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar transferencia:', error);
    res.status(500).json({ error: 'Error al eliminar transferencia', message: error.message });
  }
};