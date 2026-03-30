const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const geoserverController = require('../controllers/geoserver_controller');

router.post('/publicar-shp', upload.single('shapefile'), geoserverController.publicarShapefile);
router.post('/publicar-raster', upload.single('raster'), geoserverController.publicarRaster);
router.get('/enlistar-db', geoserverController.enlistingCapasDB);
router.get('/llamar-capas', geoserverController.obtenerCapasGeoserver);
router.get('/descargar-capa/:nombreCapa', geoserverController.descargarCapa);

module.exports = router;