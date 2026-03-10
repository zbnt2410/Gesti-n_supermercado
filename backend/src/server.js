const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const cajaRoutes = require('./routes/cajaRoutes');
const proveedoresRoutes = require('./routes/proveedoresRoutes');
const mercadoRoutes = require('./routes/mercadoRoutes');
const facturasRoutes = require('./routes/facturasRoutes');


// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/mercado', mercadoRoutes);
app.use('/api/facturas', facturasRoutes);


// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Sistema de Supermercado API' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error en el servidor',
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(` Servidor corriendo en puerto ${PORT}`);
});