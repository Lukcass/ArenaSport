const Cancha = require('../models/Cancha');
const Reserva = require('../models/Reserva');
const { responses } = require('../utils/response');

const validarPermisosReserva = (reserva, user) => {
  return user.role === 'admin' || reserva.usuario.toString() === user._id.toString();
};

exports.crearReserva = async (req, res) => {
  try {
    const { cancha, fecha, horaInicio, duracion, participantes, metodoPago } = req.body;
    
    const canchaDoc = await Cancha.findById(cancha);
    if (!canchaDoc || canchaDoc.estado !== 'disponible' || !canchaDoc.activa) {
      return responses.badRequest(res, 'La cancha no está disponible');
    }

    const nuevaReserva = new Reserva({
      usuario: req.user._id,
      cancha,
      fecha,
      horaInicio,
      duracion,
      participantes,
      metodoPago
    });

    await nuevaReserva.save();
    await nuevaReserva.populate([
      { path: 'cancha', select: 'nombre tipo precio ubicacion' },
      { path: 'usuario', select: 'nombre email' }
    ]);

    return responses.created(res, 'Reserva creada exitosamente', nuevaReserva);
  } catch (error) {
    console.error('Error al crear reserva:', error);
    return responses.badRequest(res, error.message || 'Error al crear la reserva');
  }
};

exports.obtenerMisReservas = async (req, res) => {
  try {
    const reservas = await Reserva.find({ usuario: req.user._id })
      .populate('cancha', 'nombre tipo precio ubicacion')
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1, horaInicio: -1 });

    return responses.success(res, 'Reservas obtenidas', reservas);
  } catch (error) {
    console.error('Error al obtener reservas del usuario:', error);
    return responses.serverError(res, 'Error al obtener tus reservas');
  }
};

exports.obtenerReservasDeMisCanchas = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return responses.forbidden(res, 'Solo administradores pueden ver reservas de sus canchas');
    }
    const misCanchas = await Cancha.find({ 
      creador: req.user._id,
      activa: true 
    }).select('_id');

    const canchaIds = misCanchas.map(cancha => cancha._id);

    const reservas = await Reserva.find({ cancha: { $in: canchaIds } })
      .populate('cancha', 'nombre tipo precio ubicacion')
      .populate('usuario', 'nombre email')
      .sort({ fecha: -1, horaInicio: -1 });

    return responses.success(res, 'Reservas obtenidas', reservas);
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return responses.serverError(res, 'Error al obtener las reservas');
  }
};

exports.actualizarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, horaInicio, duracion, participantes, metodoPago } = req.body;
    const reserva = await Reserva.findById(id);
    
    if (!reserva) {
      return responses.notFound(res, 'Reserva no encontrada');
    }
    if (!validarPermisosReserva(reserva, req.user)) {
      return responses.forbidden(res, 'No tienes permisos para actualizar esta reserva');
    }
    if (reserva.estado === 'cancelada') {
      return responses.badRequest(res, 'No se puede actualizar una reserva cancelada');
    }
    if (req.body.cancha && req.body.cancha !== reserva.cancha.toString()) {
      const nuevaCancha = await Cancha.findById(req.body.cancha);
      if (!nuevaCancha || nuevaCancha.estado !== 'disponible' || !nuevaCancha.activa) {
        return responses.badRequest(res, 'La nueva cancha no está disponible');
      }
    }
    const camposPermitidos = ['fecha', 'horaInicio', 'duracion', 'participantes', 'metodoPago', 'cancha'];
    const actualizaciones = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        actualizaciones[campo] = req.body[campo];
      }
    });
    const reservaActualizada = await Reserva.findByIdAndUpdate(
      id,
      actualizaciones,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate([
      { path: 'cancha', select: 'nombre tipo precio ubicacion' },
      { path: 'usuario', select: 'nombre email' }
    ]);

    return responses.success(res, 'Reserva actualizada exitosamente', reservaActualizada);
  } catch (error) {
    console.error('Error al actualizar reserva:', error);
    return responses.badRequest(res, error.message || 'Error al actualizar la reserva');
  }
};

exports.cancelarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);
    
    if (!reserva) {
      return responses.notFound(res, 'Reserva no encontrada');
    }

    if (!validarPermisosReserva(reserva, req.user)) {
      return responses.forbidden(res, 'No tienes permisos para cancelar esta reserva');
    }

    if (reserva.estado === 'cancelada') {
      return responses.badRequest(res, 'La reserva ya está cancelada');
    }

    reserva.estado = 'cancelada';
    await reserva.save();

    return responses.success(res, 'Reserva cancelada exitosamente. Se procesará tu reembolso en las próximas 24-48 horas.');
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    return responses.badRequest(res, error.message || 'Error al cancelar la reserva');
  }
};