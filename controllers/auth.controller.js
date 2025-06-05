const User = require('../models/User');
const { sendResponse, responses } = require('../utils/response');

const jwt = require('jsonwebtoken');
const generarToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};
const formatearUsuario = (user, token) => ({
  id: user._id,
  nombre: user.nombre,
  email: user.email,
  role: user.role,
  username: user.username || null,
  avatarUrl: user.avatar?.url || '',
  estado: user.estado,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  token
});
const validarDatosRegistro = (datos) => {
  const { nombre, email, password, username } = datos;
  const errores = [];
  if (!nombre?.trim()) errores.push('El nombre es requerido');
  if (!email?.trim()) errores.push('El email es requerido');
  if (!password) errores.push('La contraseña es requerida');
  if (password && password.length < 6) errores.push('La contraseña debe tener al menos 6 caracteres');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email.trim())) {
    errores.push('Formato de email inválido');
  }
  return errores;
};
const registerUser = async (req, res) => {
  try {
    const { nombre, email, password, role, username } = req.body;
    const errores = validarDatosRegistro({ nombre, email, password, username });
    if (errores.length > 0) {
      return responses.badRequest(res, errores.join(', '));
    }
    const emailLimpio = email.toLowerCase().trim();
    const nombreLimpio = nombre.trim();
    const usernameLimpio = username?.trim() || null;
    const existeEmail = await User.findOne({ email: emailLimpio });
    if (existeEmail) {
      return responses.badRequest(res, 'El correo ya está registrado');
    }
    if (usernameLimpio) {
      const existeUsername = await User.findOne({ username: usernameLimpio });
      if (existeUsername) {
        return responses.badRequest(res, 'El nombre de usuario ya está en uso');
      }
    }
    const datosUsuario = {
      nombre: nombreLimpio,
      email: emailLimpio,
      password,
      role: role && ['jugador', 'admin'].includes(role) ? role : 'jugador'
    };
    if (usernameLimpio) {
      datosUsuario.username = usernameLimpio;
    }
    const nuevoUsuario = new User(datosUsuario);
    await nuevoUsuario.save();
    const token = generarToken(nuevoUsuario);
    const userData = formatearUsuario(nuevoUsuario, token);
    console.info(`Nuevo usuario registrado: ${emailLimpio}`);
    return responses.created(res, 'Usuario registrado exitosamente', userData);
  } catch (err) {
    console.error('Error en registro:', err);
    if (err.code === 11000) {
      const campo = Object.keys(err.keyPattern)[0];
      const mensaje = campo === 'email' 
        ? 'El correo ya está registrado' 
        : 'El nombre de usuario ya está en uso';
      return responses.badRequest(res, mensaje);
    }
    if (err.name === 'ValidationError') {
      const errores = Object.values(err.errors).map(error => error.message);
      return responses.badRequest(res, errores.join(', '));
    }
    return responses.serverError(res);
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return responses.badRequest(res, 'Email y contraseña son requeridos');
    }
    const emailLimpio = email.toLowerCase().trim();
    const user = await User.findOne({ 
      email: emailLimpio, 
      estado: 'activo' 
    });
    if (!user) {
      console.warn(`Login fallido: usuario no encontrado - ${emailLimpio}`);
      return responses.unauthorized(res, 'Credenciales inválidas');
    }
    const esValido = await user.comparePassword(password);
    if (!esValido) {
      console.warn(`Login fallido: contraseña incorrecta - ${emailLimpio}`);
      return responses.unauthorized(res, 'Credenciales inválidas');
    }
    const token = generarToken(user);
    const userData = formatearUsuario(user, token);
    console.info(`Login exitoso: ${emailLimpio}`);
    return responses.success(res, 'Inicio de sesión exitoso', userData);
  } catch (err) {
    console.error('Error en login:', err);
    return responses.serverError(res);
  }
};
const verifyToken = async (req, res) => {
  try {
    if (!req.user) {
      return responses.unauthorized(res, 'Token inválido');
    }
    const userData = {
      id: req.user._id,
      nombre: req.user.nombre,
      email: req.user.email,
      role: req.user.role,
      username: req.user.username || null,
      avatarUrl: req.user.avatar?.url || '',
      estado: req.user.estado,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };
    return responses.success(res, 'Token válido', userData);
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return responses.serverError(res);
  }
};
const logoutUser = async (req, res) => {
  try {
    return responses.success(res, 'Sesión cerrada exitosamente');
  } catch (error) {
    console.error('Error en logout:', error);
    return responses.serverError(res);
  }
};
module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  logoutUser
};