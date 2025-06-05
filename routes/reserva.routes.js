<<<<<<< HEAD
=======

>>>>>>> 69c64ed (mensaje descriptivo)
const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { authMiddleware, adminOnly } = require('../middleware/auth.middleware');
router.get('/mis-reservas', authMiddleware, reservaController.obtenerMisReservas);
router.post('/', authMiddleware, reservaController.crearReserva);
router.put('/:id', authMiddleware, reservaController.actualizarReserva);
router.patch('/:id/cancelar', authMiddleware, reservaController.cancelarReserva);
router.get('/mis-canchas', authMiddleware, adminOnly, reservaController.obtenerReservasDeMisCanchas);

module.exports = router;