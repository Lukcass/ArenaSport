// Configuración CORS actualizada para producción
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://ephemeral-halva-d34024.netlify.app', // ✅ URL correcta de tu frontend
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (process.env.NODE_ENV === 'production') {
      // En producción, solo permitir el dominio de Netlify
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log(`CORS: Origen no permitido: ${origin}`); // Para debugging
        callback(new Error('No permitido por CORS'));
      }
    } else {
      // En desarrollo, permitir localhost
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};