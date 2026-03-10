const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Puerto
const PORT = process.env.PORT || 5000;

// Crear pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Crear adapter oficial
const adapter = new PrismaPg(pool);

// Inicializar Prisma con adapter
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'info', 'warn', 'error'],
});

// Conectar a la base de datos
async function connectDB() {
  try {
    await prisma.$connect();
    console.log(' Conectado a PostgreSQL');
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    process.exit(1);
  }
}
connectDB();

// Rutas de ejemplo
app.get('/', (req, res) => {
  res.send('Servidor funcionando ');
});



module.exports = prisma;