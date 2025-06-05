const mongoose = require('mongoose');

const canchaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    unique: true,
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de cancha es obligatorio'],
    enum: {
      values: ['Fútbol', 'Básquetbol', 'Tenis', 'Voleibol'],
      message: 'Tipo de cancha no válido'
    }
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [1000, 'El precio mínimo es 1000']
  },
  estado: {
    type: String,
    enum: {
      values: ['disponible', 'no disponible', 'mantenimiento'],
      message: 'Estado no válido'
    },
    default: 'disponible'
  },
  descripcion: {
    type: String,
    trim: true,
    default: '',
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  ubicacion: {
    type: String,
    required: [true, 'La ubicación es obligatoria'],
    enum: {
      values: ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'],
      message: 'Ubicación no válida'
    }
  },
  capacidad: {
    type: Number,
    required: [true, 'La capacidad es obligatoria'],
    min: [2, 'La capacidad mínima es 2 personas'],
    max: [100, 'La capacidad máxima es 100 personas']
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El creador es obligatorio']
  },
  horarios: [{
    dia: {
      type: String,
      enum: {
        values: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
        message: 'Día no válido'
      },
      required: true
    },
    desde: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    hasta: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    }
  }],
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

canchaSchema.pre('save', function(next) {
  for (let horario of this.horarios) {
    const horaDesde = parseInt(horario.desde.split(':')[0]);
    const horaHasta = parseInt(horario.hasta.split(':')[0]);
    if (horaDesde >= horaHasta) {
      return next(new Error('La hora de inicio debe ser menor que la hora de fin'));
    }
  }
  
  const dias = this.horarios.map(h => h.dia);
  const diasUnicos = [...new Set(dias)];
  if (dias.length !== diasUnicos.length) {
    return next(new Error('No puede haber días duplicados en los horarios'));
  }
  next();
});

canchaSchema.index({ creador: 1, activa: 1 });
canchaSchema.index({ tipo: 1, estado: 1 });
canchaSchema.index({ nombre: 'text', tipo: 'text' });

canchaSchema.virtual('disponible').get(function() {
  return this.estado === 'disponible' && this.activa;
});

canchaSchema.virtual('precioFormateado').get(function() {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(this.precio);
});

canchaSchema.statics.obtenerOpciones = function() {
  return {
    tipos: ['Fútbol', 'Básquetbol', 'Tenis', 'Voleibol'],
    ubicaciones: ['Centro', 'Norte', 'Sur', 'Este', 'Oeste'],
    estados: ['disponible', 'no disponible', 'mantenimiento'],
    dias: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  };
};
module.exports = mongoose.model('Cancha', canchaSchema);