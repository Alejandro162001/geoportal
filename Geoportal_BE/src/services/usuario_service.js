const prisma = require('../db');
const bcrypt = require('bcryptjs');

// Función para generar ID de 20 dígitos aleatorios
const generateId = () => {
    let id = '';
    for (let i = 0; i < 20; i++) {
        id += Math.floor(Math.random() * 10);
    }
    return id;
};

const crearUsuario = async (datos) => {
    const { nombreCompleto, direccion, correo, contrasena, rol } = datos;
    
    // Hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedContrasena = await bcrypt.hash(contrasena, salt);

    return await prisma.usuario.create({
        data: {
            id: generateId(),
            nombreCompleto,
            direccion,
            correo,
            contrasena: hashedContrasena,
            rol
        }
    });
};

const listarUsuarios = async () => {
    return await prisma.usuario.findMany();
};

const login = async (correo, contrasena) => {
    const usuario = await prisma.usuario.findUnique({
        where: { correo }
    });

    if (!usuario) {
        throw new Error('Usuario no encontrado');
    }

    const match = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!match) {
        throw new Error('Contraseña incorrecta');
    }

    // Excluir ID y Contraseña según solicitud (aunque el usuario dijo "menos el id", usualmente tampoco se devuelve la clave)
    const { id, contrasena: _, ...infoSinId } = usuario;
    return infoSinId;
};

module.exports = {
    crearUsuario,
    listarUsuarios,
    login
};
