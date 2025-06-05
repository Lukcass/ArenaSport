const mongoose = require('mongoose');

const reservaSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cancha: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cancha',
    required: true
  },
  fecha: {
    type: Date,
    required: true
  },
  horaInicio: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido']
  },
  duracion: {
    type: Number,
    required: true,
    enum: [1, 1.5, 2, 2.5, 3, 4]
  },
  participantes: {
    type: String,
    enum: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11-20', '21-30', '30+'],
    required: true
  },
  estado: {
    type: String,
    enum: ['completada', 'cancelada'],
    default: 'completada'
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'nequi'],
    required: true
  },
  precio: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

reservaSchema.pre('save', async function(next) {
  try {
    const [horas, minutos] = this.horaInicio.split(':').map(n => parseInt(n));
    const minutosInicio = horas * 60 + minutos;
    const duracionMinutos = this.duracion * 60;
    const minutosFin = minutosInicio + duracionMinutos;
    
    if (minutosFin > 1440) { 
      return next(new Error('La reserva excede el horario diario'));
    }
    const cancha = await mongoose.model('Cancha').findById(this.cancha);
    if (!cancha || cancha.estado !== 'disponible' || !cancha.activa) {
      return next(new Error('La cancha no está disponible'));
    }
    if (!this.precio && cancha.precio) {
      this.precio = cancha.precio * this.duracion;
    }

    next();
  } catch (error) {
    next(error);
  }
});

reservaSchema.index({ cancha: 1, fecha: 1, estado: 1 });
reservaSchema.index({ usuario: 1, fecha: -1 });

reservaSchema.virtual('duracionFormateada').get(function() {
  if (this.duracion === 1) return '1 hora';
  if (this.duracion === 1.5) return '1.5 horas';
  return `${this.duracion} horas`;
});
reservaSchema.virtual('horaFin').get(function() {
  const [horas, minutos] = this.horaInicio.split(':').map(n => parseInt(n));
  const minutosInicio = horas * 60 + minutos;
  const duracionMinutos = this.duracion * 60;
  const minutosFin = minutosInicio + duracionMinutos;
  
  const horasFin = Math.floor(minutosFin / 60);
  const minutosFin2 = minutosFin % 60;
  
  return `${horasFin.toString().padStart(2, '0')}:${minutosFin2.toString().padStart(2, '0')}`;
});

reservaSchema.virtual('metodoPagoFormateado').get(function() {
  const metodos = {
    'efectivo': 'Efectivo',
    'nequi': 'Nequi'
  };
  return metodos[this.metodoPago] || this.metodoPago;
});

reservaSchema.virtual('estadoFormateado').get(function() {
  const estados = {
    'completada': 'Completada',
    'cancelada': 'Cancelada'
  };
  return estados[this.estado] || this.estado;
});

reservaSchema.virtual('precioFormateado').get(function() {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(this.precio);
});

reservaSchema.set('toJSON', { virtuals: true });
reservaSchema.set('toObject', { virtuals: true });
module.exports = mongoose.model('Reserva', reservaSchema);