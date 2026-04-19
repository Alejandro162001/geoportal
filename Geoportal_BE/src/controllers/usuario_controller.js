const usuarioService = require('../services/usuario_service');

const crearUsuario = async (req, res) => {
    try {
        const meta = { ip: req.ip, requester: 'Administrador' };
        const usuario = await usuarioService.crearUsuario(req.body, meta);
        res.status(201).json(usuario);
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(400).json({ error: error.message });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await usuarioService.listarUsuarios();
        res.json(usuarios);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        const meta = { ip: req.ip };
        const infoUsuario = await usuarioService.login(correo, contrasena, meta);
        res.json(infoUsuario);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const editarUsuario = async (req, res) => {
    try {
        const meta = { ip: req.ip, requester: 'Administrador' };
        const { id } = req.params;
        const usuario = await usuarioService.editarUsuario(id, req.body, meta);
        res.json(usuario);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const meta = { ip: req.ip, requester: 'Administrador' };
        const { id } = req.params;
        const usuario = await usuarioService.eliminarUsuario(id, meta);
        res.json({ message: "Usuario eliminado con éxito (Soft Delete)", usuario });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = {
    crearUsuario,
    listarUsuarios,
    editarUsuario,
    eliminarUsuario,
    login
};
