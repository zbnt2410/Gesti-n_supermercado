const { Prisma } = require('@prisma/client');
const prisma = require('../config/database');


// Crear factura
exports.crearFactura = async (req, res) => {
  try {
    const {
      proveedor_id,
      tipo_documento,
      numero_documento,
      fecha_emision,
      monto,
      subida_sistema,
      usuario_subida,
      recibido_por,
      notas
    } = req.body;

    const factura = await prisma.facturas.create({
      data: {
        proveedor_id: parseInt(proveedor_id),
        tipo_documento: tipo_documento || 'factura',
        numero_documento,
        fecha_emision: new Date(fecha_emision),
        monto: new Prisma.Decimal(monto || 0),
        subida_sistema: subida_sistema || false,
        usuario_subida: usuario_subida ? parseInt(usuario_subida) : null,
        recibido_por: parseInt(recibido_por),
        notas: notas || null
      }
    });

    res.status(201).json(factura);
  } catch (error) {
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura', message: error.message });
  }
};

// Obtener facturas con relaciones
exports.getFacturas = async (req, res) => {
  try {
    const { proveedor_id, subida_sistema } = req.query;

    const facturas = await prisma.facturas.findMany({
      where: {
        proveedor_id: proveedor_id ? parseInt(proveedor_id) : undefined,
        subida_sistema: subida_sistema !== undefined ? subida_sistema === 'true' : undefined
      },
      include: {
        proveedores: true,
        usuarios_facturas_usuario_subidaTousuarios: true,
        usuarios_facturas_recibido_porTousuarios: true
      }
    });

    res.json(facturas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener facturas', message: error.message });
  }
};

// Marcar factura como subida
exports.marcarComoSubida = async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioSubida } = req.body;

    const factura = await prisma.facturas.update({
      where: { id: parseInt(id) },
      data: {
        subida_sistema: true,
        usuario_subida: usuarioSubida ? parseInt(usuarioSubida) : null
      },
      include: {
        proveedores: true,
        usuarios_facturas_usuario_subidaTousuarios: true,
        usuarios_facturas_recibido_porTousuarios: true
      }
    });

    res.json({ message: 'Factura marcada como subida', factura });
  } catch (error) {
    console.error('Error al marcar subida:', error);
    res.status(500).json({ error: 'Error al marcar subida', message: error.message });
  }
};

// Desmarcar subida
exports.desmarcarSubida = async (req, res) => {
  try {
    const { id } = req.params;

    const factura = await prisma.facturas.update({
      where: { id: parseInt(id) },
      data: {
        subida_sistema: false,
        usuario_subida: null
      },
      include: {
        proveedores: true,
        usuarios_facturas_usuario_subidaTousuarios: true,
        usuarios_facturas_recibido_porTousuarios: true
      }
    });

    res.json({ message: 'Factura desmarcada como subida', factura });
  } catch (error) {
    console.error('Error al desmarcar subida:', error);
    res.status(500).json({ error: 'Error al desmarcar subida', message: error.message });
  }
};

// Actualizar factura
exports.actualizarFactura = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_documento,
      fecha_emision,
      monto,
      recibido_por,
      notas,
      subida_sistema,
      usuario_subida
    } = req.body;

    const factura = await prisma.facturas.update({
      where: { id: parseInt(id) },
      data: {
        numero_documento,
        fecha_emision: fecha_emision ? new Date(fecha_emision) : undefined,
        monto: monto ? new Prisma.Decimal(monto) : undefined,
        recibido_por: recibido_por ? parseInt(recibido_por) : undefined,
        notas,
        subida_sistema: subida_sistema !== undefined ? subida_sistema : undefined,
        usuario_subida: usuario_subida ? parseInt(usuario_subida) : undefined
      }
    });

    res.json(factura);
  } catch (error) {
    console.error('Error al actualizar factura:', error);
    res.status(500).json({ error: 'Error al actualizar factura', message: error.message });
  }
};

// Eliminar factura
exports.eliminarFactura = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.facturas.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Factura eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    res.status(500).json({ error: 'Error al eliminar factura', message: error.message });
  }
};