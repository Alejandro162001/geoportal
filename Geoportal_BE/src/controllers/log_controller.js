const logService = require('../services/log_service');

const listarLogs = async (req, res) => {
    try {
        const logs = await logService.listarLogs();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    listarLogs
};
