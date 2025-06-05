const express = require('express');
const router = express.Router();
const {
  crearCancha,
  obtenerMisCanchas,
  obtenerCanchaPorId,
  editarCancha,
  eliminarCancha,
  recuperarCancha,
  obtenerCanchasEliminadas,
  obtenerCanchasPublicas,
  obtenerCanchaPublica,
  obtenerOpciones
} = require('../controllers/cancha.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
const { validarObjectId } = require('../middleware/validation');
router.get('/publicas', obtenerCanchasPublicas);
router.get('/publica/:id', validarObjectId('id'), obtenerCanchaPublica);
router.get('/opciones', obtenerOpciones);
router.post('/', authMiddleware, adminOnly, crearCancha);
router.get('/mis-canchas', authMiddleware, adminOnly, obtenerMisCanchas);
router.get('/:id', authMiddleware, adminOnly, validarObjectId('id'), obtenerCanchaPorId);
router.put('/:id', authMiddleware, adminOnly, validarObjectId('id'), editarCancha);
router.delete('/:id', authMiddleware, adminOnly, validarObjectId('id'), eliminarCancha);

module.exports = router;