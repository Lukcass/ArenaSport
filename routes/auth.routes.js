<<<<<<< HEAD
const express = require('express');

const router = express.Router();
=======
const express = require('express');const router = express.Router();
>>>>>>> 69c64ed (mensaje descriptivo)
const { 
  registerUser, 
  loginUser, 
  verifyToken
} = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};
router.post('/register',  
  registerUser
);
router.post('/login', 
  loginUser
);
router.get('/verify', 
  authMiddleware, 
  verifyToken
);
router.get('/me', authMiddleware, (req, res) => {
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
  res.status(200).json({
    success: true,
    message: 'Información del usuario obtenida exitosamente',
    data: userData,
    timestamp: new Date().toISOString()
  });
});
router.post('/logout', authMiddleware, (req, res) => {
  console.info(`Logout realizado: ${req.user.email}`);
  res.status(200).json({
    success: true,
    message: 'Sesión cerrada exitosamente',
    timestamp: new Date().toISOString()
  });
});
module.exports = router;