const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_aqui_cambialo';

const registrarUsuario = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    }

    try {
        const existente = await prisma.$queryRaw`SELECT id FROM public.usuarios WHERE email = ${email} LIMIT 1`;
        if (existente.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const userRol = rol || 'user';
        const solicitanteRol = req.user.rol;

        if (solicitanteRol === 'sudo') {
            if (!['admin', 'tecnico', 'user'].includes(userRol)) {
                return res.status(400).json({ error: 'Rol no válido. Debe ser "admin", "tecnico" o "user"' });
            }
        } else if (solicitanteRol === 'admin') {
            if (!['tecnico', 'user'].includes(userRol)) {
                return res.status(403).json({ error: 'Solo un usuario sudo puede crear administradores' });
            }
        }

        await prisma.$executeRawUnsafe(
            `INSERT INTO public.usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4)`,
            nombre, email, hash, userRol
        );

        res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error al registrar usuario', detalle: error.message });
    }
};

const registroPublico = async (req, res) => {
    const { nombre, apellidos, email, password, passwordConfirmacion, telefono } = req.body;

    if (!nombre || !apellidos || !email || !password || !passwordConfirmacion) {
        return res.status(400).json({ error: 'Nombre, apellidos, email y contraseña son requeridos' });
    }

    if (password !== passwordConfirmacion) {
        return res.status(400).json({ error: 'Las contraseñas no coinciden' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    try {
        const existente = await prisma.$queryRaw`SELECT id FROM public.usuarios WHERE email = ${email} LIMIT 1`;
        if (existente.length > 0) {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await prisma.$executeRawUnsafe(
            `INSERT INTO public.usuarios (nombre, apellidos, email, password, rol, telefono) VALUES ($1, $2, $3, $4, $5, $6)`,
            nombre, apellidos, email, hash, 'user', telefono || null
        );

        res.status(201).json({ mensaje: 'Usuario registrado con éxito. Ya puedes iniciar sesión.' });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error al registrar usuario', detalle: error.message });
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT id, nombre, email, password, rol, eliminado, activo FROM public.usuarios WHERE email = $1`,
            email
        );

        if (usuarios.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = usuarios[0];
        if (user.eliminado) {
            return res.status(403).json({ error: 'Usuario eliminado' });
        }
        if (!user.activo) {
            return res.status(403).json({ error: 'Usuario inactivo' });
        }
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '20m' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            usuario: { id: user.id, nombre: user.nombre, email: user.email }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
    }
};

const obtenerPerfil = async (req, res) => {
    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT id, nombre, email FROM public.usuarios WHERE id = $1`,
            req.user.id
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ usuario: usuarios[0] });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener perfil', detalle: error.message });
    }
};

const cambiarPassword = async (req, res) => {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
        return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT password FROM public.usuarios WHERE id = $1`,
            req.user.id
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const validPassword = await bcrypt.compare(passwordActual, usuarios[0].password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passwordNuevo, salt);

        await prisma.$executeRawUnsafe(
            `UPDATE public.usuarios SET password = $1 WHERE id = $2`,
            hash, req.user.id
        );

        res.json({ mensaje: 'Contraseña actualizada con éxito' });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error al cambiar contraseña', detalle: error.message });
    }
};

const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await prisma.$queryRaw`
            SELECT id, nombre, email, rol, activo, created_at
            FROM public.usuarios
            WHERE eliminado = false
            ORDER BY created_at DESC
        `;
        res.json({ total: usuarios.length, usuarios });
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ error: 'Error al listar usuarios', detalle: error.message });
    }
};

const cambiarRol = async (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;
    const solicitanteRol = req.user.rol;

    if (!rol || !['admin', 'user', 'tecnico', 'sudo'].includes(rol)) {
        return res.status(400).json({ error: 'Rol no válido' });
    }

    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT id, rol FROM public.usuarios WHERE id = $1`,
            parseInt(id)
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = usuarios[0];

        if (targetUser.rol === 'sudo' && solicitanteRol !== 'sudo') {
            return res.status(403).json({ error: 'Solo un usuario sudo puede cambiar el rol de otro sudo' });
        }

        if (solicitanteRol === 'admin' && rol === 'admin') {
            return res.status(403).json({ error: 'Solo un usuario sudo puede asignar rol de administrador' });
        }

        const result = await prisma.$executeRawUnsafe(
            `UPDATE public.usuarios SET rol = $1 WHERE id = $2`,
            rol, parseInt(id)
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: `Rol actualizado a ${rol}` });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ error: 'Error al cambiar rol', detalle: error.message });
    }
};

const eliminarUsuario = async (req, res) => {
    const { id } = req.params;
    const solicitanteRol = req.user.rol;

    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT id, rol, eliminado FROM public.usuarios WHERE id = $1`,
            parseInt(id)
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = usuarios[0];

        if (targetUser.eliminado) {
            return res.status(400).json({ error: 'Usuario ya eliminado' });
        }

        if (targetUser.rol === 'sudo') {
            return res.status(403).json({ error: 'No se puede eliminar un usuario sudo' });
        }

        if (solicitanteRol === 'admin' && targetUser.rol === 'admin') {
            return res.status(403).json({ error: 'Un admin no puede eliminar a otro admin' });
        }

        const result = await prisma.$executeRawUnsafe(
            `UPDATE public.usuarios SET eliminado = true WHERE id = $1`,
            parseInt(id)
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario', detalle: error.message });
    }
};

const toggleActivoUsuario = async (req, res) => {
    const { id } = req.params;
    const { activo } = req.body;
    const solicitanteRol = req.user.rol;

    if (activo === undefined || typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El campo "activo" debe ser true o false' });
    }

    try {
        const usuarios = await prisma.$queryRawUnsafe(
            `SELECT id, rol, eliminado FROM public.usuarios WHERE id = $1`,
            parseInt(id)
        );

        if (usuarios.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const targetUser = usuarios[0];

        if (targetUser.eliminado) {
            return res.status(400).json({ error: 'Usuario eliminado' });
        }

        if (targetUser.rol === 'sudo') {
            return res.status(403).json({ error: 'No se puede cambiar el estado de un usuario sudo' });
        }

        if (solicitanteRol === 'admin' && targetUser.rol === 'admin') {
            return res.status(403).json({ error: 'Un admin no puede cambiar el estado de otro admin' });
        }

        const result = await prisma.$executeRawUnsafe(
            `UPDATE public.usuarios SET activo = $1 WHERE id = $2`,
            activo, parseInt(id)
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ mensaje: `Estado actualizado a ${activo ? 'activo' : 'inactivo'}` });
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        res.status(500).json({ error: 'Error al cambiar estado del usuario', detalle: error.message });
    }
};

module.exports = {
    registrarUsuario,
    registroPublico,
    login,
    obtenerPerfil,
    cambiarPassword,
    listarUsuarios,
    cambiarRol,
    eliminarUsuario,
    toggleActivoUsuario
};
