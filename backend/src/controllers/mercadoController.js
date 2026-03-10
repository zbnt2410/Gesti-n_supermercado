// =============================================
// backend/src/controllers/mercadoController.js
// =============================================

const prisma = require('../config/database');

// Función para calcular valores automáticos o manuales
const calcularValores = (costo, cantidad, cantidadPorDolar = null) => {
  const costoFloat = Number(costo);
  const cantidadFloat = Number(cantidad);

  if (isNaN(costoFloat) || isNaN(cantidadFloat) || cantidadFloat <= 0) {
    throw new Error('Costo y cantidad deben ser números válidos y cantidad > 0');
  }

  const costoUnitario = costoFloat / cantidadFloat;
  const ventaPorUnidad = costoUnitario * 1.50;

  let cantidadPorDolarFinal;
  let precioVentaUnitario;
  let rentabilidad;

  if (cantidadPorDolar) {
    const manualFloat = Number(cantidadPorDolar);
    if (isNaN(manualFloat) || manualFloat <= 0) {
      throw new Error('Cantidad por dólar debe ser un número válido mayor a 0');
    }
    cantidadPorDolarFinal = manualFloat;
    precioVentaUnitario = 1.0 / cantidadPorDolarFinal;
  } else {
    cantidadPorDolarFinal = 1.0 / ventaPorUnidad;
    precioVentaUnitario = ventaPorUnidad;
  }

  rentabilidad = 1.0 - (costoUnitario / precioVentaUnitario);

  const to5 = (n) => Number(Number(n).toFixed(5));

  return {
    costoUnitario: to5(costoUnitario),
    ventaPorUnidad: to5(ventaPorUnidad),
    cantidadPorDolar: to5(cantidadPorDolarFinal),
    precioVentaUnitario: to5(precioVentaUnitario),
    rentabilidad: to5(rentabilidad)
  };
};


// Validar rentabilidad mínima (solo advertencia, no bloquea)
const validarRentabilidad = (rentabilidad) => {
  const RENTABILIDAD_MINIMA = 0.333333; // 33.3333%
  return rentabilidad >= RENTABILIDAD_MINIMA;
};

// -------------------------
// Crear producto del mercado
// -------------------------
exports.crearProducto = async (req, res) => {
  try {
    const { fecha, nombre, costo, tipoVenta, cantidad, cantidadPorDolar, precioLibra } = req.body;

    // Validaciones básicas
    if (!fecha || !nombre || costo === undefined || !tipoVenta || cantidad === undefined) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (Number(costo) <= 0) {
      return res.status(400).json({ error: 'El costo debe ser mayor a cero' });
    }

    if (Number(cantidad) <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a cero' });
    }

    const tiposValidos = ['unidad', 'libra'];
    if (!tiposValidos.includes(tipoVenta)) {
      return res.status(400).json({ error: 'Tipo de venta inválido. Debe ser: unidad o libra' });
    }

    // Calcular valores automáticos (aca pasamos correctamente el manual override)
    const valores = calcularValores(costo, cantidad, cantidadPorDolar);

    // No bloqueamos por rentabilidad: solo advertimos
    const rentabilidadValida = validarRentabilidad(valores.rentabilidad);

    // Precio por libra si aplica (usamos ventaPorUnidad)
    let precioLibraCalculated = null;
    if (tipoVenta === 'libra') {
      precioLibraCalculated = valores.ventaPorUnidad;
    }

    // Crear producto en la base de datos (solo campos editables)
    const producto = await prisma.productoMercado.create({
      data: {
        fecha: new Date(fecha),
        nombre,
        costo: Number(costo),
        tipoVenta,
        cantidad: Number(cantidad),
        cantidadPorDolar: valores.cantidadPorDolar, // este sí es manual
        precioLibra: precioLibra
          ? Number(Number(precioLibra).toFixed(5))
          : precioLibraCalculated
            ? Number(precioLibraCalculated.toFixed(5))
            : null,
        rentabilidad: valores.rentabilidad,
        activo: true,
        vendido: false
      }
    });

    res.status(201).json({
      ...producto,
      valoresCalculados: valores,
      rentabilidadValida,
      advertencia: !rentabilidadValida ? 'La rentabilidad es menor al 33.33% recomendado' : null
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto', message: error.message });
  }
};
exports.getProductos = async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      tipoVenta, 
      activo, 
      vendido,
      limit = 100 
    } = req.query;

    const whereClause = {};

    // Si no vienen fechas, usar el día de hoy como default
    // Así el módulo muestra solo los productos del día al cargar
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const fechaDesde = fechaInicio ? new Date(fechaInicio) : hoy;
    const fechaHasta = fechaFin    ? new Date(fechaFin)    : manana;

    whereClause.fecha = {
      gte: fechaDesde,
      lte: fechaHasta
    };

    if (tipoVenta && tipoVenta !== 'todos') {
      whereClause.tipoVenta = tipoVenta;
    }

    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }

    if (vendido !== undefined) {
      whereClause.vendido = vendido === 'true';
    }

    const productos = await prisma.productoMercado.findMany({
      where: whereClause,
      orderBy: [
        { fecha: 'desc' },
        { createdAt: 'desc' }
      ],
      take: parseInt(limit)
    });
    
    // Calcular estadísticas
    const totalInvertido = productos.reduce((sum, p) => sum + (Number(p.costo) || 0), 0);

    const costoTotal = productos.reduce((sum, p) => {
      const costo = Number(p.costo) || 0;
      const cantidad = Number(p.cantidad) || 0;
      return sum + (costo * cantidad);
    }, 0);

    const promedioRentabilidad = productos.length > 0
      ? productos.reduce((sum, p) => sum + (Number(p.rentabilidad) || 0), 0) / productos.length
      : 0;

    res.json({
      productos,
      estadisticas: {
        total: productos.length,
        totalInvertido: totalInvertido.toFixed(2),
        costoTotal: costoTotal.toFixed(2),
        promedioRentabilidad: Number(promedioRentabilidad).toFixed(5),
        porUnidad: productos.filter(p => p.tipoVenta === 'unidad').length,
        porLibra: productos.filter(p => p.tipoVenta === 'libra').length,
        activos: productos.filter(p => p.activo).length,
        vendidos: productos.filter(p => p.vendido).length
      }
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos', message: error.message });
  }
};


// -------------------------
// Obtener producto por ID
// -------------------------
exports.getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    const idInt = parseInt(id);

    if (isNaN(idInt)) {
      return res.status(400).json({ error: 'ID inválido. Debe ser un número entero.' });
    }

    const producto = await prisma.productoMercado.findUnique({
      where: { id: idInt }
    });

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Prisma ya devuelve los campos calculados (costoUnitario, ventaPorUnidad, rentabilidad)
    res.json({
      ...producto,
      // opcional: puedes recalcular valores en backend para mostrar consistencia
      valoresCalculados: {
        costoUnitario: Number(producto.costoUnitario),
        ventaPorUnidad: Number(producto.ventaPorUnidad),
        cantidadPorDolar: Number(producto.cantidadPorDolar),
        rentabilidad: Number(producto.rentabilidad)
      }
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto', message: error.message });
  }
};
// -------------------------
// Actualizar producto
// -------------------------
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, nombre, costo, tipoVenta, cantidad, cantidadPorDolar, precioLibra } = req.body;

    const productoActual = await prisma.productoMercado.findUnique({ where: { id: parseInt(id) } });
    if (!productoActual) return res.status(404).json({ error: 'Producto no encontrado' });

    const costoFinal = costo !== undefined ? Number(costo) : Number(productoActual.costo);
    const cantidadFinal = cantidad !== undefined ? Number(cantidad) : Number(productoActual.cantidad);
    const tipoVentaFinal = tipoVenta || productoActual.tipoVenta;

    if (costoFinal <= 0 || cantidadFinal <= 0) {
      return res.status(400).json({ error: 'El costo y la cantidad deben ser mayores a cero' });
    }

    // Recalcular valores (solo para mostrar al usuario, no para guardar en DB)
    const valores = calcularValores(costoFinal, cantidadFinal, cantidadPorDolar);
    const precioLibraCalculated = tipoVentaFinal === 'libra' ? valores.ventaPorUnidad : null;

    const updateData = {
      fecha: fecha ? new Date(fecha) : undefined,
      nombre: nombre || undefined,
      tipoVenta: tipoVenta || undefined,
      costo: costoFinal,
      cantidad: cantidadFinal,
      // cantidadPorDolar es manual, sí se guarda
      cantidadPorDolar: valores.cantidadPorDolar,
      precioLibra: precioLibra
        ? Number(Number(precioLibra).toFixed(5))
        : precioLibraCalculated
          ? Number(precioLibraCalculated.toFixed(5))
          : null,
        //rentabilidad: valores.rentabilidad
    };

    const productoActualizado = await prisma.productoMercado.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      ...productoActualizado,
      valoresCalculados: valores
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto', message: error.message });
  }
};

// Marcar producto como vendido
exports.marcarVendido = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await prisma.productoMercado.update({
      where: { id: parseInt(id) },
      data: {
        vendido: true,
        activo: false
      }
    });

    res.json(producto);
  } catch (error) {
    console.error('Error al marcar como vendido:', error);
    res.status(500).json({ 
      error: 'Error al marcar como vendido', 
      message: error.message 
    });
  }
};

// Cambiar estado activo
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const producto = await prisma.productoMercado.update({
      where: { id: parseInt(id) },
      data: {
        activo: activo === true || activo === 'true'
      }
    });

    res.json(producto);
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ 
      error: 'Error al cambiar estado', 
      message: error.message 
    });
  }
};

// Eliminar producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.productoMercado.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ 
      error: 'Error al eliminar producto', 
      message: error.message 
    });
  }
};

// Calcular valores sin guardar (para preview)
exports.calcularPreview = async (req, res) => {
  try {
    const { costo, cantidad, cantidadPorDolar } = req.body;

    if (!costo || !cantidad) {
      return res.status(400).json({ error: 'Costo y cantidad son requeridos' });
    }

    const valores = calcularValores(costo, cantidad, cantidadPorDolar);

    res.json({
      ...valores,
      rentabilidadInfo: {
        esMayorAlRecomendado: valores.rentabilidad >= 0.333333,
        umbral: 0.333333,
        mensaje: valores.rentabilidad >= 0.333333
          ? 'Rentabilidad superior al 33.3% (buena)'
          : 'Rentabilidad inferior al 33.3% (puede mejorar)'
      }
    });
  } catch (error) {
    console.error('Error al calcular preview:', error);
    res.status(500).json({ error: 'Error al calcular valores', message: error.message });
  }
};