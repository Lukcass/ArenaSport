const { cloudinary } = require('../config/cloudinary');
const User = require('../models/User');

const fs = require('fs').promises;
const sendResponse = (res, statusCode, success, message, data = null) => {
  const response = {
    success,
    timestamp: new Date().toISOString(),
    ...(success ? { message, data } : { error: message })
  };
  return res.status(statusCode).json(response);
};
const cleanupTempFile = async (filePath) => {
  try {
    if (filePath) await fs.unlink(filePath);
  } catch (err) {
    console.warn('Error al limpiar archivo temporal:', err.message);
  }
};
const formatUserData = (user) => ({
  id: user._id,
  nombre: user.nombre,
  email: user.email,
  username: user.username || null,
  role: user.role,
  avatarUrl: user.avatar?.url || '',
  estado: user.estado,
  createdAt: user.createdAt
});
exports.obtenerPerfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.estado === 'inactivo') {
      return sendResponse(res, 404, false, 'Usuario no encontrado');
    }
    sendResponse(res, 200, true, 'Perfil obtenido correctamente', formatUserData(user));
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    sendResponse(res, 500, false, 'Error interno del servidor');
  }
};
exports.editarPerfil = async (req, res) => {
  try {
    const { nombre, password, username } = req.body; 
    const user = await User.findById(req.user._id);
    if (!user || user.estado === 'inactivo') {
      return sendResponse(res, 404, false, 'Usuario no encontrado');
    }
    if (nombre) user.nombre = nombre.trim();
    if (password) user.password = password;
    if (username !== undefined) {
      if (username === '' || username === null) {
        user.username = undefined;
      } else {
        const existente = await User.findOne({ 
          username: username.trim(), 
          _id: { $ne: req.user._id } 
        });
        if (existente) return sendResponse(res, 400, false, 'Username ya en uso');
        user.username = username.trim();
      }
    }
    await user.save();
    sendResponse(res, 200, true, 'Perfil actualizado correctamente', formatUserData(user));
  } catch (error) {
    console.error('Error al actualizar perfil:', error);  
    if (error.code === 11000) {
      const campo = Object.keys(error.keyPattern)[0];
      const mensaje = campo === 'email' ? 'El email ya está en uso' : 'El username ya está en uso';
      return sendResponse(res, 400, false, mensaje);
    }
    sendResponse(res, 500, false, 'Error al actualizar perfil');
  }
};
exports.subirAvatar = async (req, res) => {
  let tempFilePath = null; 
  try {
    if (!req.file?.path) {
      return sendResponse(res, 400, false, 'No se recibió ninguna imagen');
    } 
    tempFilePath = req.file.path;
    const user = await User.findById(req.user._id);
    if (!user || user.estado === 'inactivo') {
      return sendResponse(res, 404, false, 'Usuario no encontrado');
    }
    if (user.avatar?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (err) {
        console.warn('Error al eliminar avatar anterior:', err.message);
      }
    }
    const resultado = await cloudinary.uploader.upload(tempFilePath, {
      folder: 'avatars',
      public_id: `avatar_${user._id}_${Date.now()}`,
      transformation: [{ 
        width: 300, 
        height: 300, 
        crop: 'fill', 
        gravity: 'face',
        quality: 'auto:good'
      }]
    });
    user.avatar = {
      url: resultado.secure_url,
      public_id: resultado.public_id
    };
    await user.save();
    sendResponse(res, 200, true, 'Avatar actualizado correctamente', {
      avatarUrl: user.avatar.url
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    sendResponse(res, 500, false, 'Error al subir el avatar');
  } finally {
    await cleanupTempFile(tempFilePath);
  }
};
exports.eliminarAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user._id); 
    if (!user || user.estado === 'inactivo') {
      return sendResponse(res, 404, false, 'Usuario no encontrado');
    }
    if (!user.avatar?.public_id) {
      return sendResponse(res, 400, false, 'No hay avatar para eliminar');
    } 
    await cloudinary.uploader.destroy(user.avatar.public_id);
    user.avatar = { url: '', public_id: '' };
    await user.save();
    sendResponse(res, 200, true, 'Avatar eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    sendResponse(res, 500, false, 'Error al eliminar el avatar');
  }
};
exports.eliminarCuenta = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendResponse(res, 404, false, 'Usuario no encontrado');
    if (user.estado === 'inactivo') {
      return sendResponse(res, 400, false, 'Cuenta ya desactivada');
    }
    if (user.avatar?.public_id) {
      try {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      } catch (err) {
        console.warn('Error al eliminar avatar:', err.message);
      }
    }
    user.estado = 'inactivo';
    user.avatar = { url: '', public_id: '' };
    await user.save();
    sendResponse(res, 200, true, 'Cuenta desactivada correctamente. Si deseas recuperarla, contacta al desarrollador.');
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    sendResponse(res, 500, false, 'Error al eliminar la cuenta');
  }
};
exports.cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) {
      return sendResponse(res, 400, false, 'Contraseñas requeridas');
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return sendResponse(res, 404, false, 'Usuario no encontrado');
    const match = await user.comparePassword(passwordActual);
    if (!match) return sendResponse(res, 400, false, 'Contraseña actual incorrecta');    
    user.password = passwordNueva;
    await user.save();   
    sendResponse(res, 200, true, 'Contraseña cambiada correctamente');
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    sendResponse(res, 500, false, 'Error al cambiar contraseña');
  }
};