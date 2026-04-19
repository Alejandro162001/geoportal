const express = require('express');
const router = express.Router();
const userController = require('../controllers/user_controller');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

router.post('/registro', verificarToken, verificarAdmin, userController.registrarUsuario);
router.post('/registro-publico', userController.registroPublico);
router.post('/login', userController.login);
router.get('/perfil', verificarToken, userController.obtenerPerfil);
router.put('/cambiar-password', verificarToken, userController.cambiarPassword);
router.get('/usuarios', verificarToken, verificarAdmin, userController.listarUsuarios);
router.put('/usuarios/:id/rol', verificarToken, verificarAdmin, userController.cambiarRol);
router.delete('/usuarios/:id', verificarToken, verificarAdmin, userController.eliminarUsuario);
router.put('/usuarios/:id/activo', verificarToken, verificarAdmin, userController.toggleActivoUsuario);

module.exports = router;
