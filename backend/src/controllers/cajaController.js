const prisma = require('../config/database');

// Función para calcular el total de la caja
const calcularTotalCaja = (caja) => {
  return (
    (caja.billetes20 * 20) +
    (caja.billetes10 * 10) +
    (caja.billetes5 * 5) +
    (caja.monedas1 * 1) +
    (caja.monedas050 * 0.50) +
    (caja.monedas025 * 0.25) +
    (caja.monedas010 * 0.10) +
    (caja.monedas005 * 0.05) +
    (caja.monedas001 * 0.01)
  );
};

// Obtener turnos disponibles
exports.getTurnos = async (req, res) => {
  try {
    const turnos = await prisma.turno.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(turnos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener turnos', message: error.message });
  }
};

// Crear apertura de caja inicial
exports.crearCajaInicial = async (req, res) => {
  try {
    const {
      fecha,
      turnoId,
      billetes20,
      billetes10,
      billetes5,
      monedas1,
      monedas050,
      monedas025,
      monedas010,
      monedas005,
      monedas001,
      usuarioRegistro
    } = req.body;

    const usuarioId = req.user.id; // Del token JWT

    // Verificar si ya existe una caja para esa fecha, turno y usuario
    const cajaExistente = await prisma.cajaInicial.findFirst({
      where: {
        fecha: new Date(fecha),
        turnoId: parseInt(turnoId),
        usuario_id: usuarioId   // <- importante
      }
    });

    if (cajaExistente) {
      return res.status(400).json({
        error: 'Este usuario ya tiene una caja inicial para esta fecha y turno'
      });
    }

   // Crear caja inicial
    const cajaInicial = await prisma.cajaInicial.create({
      data: {
        fecha: new Date(fecha),
        turnoId: parseInt(turnoId),
        usuario_id: usuarioId,
        billetes20: billetes20 !== undefined ? parseInt(billetes20) : 0,
        billetes10: billetes10 !== undefined ? parseInt(billetes10) : 0,
        billetes5: billetes5 !== undefined ? parseInt(billetes5) : 0,
        monedas1: monedas1 !== undefined ? parseInt(monedas1) : 0,
        monedas050: monedas050 !== undefined ? parseInt(monedas050) : 0,
        monedas025: monedas025 !== undefined ? parseInt(monedas025) : 0,
        monedas010: monedas010 !== undefined ? parseInt(monedas010) : 0,
        monedas005: monedas005 !== undefined ? parseInt(monedas005) : 0,
        monedas001: monedas001 !== undefined ? parseInt(monedas001) : 0,
        usuarioRegistro
      },
      include: { turno: true }
    });

    const total = calcularTotalCaja(cajaInicial);

    res.status(201).json({
      ...cajaInicial,
      totalCalculado: total.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al crear caja inicial', message: error.message });
  }
};
// Obtener caja inicial por fecha y turno - SOLO DEL USUARIO
exports.getCajaInicial = async (req, res) => {
  try {
    const { fecha, turnoId } = req.query;
    const usuarioId = req.user.id; // Del token JWT

    const cajaInicial = await prisma.cajaInicial.findFirst({
      where: {
        fecha: new Date(fecha),
        turnoId: parseInt(turnoId),
        usuario_id: usuarioId
      },
      include: { turno: true }
    });

    if (!cajaInicial) {
      return res.status(404).json({ message: 'No se encontró caja inicial para esta fecha y turno' });
    }

    const total = calcularTotalCaja(cajaInicial);

    res.json({
      ...cajaInicial,
      totalCalculado: total.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener caja inicial', message: error.message });
  }
};

// Obtener todas las cajas iniciales - SOLO DEL USUARIO
exports.getCajasIniciales = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, turnoId } = req.query;
    const usuarioId = req.user.id; // Del token JWT

    let whereClause = { usuario_id: usuarioId };

    if (fechaInicio && fechaFin) {
      whereClause.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    if (turnoId) {
      whereClause.turnoId = parseInt(turnoId);
    }

    const cajas = await prisma.cajaInicial.findMany({
      where: whereClause,
      include: { turno: true },
      orderBy: [
        { fecha: 'desc' },
        { turnoId: 'asc' }
      ]
    });

    const cajasConTotal = cajas.map(caja => ({
      ...caja,
      totalCalculado: calcularTotalCaja(caja).toFixed(2)
    }));

    res.json(cajasConTotal);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cajas iniciales', message: error.message });
  }
};

// Actualizar caja inicial - SOLO SI ES DEL USUARIO
exports.actualizarCajaInicial = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id; // Del token JWT
    const {
      billetes20,
      billetes10,
      billetes5,
      monedas1,
      monedas050,
      monedas025,
      monedas010,
      monedas005,
      monedas001
    } = req.body;

    const cajaExistente = await prisma.cajaInicial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cajaExistente) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (cajaExistente.usuario_id !== usuarioId) {
      return res.status(403).json({
        error: 'No autorizado',
        message: 'No puedes modificar la caja de otro usuario'
      });
    }

    const cajaActualizada = await prisma.cajaInicial.update({
      where: { id: parseInt(id) },
      data: {
        billetes20: billetes20 !== undefined ? parseInt(billetes20) : cajaExistente.billetes20,
        billetes10: billetes10 !== undefined ? parseInt(billetes10) : cajaExistente.billetes10,
        billetes5: billetes5 !== undefined ? parseInt(billetes5) : cajaExistente.billetes5,
        monedas1: monedas1 !== undefined ? parseInt(monedas1) : cajaExistente.monedas1,
        monedas050: monedas050 !== undefined ? parseInt(monedas050) : cajaExistente.monedas050,
        monedas025: monedas025 !== undefined ? parseInt(monedas025) : cajaExistente.monedas025,
        monedas010: monedas010 !== undefined ? parseInt(monedas010) : cajaExistente.monedas010,
        monedas005: monedas005 !== undefined ? parseInt(monedas005) : cajaExistente.monedas005,
        monedas001: monedas001 !== undefined ? parseInt(monedas001) : cajaExistente.monedas001
      },
      include: { turno: true }
    });

    const total = calcularTotalCaja(cajaActualizada);

    res.json({
      ...cajaActualizada,
      totalCalculado: total.toFixed(2)
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar caja inicial', message: error.message });
  }
};


// Eliminar caja inicial - SOLO SI ES DEL USUARIO
exports.eliminarCajaInicial = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id; // Del token JWT

    // Verificar que la caja pertenezca al usuario
    const cajaExistente = await prisma.cajaInicial.findUnique({
      where: { id: parseInt(id) }
    });

    if (!cajaExistente) {
      return res.status(404).json({ error: 'Caja no encontrada' });
    }

    if (cajaExistente.usuarioId !== usuarioId) {
      return res.status(403).json({ 
        error: 'No autorizado',
        message: 'No puedes eliminar la caja de otro usuario'
      });
    }

    await prisma.cajaInicial.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Caja inicial eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar caja inicial', message: error.message });
  }
};