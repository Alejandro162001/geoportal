const prisma = require('../db');
const bcrypt = require('bcryptjs');
const logService = require('./log_service');

// Función para generar ID de 20 dígitos aleatorios
const generateId = () => {
    let id = '';
    for (let i = 0; i < 20; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
};

const crearUsuario = async (datos, meta = { ip: 'unknown', requester: 'Admin' }) => {
    const { nombreCompleto, direccion, correo, contrasena, rol } = datos;
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedContrasena = await bcrypt.hash(contrasena, salt);

    const user = await prisma.usuario.create({
        data: {
            id: generateId(),
            nombreCompleto,
            direccion,
            correo,
            contrasena: hashedContrasena,
            rol
        }
    });

    await logService.registrarLog(meta.requester, 'CREATED USER', user.correo, meta.ip);
    return user;
};

const listarUsuarios = async () => {
    return await prisma.usuario.findMany({
        where: { softDelete: false }
    });
};

const editarUsuario = async (id, datos, meta = { ip: 'unknown', requester: 'Admin' }) => {
    const { contrasena, ...resto } = datos;
    const updateData = { ...resto };
    
    // Si se envía contraseña, hashearla
    if (contrasena) {
        const salt = await bcrypt.genSalt(10);
        updateData.contrasena = await bcrypt.hash(contrasena, salt);
    }

    const user = await prisma.usuario.update({
        where: { id },
        data: updateData
    });

    await logService.registrarLog(meta.requester, 'EDITED USER', user.correo, meta.ip, { changedFields: Object.keys(datos) });
    return user;
};

const eliminarUsuario = async (id, meta = { ip: 'unknown', requester: 'Admin' }) => {
    const user = await prisma.usuario.update({
        where: { id },
        data: { softDelete: true }
    });

    await logService.registrarLog(meta.requester, 'DELETED USER', user.correo, meta.ip);
    return user;
};

const login = async (correo, contrasena, meta = { ip: 'unknown' }) => {
    const usuario = await prisma.usuario.findFirst({
        where: {
            correo,
            softDelete: false,
            activo: true
        }
    });

    if (!usuario) {
        throw new Error('Usuario no encontrado, inactivo o eliminado');
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!contrasenaValida) {
        throw new Error('Contraseña incorrecta');
    }

    // Registrar inicio de sesión en la bitácora
    await logService.registrarLog(usuario.nombreCompleto, 'LOGIN', 'Sistema', meta.ip);

    // No devolver la contraseña
    const { contrasena: _, ...infoUsuario } = usuario;
    return infoUsuario;
};

module.exports = {
    crearUsuario,
    listarUsuarios,
    editarUsuario,
    eliminarUsuario,
    login
};
