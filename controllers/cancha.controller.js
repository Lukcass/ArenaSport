const Cancha = require('../models/Cancha');
const { responses } = require('../utils/response');

exports.crearCancha = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return responses.forbidden(res, 'Solo administradores pueden crear canchas');
    }

    const { 
      nombre, 
      tipo, 
      precio, 
      ubicacion, 
      capacidad, 
      estado = 'disponible',
      horarios = [], 
      descripcion = ''
    } = req.body;

    const nuevaCancha = new Cancha({
      nombre: nombre?.trim(),
      tipo,
      precio,
      ubicacion,
      capacidad,
      estado,
      descripcion: descripcion?.trim(),
      horarios,
      creador: req.user._id
    });

    await nuevaCancha.save();
    await nuevaCancha.populate('creador', 'nombre email');
    
    return responses.created(res, 'Cancha creada correctamente', nuevaCancha);
  } catch (err) {
    console.error('Error al crear cancha:', err);
    
    if (err.code === 11000) {
      return responses.conflict(res, 'Ya existe una cancha con ese nombre');
    }
    
    if (err.name === 'ValidationError') {
      const errores = Object.values(err.errors).map(e => e.message);
      return responses.badRequest(res, errores.join(', '));
    }
    
    return responses.serverError(res);
  }
};

exports.obtenerMisCanchas = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return responses.forbidden(res, 'Solo administradores pueden ver sus canchas');
    }

    const canchas = await Cancha.find({ 
      creador: req.user._id,
      activa: true 
    })
    .populate('creador', 'nombre email')
    .sort({ createdAt: -1 });

    return responses.success(res, `${canchas.length} cancha(s) encontrada(s)`, canchas);
  } catch (err) {
    console.error('Error al obtener canchas:', err);
    return responses.serverError(res);
  }
};

exports.obtenerCanchaPorId = async (req, res) => {
  try {
    const cancha = await Cancha.findOne({
      _id: req.params.id,
      creador: req.user._id,
      activa: true
    }).populate('creador', 'nombre email');

    if (!cancha) {
      return responses.notFound(res, 'Cancha no encontrada');
    }

    return responses.success(res, 'Cancha obtenida correctamente', cancha);
  } catch (err) {
    console.error('Error al obtener cancha:', err);
    return responses.serverError(res);
  }
};

exports.editarCancha = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return responses.forbidden(res, 'Solo administradores pueden editar canchas');
    }

    const camposPermitidos = [
      'nombre', 'tipo', 'precio', 'ubicacion', 'capacidad', 'estado', 
      'horarios', 'descripcion'
    ];

    const actualizacion = {};
    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        actualizacion[campo] = ['nombre', 'descripcion'].includes(campo) 
          ? req.body[campo]?.trim() 
          : req.body[campo];
      }
    });

    if (Object.keys(actualizacion).length === 0) {
      return responses.badRequest(res, 'No hay campos para actualizar');
    }

    const cancha = await Cancha.findOneAndUpdate(
      { _id: req.params.id, creador: req.user._id, activa: true },
      actualizacion,
      { new: true, runValidators: true }
    ).populate('creador', 'nombre email');

    if (!cancha) {
      return responses.notFound(res, 'Cancha no encontrada');
    }

    return responses.success(res, 'Cancha actualizada correctamente', cancha);
  } catch (err) {
    console.error('Error al editar cancha:', err);
    
    if (err.code === 11000) {
      return responses.conflict(res, 'Ya existe una cancha con ese nombre');
    }
    
    if (err.name === 'ValidationError') {
      const errores = Object.values(err.errors).map(e => e.message);
      return responses.badRequest(res, errores.join(', '));
    }
    
    return responses.serverError(res);
  }
};

exports.eliminarCancha = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return responses.forbidden(res, 'Solo administradores pueden eliminar canchas');
    }

    const cancha = await Cancha.findOneAndUpdate(
      { _id: req.params.id, creador: req.user._id },
      { activa: false, estado: 'no disponible' },
      { new: true }
    );

    if (!cancha) {
      return responses.notFound(res, 'Cancha no encontrada');
    }

    return responses.success(res, 'Cancha eliminada correctamente');
  } catch (err) {
    console.error('Error al eliminar cancha:', err);
    return responses.serverError(res);
  }
};

exports.obtenerCanchasPublicas = async (req, res) => {
  try {
    const { busqueda } = req.query;
    let filtros = { activa: true, estado: 'disponible' };

    if (busqueda) {
      filtros.$or = [
        { nombre: { $regex: busqueda, $options: 'i' } },
        { tipo: { $regex: busqueda, $options: 'i' } }
      ];
    }

    const canchas = await Cancha.find(filtros)
      .populate('creador', 'nombre')
      .sort({ createdAt: -1 });

    return responses.success(res, `${canchas.length} cancha(s) encontrada(s)`, canchas);
  } catch (err) {
    console.error('Error al obtener canchas públicas:', err);
    return responses.serverError(res);
  }
};

exports.obtenerCanchaPublica = async (req, res) => {
  try {
    const cancha = await Cancha.findOne({
      _id: req.params.id,
      activa: true,
      estado: 'disponible'
    }).populate('creador', 'nombre email');

    if (!cancha) {
      return responses.notFound(res, 'Cancha no encontrada');
    }

    return responses.success(res, 'Cancha obtenida correctamente', cancha);
  } catch (err) {
    console.error('Error al obtener cancha pública:', err);
    return responses.serverError(res);
  }
};

exports.obtenerOpciones = async (req, res) => {
  try {
    const opciones = Cancha.obtenerOpciones();
    return responses.success(res, 'Opciones obtenidas', opciones);
  } catch (err) {
    console.error('Error al obtener opciones:', err);
    return responses.serverError(res);
  }
};