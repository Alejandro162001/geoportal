const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_aqui_cambialo';

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        const newToken = jwt.sign(
            { id: decoded.id, email: decoded.email, nombre: decoded.nombre, rol: decoded.rol },
            JWT_SECRET,
            { expiresIn: '20m' }
        );

        res.setHeader('X-New-Token', newToken);

        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};

const verificarAdmin = (req, res, next) => {
    if (!req.user || (req.user.rol !== 'admin' && req.user.rol !== 'sudo')) {
        return res.status(403).json({ error: 'Se requiere rol de administrador o superior' });
    }
    next();
};

const verificarAdminOTecnico = (req, res, next) => {
    if (!req.user || (req.user.rol !== 'admin' && req.user.rol !== 'tecnico' && req.user.rol !== 'sudo')) {
        return res.status(403).json({ error: 'Se requiere rol de administrador o técnico' });
    }
    next();
};

const verificarSudo = (req, res, next) => {
    if (!req.user || req.user.rol !== 'sudo') {
        return res.status(403).json({ error: 'Se requiere rol sudo' });
    }
    next();
};

const verificarAutenticado = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Debe estar autenticado' });
    }
    next();
};

module.exports = { verificarToken, verificarAdmin, verificarAdminOTecnico, verificarSudo, verificarAutenticado };
