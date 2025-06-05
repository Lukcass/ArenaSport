<<<<<<< HEAD
const express = require('express');

const router = express.Router();
=======
const express = require('express');const router = express.Router();
>>>>>>> 69c64ed (mensaje descriptivo)
const { 
  obtenerPerfil, 
  editarPerfil, 
  subirAvatar, 
  eliminarAvatar,
  eliminarCuenta,
  cambiarPassword
} = require('../controllers/user.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

const multer = require('multer');
const upload = multer({
  dest: 'uploads/temp/',
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});
router.use(authMiddleware);
router.get('/perfil', obtenerPerfil);        
router.put('/perfil', editarPerfil);            
router.put('/avatar', upload.single('avatar'), subirAvatar);  
router.delete('/avatar', eliminarAvatar);                     
router.delete('/cuenta', eliminarCuenta);       
router.put('/password', cambiarPassword);       
module.exports = router;