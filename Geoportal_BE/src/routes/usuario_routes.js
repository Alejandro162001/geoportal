const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario_controller');

router.post('/usuarios', usuarioController.crearUsuario);
router.get('/usuarios', usuarioController.listarUsuarios);
router.post('/login', usuarioController.login);

module.exports = router;
