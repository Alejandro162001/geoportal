const prisma = require('../db');

const registrarLog = async (usuario, accion, entidad, ip, detalles = null) => {
    try {
        await prisma.log.create({
            data: {
                usuario,
                accion,
                entidad,
                ip,
                detalles: typeof detalles === 'object' ? JSON.stringify(detalles) : detalles
            }
        });
    } catch (error) {
        console.error('Error al registrar log:', error);
    }
};

const listarLogs = async () => {
    return await prisma.log.findMany({
        orderBy: { timestamp: 'desc' }
    });
};

module.exports = {
    registrarLog,
    listarLogs
};
