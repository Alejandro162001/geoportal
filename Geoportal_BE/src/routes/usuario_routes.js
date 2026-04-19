const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario_controller');

router.post('/usuarios', usuarioController.crearUsuario);
router.get('/usuarios', usuarioController.listarUsuarios);
router.patch('/usuarios/:id', usuarioController.editarUsuario);
router.delete('/usuarios/:id', usuarioController.eliminarUsuario);
router.post('/login', usuarioController.login);
router.post('/logout', usuarioController.logout);

module.exports = router;
