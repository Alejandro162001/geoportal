const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const geoserverController = require('../controllers/geoserver_controller');

// Ruta limpia sin comentarios YAML
router.post('/publicar-shp', upload.single('shapefile'), geoserverController.publicarShapefile);

module.exports = router;


router.post('/publicar-shp', upload.single('shapefile'), geoserverController.publicarShapefile);

// Nuevas rutas
router.get('/enlistar-db', geoserverController.enlistingCapasDB);
router.get('/llamar-capas', geoserverController.obtenerCapasGeoserver);

module.exports = router;