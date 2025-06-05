const User = require('../models/User');
const { responses } = require('../utils/response');

const jwt = require('jsonwebtoken');
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return responses.unauthorized(res, 'Token de acceso requerido');
    }
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    if (!token) {
      return responses.unauthorized(res, 'Token de acceso requerido');
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      const errorMessages = {
        'TokenExpiredError': 'Token expirado. Por favor, inicia sesión nuevamente',
        'JsonWebTokenError': 'Token inválido',
        'NotBeforeError': 'Token no es válido aún'
      };
      return responses.unauthorized(res, errorMessages[jwtError.name] || 'Token inválido');
    }
    const userId = decoded.id;
    if (!userId) {
      return responses.unauthorized(res, 'Token inválido - ID de usuario no encontrado');
    }
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return responses.unauthorized(res, 'Usuario no encontrado');
    }
    if (user.estado === 'inactivo') {
      return responses.unauthorized(res, 'Cuenta desactivada. Contacta al administrador');
    }
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    console.error('Error en authMiddleware:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return responses.serverError(res);
  }
};
/**
 * Middleware de autorización por roles
 * @param {string|string[]} allowedRoles 
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responses.unauthorized(res, 'Debes iniciar sesión primero');
    }
    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(userRole)) {
      return responses.forbidden(res, `Se requiere rol: ${roles.join(' o ')}`);
    }
    next();
  };
};
const adminOnly = authorize('admin');
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return next();
    }
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      if (userId) {
        const user = await User.findById(userId).select('-password');
        if (user && user.estado !== 'inactivo') {
          req.user = user;
          req.userId = user._id;
          req.userRole = user.role;
        }
      }
    } catch (jwtError) {
      console.log('Token opcional inválido:', jwtError.message);
    }
    next();
  } catch (error) {
    console.error('Error en optionalAuth:', error);
    next();
  }
};
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return responses.unauthorized(res);
  }
  if (req.user.verificado === false || req.user.isVerified === false) {
    return responses.forbidden(res, 'Debes verificar tu cuenta para realizar esta acción');
  }
  next();
};
const protect = authMiddleware;
module.exports = {
  authMiddleware,
  protect,
  authorize,
  adminOnly,
  optionalAuth,
  requireVerified
};