// =============================================
// backend/src/controllers/proveedoresController.js
// =============================================

const prisma = require('../config/database');

// ===== GESTIÓN DE PROVEEDORES =====

// Crear proveedor
exports.crearProveedor = async (req, res) => {
  try {
    const { nombre, contacto, telefono } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre,
        contacto: contacto || null,
        telefono: telefono || null,
        activo: true
      }
    });

    res.status(201).json(proveedor);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error al crear proveedor', message: error.message });
  }
};

// Obtener todos los proveedores
exports.getProveedores = async (req, res) => {
  try {
    const { activo } = req.query;

    let whereClause = {};
    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }

    const proveedores = await prisma.proveedor.findMany({
      where: whereClause,
      include: {
        pedido: true
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({ error: 'Error al obtener proveedores', message: error.message });
  }
};

// Actualizar proveedor
exports.actualizarProveedor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, contacto, telefono, activo } = req.body;

    const proveedor = await prisma.proveedor.update({
      where: { id: parseInt(id) },
      data: {
        nombre: nombre || undefined,
        contacto: contacto !== undefined ? contacto : undefined,
        telefono: telefono !== undefined ? telefono : undefined,
        activo: activo !== undefined ? activo : undefined
      }
    });

    res.json(proveedor);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error al actualizar proveedor', message: error.message });
  }
};

// Eliminar proveedor
exports.eliminarProveedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si tiene pagos o pedidos asociados
    const pagos = await prisma.pagoProveedor.count({
      where: { proveedorId: parseInt(id) }
    });

    const pedidos = await prisma.pedido.count({
      where: { proveedorId: parseInt(id) }
    });

    if (pagos > 0 || pedidos > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: 'Este proveedor tiene pagos o pedidos asociados. Considere desactivarlo en su lugar.'
      });
    }

    await prisma.proveedor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error al eliminar proveedor', message: error.message });
  }
};

// ===== DÍAS DE PEDIDO =====

// Configurar días de pedido para un proveedor
exports.configurarDiasPedido = async (req, res) => {
  try {
    const { proveedorId, dias } = req.body; // dias = [0,1,2,3,4,5,6]

    if (!proveedorId || !Array.isArray(dias)) {
      return res.status(400).json({
        error: "proveedorId y dias (array) son requeridos",
      });
    }

    // Eliminar configuración anterior
    await prisma.diaPedidoProveedor.deleteMany({
      where: { proveedorId: parseInt(proveedorId) },
    });

    // Crear nueva configuración
    const diasPedido = await Promise.all(
      dias.map((dia) =>
        prisma.diaPedidoProveedor.create({
          data: {
            proveedorId: parseInt(proveedorId),
            diaSemana: parseInt(dia),
            activo: true,
          },
        })
      )
    );

    res.json(diasPedido);
  } catch (error) {
    console.error("Error al configurar días de pedido:", error);
    res
      .status(500)
      .json({ error: "Error al configurar días", message: error.message });
  }
};

// Obtener proveedores que deben pedir hoy
exports.getProveedoresDelDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaObj = fecha ? new Date(fecha) : new Date();
    const diaSemana = fechaObj.getDay(); // 0=Domingo, 6=Sábado

    const proveedores = await prisma.proveedor.findMany({
      where: {
        activo: true,
        diasPedido: {
          some: {
            diaSemana: diaSemana,
            activo: true,
          },
        },
      },
      include: { diasPedido: true },
    });

    res.json({
      fecha: fechaObj.toISOString().split("T")[0],
      diaSemana,
      proveedores,
    });
  } catch (error) {
    console.error("Error al obtener proveedores del día:", error);
    res
      .status(500)
      .json({ error: "Error al obtener proveedores", message: error.message });
  }
};

// Obtener todos los proveedores
exports.getProveedores = async (req, res) => {
  try {
    const { activo } = req.query;

    let whereClause = {};
    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }

    const proveedores = await prisma.proveedor.findMany({
      where: whereClause,
      include: { diasPedido: true }, // 👈 relación correcta
      orderBy: { nombre: 'asc' }
    });

    res.json(proveedores);
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      error: 'Error al obtener proveedores',
      message: error.message
    });
  }
};

// Crear pedidos del día
exports.crearPedidosDelDia = async (req, res) => {
  try {
    const { fecha, proveedoresIds } = req.body;

    if (!fecha || !Array.isArray(proveedoresIds)) {
      return res.status(400).json({ error: "Datos inválidos" });
    }

    const pedidos = await Promise.all(
      proveedoresIds.map((id) =>
        prisma.pedido.create({
          data: {
            fecha: new Date(fecha),
            proveedorId: id,
            llego: false, // puedes ajustar según tu lógica
          },
        })
      )
    );

    res.json({ message: "Pedidos creados correctamente", pedidos });
  } catch (error) {
    console.error("Error al crear pedidos del día:", error);
    res.status(500).json({
      error: "Error al crear pedidos del día",
      message: error.message,
    });
  }
};

// Obtener proveedores que deben pedir hoy
exports.getProveedoresDelDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaObj = fecha ? new Date(fecha) : new Date();
    const diaSemana = fechaObj.getDay(); // 0=Domingo, 6=Sábado

    const proveedores = await prisma.proveedor.findMany({
      where: {
        activo: true,
        diasPedido: {
          some: {
            diaSemana: diaSemana,
            activo: true
          }
        }
      },
      include: {
        diasPedido: true
      }
    });

    res.json({
      fecha: fechaObj.toISOString().split('T')[0],
      diaSemana,
      proveedores
    });
  } catch (error) {
    console.error('Error al obtener proveedores del día:', error);
    res.status(500).json({ error: 'Error al obtener proveedores', message: error.message });
  }
};

// ===== PAGOS A PROVEEDORES =====

// Obtener pedidos pendientes de pago
exports.getPedidosPendientesPago = async (req, res) => {
  try {
    const { proveedorId } = req.query;

    let whereClause = {
      llego: true,
      pagado: false,
      montoFinal: {
        not: null
      }
    };

    if (proveedorId) {
      whereClause.proveedorId = parseInt(proveedorId);
    }

    const pedidosPendientes = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        proveedor: true
      },
      orderBy: {
        fechaLlegada: 'asc'
      }
    });

    const totalPendiente = pedidosPendientes.reduce(
      (sum, p) => sum + parseFloat(p.montoFinal),
      0
    );

    res.json({
      pedidos: pedidosPendientes,
      estadisticas: {
        total: pedidosPendientes.length,
        totalPendiente: totalPendiente.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos pendientes:', error);
    res.status(500).json({ error: 'Error al obtener pedidos pendientes', message: error.message });
  }
};

// Crear pago (vinculado con pedido)
exports.crearPago = async (req, res) => {
  try {
    const { fecha, hora, proveedorId, monto, tipoPago, turnoId, notas, pedidoId } = req.body;

    if (!fecha || !hora || !proveedorId || !monto || !tipoPago || !turnoId) {
      return res.status(400).json({
        error: 'Todos los campos son requeridos'
      });
    }

    if (parseFloat(monto) <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser mayor a cero'
      });
    }

    const tiposValidos = ['efectivo', 'transferencia'];
    if (!tiposValidos.includes(tipoPago)) {
      return res.status(400).json({
        error: 'Tipo de pago inválido. Debe ser: efectivo o transferencia'
      });
    }

    // Si viene de un pedido, validar que el monto coincida
    if (pedidoId) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: parseInt(pedidoId) }
      });

      if (!pedido) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      if (pedido.pagado) {
        return res.status(400).json({ error: 'Este pedido ya fue pagado' });
      }

      // Validar que el monto sea correcto
      if (parseFloat(monto) !== parseFloat(pedido.montoFinal)) {
        return res.status(400).json({
          error: 'El monto no coincide con el total del pedido',
          montoEsperado: pedido.montoFinal
        });
      }
    }

    // Construir fecha y hora válidas
    const fechaObj = new Date(fecha);
    const [horas, minutos] = hora.split(":");

    // Crear un Date con la fecha y la hora
    const horaObj = new Date(fechaObj);
    horaObj.setHours(parseInt(horas), parseInt(minutos), 0, 0);

    const pago = await prisma.pagoProveedor.create({
    data: {
        fecha: fechaObj,                  
        hora: horaObj,                    
        proveedorId: parseInt(proveedorId),
        monto: parseFloat(monto),
        tipoPago,
        turnoId: parseInt(turnoId),
        notas: notas || null
    },
    include: {
        proveedor: true,
        turno: true
    }
    });

    // Si es pago en efectivo, descontar del efectivo disponible
    if (tipoPago === 'efectivo') {
      const efectivoDelDia = await prisma.efectivoProveedores.findUnique({
        where: { fecha: new Date(fecha) }
      });

      if (efectivoDelDia) {
        await prisma.efectivoProveedores.update({
          where: { fecha: new Date(fecha) },
          data: {
            montoUtilizado: {
              increment: parseFloat(monto)
            }
          }
        });
      }
    }

    // Si viene de un pedido, marcarlo como pagado
    if (pedidoId) {
      await prisma.pedido.update({
        where: { id: parseInt(pedidoId) },
        data: {
          pagado: true,
          fechaPago: new Date(fecha),
          pagoId: pago.id
        }
      });
    }

    res.status(201).json(pago);
  } catch (error) {
    console.error('Error al crear pago:', error);
    res.status(500).json({ error: 'Error al crear pago', message: error.message });
  }
};

// Obtener pagos con filtros
exports.getPagos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, proveedorId, tipoPago, turnoId, limit = 100 } = req.query;

    let whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    if (proveedorId) {
      whereClause.proveedorId = parseInt(proveedorId);
    }

    if (tipoPago) {
      whereClause.tipoPago = tipoPago;
    }

    if (turnoId) {
      whereClause.turnoId = parseInt(turnoId);
    }

    const pagos = await prisma.pagoProveedor.findMany({
      where: whereClause,
      include: {
        proveedor: true,
        turno: true
      },
      orderBy: [
        { fecha: 'desc' },
        { hora: 'desc' }
      ],
      take: parseInt(limit)
    });

    const totalEfectivo = pagos
      .filter(p => p.tipoPago === 'efectivo')
      .reduce((sum, p) => sum + parseFloat(p.monto), 0);

    const totalTransferencia = pagos
      .filter(p => p.tipoPago === 'transferencia')
      .reduce((sum, p) => sum + parseFloat(p.monto), 0);

    res.json({
      pagos,
      estadisticas: {
        total: pagos.length,
        totalEfectivo: totalEfectivo.toFixed(2),
        totalTransferencia: totalTransferencia.toFixed(2),
        totalGeneral: (totalEfectivo + totalTransferencia).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos', message: error.message });
  }
};

// Eliminar pago
exports.eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await prisma.pagoProveedor.findUnique({
      where: { id: parseInt(id) }
    });

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Si era efectivo, devolver al efectivo disponible
    if (pago.tipoPago === 'efectivo') {
      const efectivoDelDia = await prisma.efectivoProveedores.findUnique({
        where: { fecha: pago.fecha }
      });

      if (efectivoDelDia) {
        await prisma.efectivoProveedores.update({
          where: { fecha: pago.fecha },
          data: {
            montoUtilizado: {
              decrement: parseFloat(pago.monto)
            }
          }
        });
      }
    }

    // Si estaba vinculado a un pedido, desmarcar el pedido como pagado
    const pedidoVinculado = await prisma.pedido.findFirst({
      where: { pagoId: parseInt(id) }
    });

    if (pedidoVinculado) {
      await prisma.pedido.update({
        where: { id: pedidoVinculado.id },
        data: {
          pagado: false,
          fechaPago: null,
          pagoId: null
        }
      });
    }

    await prisma.pagoProveedor.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Pago eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: 'Error al eliminar pago', message: error.message });
  }
};

// ===== EFECTIVO PARA PROVEEDORES (DINERO DEL JEFE) =====

// Registrar efectivo del día
exports.registrarEfectivo = async (req, res) => {
  try {
    const { fecha, montoInicial, notas } = req.body;

    if (!fecha || !montoInicial) {
      return res.status(400).json({
        error: 'Fecha y monto inicial son requeridos'
      });
    }

    if (parseFloat(montoInicial) <= 0) {
      return res.status(400).json({
        error: 'El monto debe ser mayor a cero'
      });
    }

    // Verificar si ya existe
    const existente = await prisma.efectivoProveedor.findUnique({
      where: { fecha: new Date(fecha) }
    });

    if (existente) {
      return res.status(400).json({
        error: 'Ya existe un registro de efectivo para esta fecha'
      });
    }

    const efectivo = await prisma.efectivoProveedor.create({
      data: {
        fecha: new Date(fecha),
        montoInicial: parseFloat(montoInicial),
        montoUtilizado: 0,
        notas: notas || null
      }
    });

    res.status(201).json(efectivo);
  } catch (error) {
    console.error('Error al registrar efectivo:', error);
    res.status(500).json({ error: 'Error al registrar efectivo', message: error.message });
  }
};

// Obtener efectivo del día
exports.getEfectivoDelDia = async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaBuscar = fecha ? new Date(fecha) : new Date();

    const efectivo = await prisma.efectivoProveedor.findUnique({
      where: { fecha: fechaBuscar }
    });

    if (!efectivo) {
      return res.status(404).json({
        message: 'No hay efectivo registrado para esta fecha',
        fecha: fechaBuscar.toISOString().split('T')[0]
      });
    }

    res.json(efectivo);
  } catch (error) {
    console.error('Error al obtener efectivo:', error);
    res.status(500).json({ error: 'Error al obtener efectivo', message: error.message });
  }
};

// ===== PEDIDOS =====

// Crear pedido
exports.crearPedido = async (req, res) => {
  try {
    const {
      fecha,
      proveedorId,
      llego,
      fechaLlegada,
      montoFactura,
      descuento,
      productosCaducados,
      notas
    } = req.body;

    if (!fecha || !proveedorId) {
      return res.status(400).json({
        error: 'Fecha y proveedor son requeridos'
      });
    }

    const montoFinal = montoFactura && descuento
      ? parseFloat(montoFactura) - parseFloat(descuento)
      : montoFactura ? parseFloat(montoFactura) : null;

    const pedido = await prisma.pedido.create({
      data: {
        fecha: new Date(fecha),
        proveedorId: parseInt(proveedorId),
        llego: llego || false,
        fechaLlegada: fechaLlegada ? new Date(fechaLlegada) : null,
        montoFactura: montoFactura ? parseFloat(montoFactura) : null,
        descuento: descuento ? parseFloat(descuento) : 0,
        montoFinal: montoFinal,
        productosCaducados: productosCaducados || null,
        notas: notas || null
      },
      include: {
        proveedor: true
      }
    });

    res.status(201).json(pedido);
  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ error: 'Error al crear pedido', message: error.message });
  }
};

// Obtener pedidos con filtros
exports.getPedidos = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, proveedorId, llego, limit = 100 } = req.query;

    let whereClause = {};

    if (fechaInicio && fechaFin) {
      whereClause.fecha = {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      };
    }

    if (proveedorId) {
      whereClause.proveedorId = parseInt(proveedorId);
    }

    if (llego !== undefined) {
      whereClause.llego = llego === 'true';
    }

    const pedidos = await prisma.pedido.findMany({
      where: whereClause,
      include: {
        proveedor: true
      },
      orderBy: [
        { fecha: 'desc' }
      ],
      take: parseInt(limit)
    });

    res.json({
      pedidos,
      estadisticas: {
        total: pedidos.length,
        llegados: pedidos.filter(p => p.llego).length,
        pendientes: pedidos.filter(p => !p.llego).length
      }
    });
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos', message: error.message });
  }
};

// Actualizar pedido
exports.actualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      llego,
      fechaLlegada,
      montoFactura,
      descuento,
      productosCaducados,
      notas
    } = req.body;

    let updateData = {};

    if (llego !== undefined) updateData.llego = llego;
    if (fechaLlegada) updateData.fechaLlegada = new Date(fechaLlegada);
    if (montoFactura !== undefined) updateData.montoFactura = parseFloat(montoFactura);
    if (descuento !== undefined) updateData.descuento = parseFloat(descuento);
    if (productosCaducados !== undefined) updateData.productosCaducados = productosCaducados;
    if (notas !== undefined) updateData.notas = notas;

    // Calcular monto final si hay factura y descuento
    if (montoFactura !== undefined || descuento !== undefined) {
      const pedidoActual = await prisma.pedido.findUnique({
        where: { id: parseInt(id) }
      });

      const factura = montoFactura !== undefined ? parseFloat(montoFactura) : parseFloat(pedidoActual.montoFactura || 0);
      const desc = descuento !== undefined ? parseFloat(descuento) : parseFloat(pedidoActual.descuento || 0);

      updateData.montoFinal = factura - desc;
    }

    const pedido = await prisma.pedido.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        proveedor: true
      }
    });

    res.json(pedido);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ error: 'Error al actualizar pedido', message: error.message });
  }
};

// Eliminar pedido
exports.eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.pedido.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Pedido eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar pedido:', error);
    res.status(500).json({ error: 'Error al eliminar pedido', message: error.message });
  }
};