const express = require('express');
const router = express.Router();
const logController = require('../controllers/log_controller');

router.get('/logs', logController.listarLogs);

module.exports = router;
