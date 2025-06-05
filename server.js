require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');
const app = express();

// ✅ CONFIGURAR TRUST PROXY PARA RENDER
app.set('trust proxy', 1);

const allowedOrigins = [
  'https://zesty-wisp-90c4ff.netlify.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://192.168.1.7:3000',
  'http://192.168.1.7:5500'
];

// ✅ CONFIGURACIÓN CORS MEJORADA
const corsOptions = {
  origin: (origin, callback) => {
    // Permite solicitudes sin origen (como health checks, postman, etc.)
    // y solicitudes de los orígenes permitidos.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Opcional: loguear los orígenes bloqueados para depuración
      console.warn(`🚫 CORS Bloqueado: Origen ${origin} no permitido.`);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(cors(corsOptions));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ✅ RATE LIMITER CONFIGURADO CORRECTAMENTE PARA RENDER
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta en 15 minutos.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
  // ✅ Configuración específica para proxies reversos como Render
  trustProxy: true,
  skip: (req) => {
    // Omitir rate limiting para health checks
    return req.path === '/api/health' || req.path === '/';
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const canchaRoutes = require('./routes/cancha.routes');
const reservaRoutes = require('./routes/reserva.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/reservas', reservaRoutes);

// ✅ HEALTH CHECK SIN CORS RESTRICTION
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor funcionando',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// ✅ ROOT ENDPOINT SIN CORS RESTRICTION
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Reservas de Canchas - ArenaSport',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users', 
      canchas: '/api/canchas',
      reservas: '/api/reservas',
      health: '/api/health'
    },
    documentation: 'https://arenasport.onrender.com/api/health'
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'Acceso no autorizado - CORS',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Registro duplicado',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    timestamp: new Date().toISOString()
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    requestedPath: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    if (process.env.NODE_ENV !== 'test') {
      const server = app.listen(PORT, '0.0.0.0', () => {
        console.log('\n🚀 ArenaSport Backend iniciado');
        console.log(`🌐 URL: https://arenasport.onrender.com`);
        console.log(`🛡️ Entorno: ${process.env.NODE_ENV}`);
        console.log(`📊 Health: https://arenasport.onrender.com/api/health`);
        console.log(`🎯 Frontend: https://zesty-wisp-90c4ff.netlify.app`);
        console.log(`📋 Origins permitidos: ${allowedOrigins.join(', ')}`);
        console.log('\n✅ Sistema listo para producción\n');
      });
      
      const gracefulShutdown = (signal) => {
        console.log(`\n${signal} recibido. Cerrando servidor...`);
        server.close(() => {
          console.log('Servidor cerrado correctamente');
          process.exit(0);
        });
      };
      
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();
module.exports = app;