require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');

const app = express();
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`🔍 CORS Debug - Origin recibido: ${origin}`);
    
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ Request sin origin permitido');
      return callback(null, true);
    }
    
    // URLs permitidas
    const allowedOrigins = [
      'https://ephemeral-halva-d34024.netlify.app', // ✅ Tu URL actual de Netlify
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5500', // Para Live Server
      'http://localhost:5500'
    ];
    
    // Verificar si el origin está en la lista permitida
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origin permitido: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Origin NO permitido: ${origin}`);
      console.log(`📋 Origins permitidos:`, allowedOrigins);
      callback(new Error(`CORS: Origin ${origin} no está permitido`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware adicional para debugging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Middleware para manejar preflight requests explícitamente
app.options('*', (req, res) => {
  console.log('🚀 Preflight request recibido');
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors(corsOptions));
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting más estricto para producción
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta en 15 minutos.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const canchaRoutes = require('./routes/cancha.routes');
const reservaRoutes = require('./routes/reserva.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/canchas', canchaRoutes);
app.use('/api/reservas', reservaRoutes);

// Health check endpoint
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

// Endpoint raíz
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

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      error: 'Acceso no autorizado',
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

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    requestedPath: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});
app.use(cors(corsOptions));

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
        console.log(`🎯 Frontend: ${process.env.FRONTEND_URL}`);
        console.log('\n✅ Sistema listo para producción\n');
      });
      
      // Graceful shutdown
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