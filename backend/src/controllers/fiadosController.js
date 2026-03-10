const prisma = require('../config/database');

// ─────────────────────────────────────────────
// FIADOS
// ─────────────────────────────────────────────

// Crear nuevo fiado
exports.crearFiado = async (req, res) => {
  try {
    const { fecha, descripcion, monto, nombrePersona, tipoPersona, turnoId } = req.body;
    const usuarioId = req.user.id;

    if (!fecha || !descripcion || !monto || !nombrePersona || !turnoId) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a cero' });
    }

    const tiposValidos = ['empleado', 'cliente', 'jefe'];
    if (tipoPersona && !tiposValidos.includes(tipoPersona)) {
      return res.status(400).json({ error: 'Tipo de persona inválido. Debe ser: empleado, cliente o jefe' });
    }

    const fiado = await prisma.fiado.create({
      data: {
        fecha: new Date(fecha),
        descripcion,
        monto: parseFloat(monto),
        nombrePersona,
        tipoPersona: tipoPersona || 'cliente',
        pagado: false,
        cubierto_por_abono: false,
        turno: { connect: { id: parseInt(turnoId) } },
        usuarios: { connect: { id: usuarioId } }
      },
      include: { turno: true, usuarios: true }
    });

    res.status(201).json(fiado);
  } catch (error) {
    console.error('Error al crear fiado:', error);
    res.status(500).json({ error: 'Error al crear fiado', message: error.message });
  }
};

// Obtener todos los fiados con filtros
exports.getFiados = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, turnoId, pagado, tipoPersona, nombrePersona, registradoPorId, limit = 100 } = req.query;

    let whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fecha = { gte: new Date(fechaInicio), lte: new Date(fechaFin) };
    }
    if (turnoId) whereClause.turnoId = parseInt(turnoId);
    if (pagado !== undefined && pagado !== '') {
      if (pagado === 'false') {
        whereClause.pagado = { not: true }; // cubre false Y null (registros legacy)
      } else {
        whereClause.pagado = true;
      }
    }
    if (tipoPersona) whereClause.tipoPersona = tipoPersona;
    if (nombrePersona) {
      whereClause.nombrePersona = { contains: nombrePersona, mode: 'insensitive' };
    }
    // filtro por usuario registrador (vista "mis fiados pendientes")
    if (registradoPorId) {
      whereClause.registrado_por_id = parseInt(registradoPorId);
    }

    const fiados = await prisma.fiado.findMany({
      where: whereClause,
      include: {
        turno: true,
        usuarios: true,
        abonos: true  // ✅ incluir el abono relacionado si existe
      },
      orderBy: [{ pagado: 'asc' }, { cubierto_por_abono: 'asc' }, { fecha: 'desc' }],
      take: parseInt(limit)
    });

    // totalPendiente real: descuenta abonos parciales ya aplicados
    const totalPendiente = fiados
      .filter(f => !f.pagado && !f.cubierto_por_abono)
      .reduce((sum, f) => {
        const montoAbonado = parseFloat(f.monto_abonado || 0);
        return sum + (parseFloat(f.monto) - montoAbonado);
      }, 0);

    // totalAbonado parcial: suma de abonos parciales pendientes de completar
    const totalAbonadoParcial = fiados
      .filter(f => !f.pagado && !f.cubierto_por_abono)
      .reduce((sum, f) => sum + parseFloat(f.monto_abonado || 0), 0);

    const totalPagado = fiados
      .filter(f => f.pagado || f.cubierto_por_abono)
      .reduce((sum, f) => sum + parseFloat(f.monto), 0);

    // total bruto original de todos los fiados (sin descontar abonos)
    const totalBruto = fiados
      .reduce((sum, f) => sum + parseFloat(f.monto), 0);

    res.json({
      fiados,
      totalPendiente: totalPendiente.toFixed(2),       // deuda real que falta pagar
      totalAbonadoParcial: totalAbonadoParcial.toFixed(2), // abonos parciales aplicados
      totalPagado: totalPagado.toFixed(2),
      total: totalBruto.toFixed(2),                    // total bruto original
      count: fiados.length,
      pendientes: fiados.filter(f => !f.pagado && !f.cubierto_por_abono).length,
      pagados: fiados.filter(f => f.pagado && !f.cubierto_por_abono).length,
      cubiertosAbono: fiados.filter(f => f.cubierto_por_abono).length
    });
  } catch (error) {
    console.error('Error al obtener fiados:', error);
    res.status(500).json({ error: 'Error al obtener fiados', message: error.message });
  }
};

// Marcar fiado como pagado (pago total directo)
exports.marcarFiadoPagado = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaPago } = req.body;

    const fiado = await prisma.fiado.update({
      where: { id: parseInt(id) },
      data: {
        pagado: true,
        fechaPago: fechaPago ? new Date(fechaPago) : new Date()
      },
      include: { turno: true }
    });

    res.json(fiado);
  } catch (error) {
    console.error('Error al marcar fiado como pagado:', error);
    res.status(500).json({ error: 'Error al marcar fiado como pagado', message: error.message });
  }
};

// Actualizar fiado
exports.actualizarFiado = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, descripcion, monto, nombrePersona, tipoPersona, turnoId } = req.body;

    const fiado = await prisma.fiado.update({
      where: { id: parseInt(id) },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        descripcion: descripcion || undefined,
        monto: monto ? parseFloat(monto) : undefined,
        nombrePersona: nombrePersona || undefined,
        tipoPersona: tipoPersona || undefined,
        turno: turnoId ? { connect: { id: parseInt(turnoId) } } : undefined
      },
      include: { turno: true, usuarios: true }
    });

    res.json(fiado);
  } catch (error) {
    console.error('Error al actualizar fiado:', error);
    res.status(500).json({ error: 'Error al actualizar fiado', message: error.message });
  }
};

// Eliminar fiado
exports.eliminarFiado = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.fiado.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'Fiado eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar fiado:', error);
    res.status(500).json({ error: 'Error al eliminar fiado', message: error.message });
  }
};


// ─────────────────────────────────────────────
// ABONOS
// ─────────────────────────────────────────────

/**
 * Registrar un abono para una persona.
 *
 * Lógica:
 * 1. Se buscan todos los fiados pendientes de la persona (ordenados por fecha ASC
 *    para cubrir primero los más antiguos).
 * 2. Se va acumulando el monto del abono y se marcan fiados como cubiertoPorAbono
 *    mientras el saldo alcance.
 * 3. Si el abono supera el total de deuda, el exceso se registra en montoRestante.
 * 4. Se guarda el Abono con referencias a los fiados cubiertos.
 */
exports.crearAbono = async (req, res) => {
  try {
    const { fecha, monto, nombrePersona, tipoPersona, notas } = req.body;
    const usuarioId = req.user.id;

    if (!fecha || !monto || !nombrePersona) {
      return res.status(400).json({ error: 'Fecha, monto y nombre de persona son requeridos' });
    }

    const montoAbono = parseFloat(monto);
    if (montoAbono <= 0) {
      return res.status(400).json({ error: 'El monto del abono debe ser mayor a cero' });
    }

    // Buscar fiados pendientes de la persona (más antiguos primero)
    // { not: true } cubre tanto false como null (registros legacy)
    const fiadosPendientes = await prisma.fiado.findMany({
      where: {
        nombrePersona:      { equals: nombrePersona, mode: 'insensitive' },
        pagado:             { not: true },
        cubierto_por_abono: { not: true }
      },
      orderBy: { fecha: 'asc' }
    });

    const totalDeuda = fiadosPendientes.reduce((sum, f) => sum + parseFloat(f.monto), 0);

    if (fiadosPendientes.length === 0) {
      return res.status(400).json({ error: 'Esta persona no tiene fiados pendientes' });
    }

    // Calcular qué fiados cubre completamente el abono y si sobra para abono parcial
    let saldoRestante = montoAbono;
    const fiadosACubrir = [];    // IDs de fiados que se cubren completos
    let fiadoParcial = null;     // fiado que recibe el saldo sobrante

    for (const fiado of fiadosPendientes) {
      const montoFiado = parseFloat(fiado.monto);
      const montoYaAbonado = parseFloat(fiado.monto_abonado || 0);
      const montoPendienteReal = montoFiado - montoYaAbonado;

      if (saldoRestante >= montoPendienteReal) {
        // El abono cubre este fiado completo
        fiadosACubrir.push(fiado.id);
        saldoRestante -= montoPendienteReal;
      } else if (saldoRestante > 0) {
        // Saldo insuficiente para cubrir el fiado completo — abono parcial
        fiadoParcial = { id: fiado.id, montoAbonado: saldoRestante };
        saldoRestante = 0;
        break;
      } else {
        break;
      }
    }

    const montoAplicado = montoAbono - saldoRestante;

    // Calcular deuda real (descontando abonos parciales previos)
    const totalDeudaReal = fiadosPendientes.reduce((sum, f) => {
      return sum + (parseFloat(f.monto) - parseFloat(f.monto_abonado || 0));
    }, 0);

    // Crear el abono en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // ✅ Crear el abono usando campos snake_case exactos del schema
      const abono = await tx.abonos.create({
        data: {
          fecha:          new Date(fecha),
          nombre_persona: nombrePersona,
          tipo_persona:   tipoPersona || 'cliente',
          monto:          montoAbono,
          monto_aplicado: parseFloat(montoAplicado.toFixed(2)),
          monto_restante: parseFloat(Math.max(0, montoAbono - totalDeudaReal).toFixed(2)),
          notas:          notas || null,
          usuarios: usuarioId ? { connect: { id: usuarioId } } : undefined
        }
      });

      // ✅ Marcar los fiados cubiertos completamente
      if (fiadosACubrir.length > 0) {
        await tx.fiado.updateMany({
          where: { id: { in: fiadosACubrir } },
          data: {
            cubierto_por_abono: true,
            pagado:             true,
            fechaPago:          new Date(fecha),
            abono_id:           abono.id
          }
        });
      }

      // ✅ Aplicar el abono parcial al fiado que no quedó cubierto completo
      if (fiadoParcial) {
        const fiadoActual = await tx.fiado.findUnique({ where: { id: fiadoParcial.id } });
        const montoYaAbonado = parseFloat(fiadoActual.monto_abonado || 0);
        await tx.fiado.update({
          where: { id: fiadoParcial.id },
          data: {
            monto_abonado: parseFloat((montoYaAbonado + fiadoParcial.montoAbonado).toFixed(2)),
            abono_id:      abono.id
          }
        });
      }

      // ✅ Retornar el abono con los fiados vinculados
      return await tx.abonos.findUnique({
        where: { id: abono.id },
        include: { fiados: true, usuarios: true }
      });
    });


    res.status(201).json({
      abono: resultado,
      resumen: {
        montoAbono,
        fiadosCubiertos:  fiadosACubrir.length,
        tieneParcial:     !!fiadoParcial,
        montoAplicado:    parseFloat(montoAplicado.toFixed(2)),
        montoRestante:    parseFloat(Math.max(0, montoAbono - totalDeudaReal).toFixed(2)),
        deudaAnterior:    parseFloat(totalDeudaReal.toFixed(2)),
        deudaRestante:    parseFloat(Math.max(0, totalDeudaReal - montoAbono).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error al crear abono:', error);
    res.status(500).json({ error: 'Error al crear abono', message: error.message });
  }
};

// Obtener historial de abonos con filtros
exports.getAbonos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, nombrePersona, limit = 100 } = req.query;

    let whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fecha = { gte: new Date(fechaInicio), lte: new Date(fechaFin) };
    }
    if (nombrePersona) {
      whereClause.nombre_persona = { contains: nombrePersona, mode: 'insensitive' };
    }

    const abonos = await prisma.abonos.findMany({
      where: whereClause,
      include: {
        fiados:   true,
        usuarios: true
      },
      orderBy: { fecha: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      abonos,
      count: abonos.length,
      totalAbonado: abonos.reduce((s, a) => s + parseFloat(a.monto), 0).toFixed(2)
    });
  } catch (error) {
    console.error('Error al obtener abonos:', error);
    res.status(500).json({ error: 'Error al obtener abonos', message: error.message });
  }
};

// Eliminar un abono y revertir los fiados cubiertos a pendiente
exports.eliminarAbono = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // ✅ Revertir fiados cubiertos completamente por este abono
      await tx.fiado.updateMany({
        where: { abono_id: parseInt(id), cubierto_por_abono: true },
        data: {
          cubierto_por_abono: false,
          pagado:             false,
          fechaPago:          null,
          monto_abonado:      0,
          abono_id:           null
        }
      });

      // ✅ Revertir el abono parcial (fiado que no quedó cubierto completo)
      await tx.fiado.updateMany({
        where: { abono_id: parseInt(id), cubierto_por_abono: false },
        data: {
          monto_abonado: 0,
          abono_id:      null
        }
      });

      // ✅ Eliminar el abono
      await tx.abonos.delete({ where: { id: parseInt(id) } });
    });

    res.json({ message: 'Abono eliminado y fiados revertidos a pendiente' });
  } catch (error) {
    console.error('Error al eliminar abono:', error);
    res.status(500).json({ error: 'Error al eliminar abono', message: error.message });
  }
};

/**
 * Obtener resumen de deuda por persona.
 * Útil para el modal de "registrar abono" para mostrar el total pendiente.
 */
exports.getResumenPersona = async (req, res) => {
  try {
    const { nombrePersona } = req.params;

    // { not: true } cubre tanto false como null (registros legacy)
    const fiadosPendientes = await prisma.fiado.findMany({
      where: {
        nombrePersona:      { equals: nombrePersona, mode: 'insensitive' },
        pagado:             { not: true },
        cubierto_por_abono: { not: true }
      },
      orderBy: { fecha: 'asc' }
    });

    const totalDeuda = fiadosPendientes.reduce((sum, f) => sum + parseFloat(f.monto), 0);

    res.json({
      nombrePersona,
      fiadosPendientes,
      totalDeuda: totalDeuda.toFixed(2),
      cantidadFiados: fiadosPendientes.length
    });
  } catch (error) {
    console.error('Error al obtener resumen de persona:', error);
    res.status(500).json({ error: 'Error al obtener resumen', message: error.message });
  }
};