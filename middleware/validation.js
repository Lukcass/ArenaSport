const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages[0] || 'Errores de validación',
      errors: errorMessages,
      details: errors.array()
    });
  } 
  next();
};
const validarFechaFutura = (campo = 'fecha') => {
  return (req, res, next) => {
    const fecha = req.body[campo] || req.query[campo] || req.params[campo];
    if (fecha) {
      const fechaReserva = new Date(fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaReserva.setHours(0, 0, 0, 0);
      if (fechaReserva < hoy) {
        return res.status(400).json({
          success: false,
          message: 'No se pueden hacer reservas para fechas pasadas'
        });
      }
    }
    next();
  };
};
const validarHorarioTrabajo = (req, res, next) => {
  const { horaInicio, horaFin } = req.body;
  if (horaInicio && horaFin) {
    const convertirAMinutos = (hora) => {
      const [h, m] = hora.split(':').map(n => parseInt(n));
      return h * 60 + m;
    };
    const minutosInicio = convertirAMinutos(horaInicio);
    const minutosFin = convertirAMinutos(horaFin);
    if (minutosInicio < 360 || minutosFin > 1380) {
      return res.status(400).json({
        success: false,
        message: 'Horario de funcionamiento: 06:00 - 23:00'
      });
    }  
    if (minutosFin <= minutosInicio) {
      return res.status(400).json({
        success: false,
        message: 'La hora de fin debe ser mayor que la hora de inicio'
      });
    }
    const duracionMinutos = minutosFin - minutosInicio;
    if (duracionMinutos < 30) {
      return res.status(400).json({
        success: false,
        message: 'La reserva debe tener una duración mínima de 30 minutos'
      });
    }
    if (duracionMinutos > 240) {
      return res.status(400).json({
        success: false,
        message: 'La reserva no puede exceder 4 horas de duración'
      });
    }
  }
  next();
};
const validarObjectId = (paramName) => (req, res, next) => {
  const id = req.params[paramName] || req.body[paramName];
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: `${paramName} inválido`
    });
  }
  next();
};
module.exports = {
  handleValidationErrors,
  validarFechaFutura,
  validarHorarioTrabajo,
  validarObjectId,
};