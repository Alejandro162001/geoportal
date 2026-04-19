const usuarioService = require('../services/usuario_service');

const crearUsuario = async (req, res) => {
    try {
        const usuario = await usuarioService.crearUsuario(req.body);
        res.status(201).json(usuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.listarUsuarios();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const infoUsuario = await usuarioService.login(correo, contrasena);
        res.json(infoUsuario);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

module.exports = {
    crearUsuario,
    listarUsuarios,
    login
};
