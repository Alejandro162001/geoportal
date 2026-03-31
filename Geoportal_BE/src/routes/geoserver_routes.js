const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verificarToken, verificarAdmin, verificarAdminOTecnico, verificarAutenticado } = require('../middleware/auth');

const upload = multer();

const uploadRaster = multer({
    dest: path.join(__dirname, '..', '..', 'rasters', 'temp')
});

const geoserverController = require('../controllers/geoserver_controller');

router.post('/publicar-shp', upload.single('shapefile'), verificarToken, verificarAdminOTecnico, geoserverController.publicarShapefile);
router.post('/publicar-raster', uploadRaster.single('raster'), verificarToken, verificarAdminOTecnico, geoserverController.publicarRaster);
router.get('/enlistar-db', verificarToken, verificarAutenticado, geoserverController.enlistingCapasDB);
router.get('/llamar-capas', verificarToken, verificarAutenticado, geoserverController.obtenerCapasGeoserver);
router.get('/llamar-rasters', verificarToken, verificarAutenticado, geoserverController.obtenerRastersGeoserver);
router.get('/enlistar-rasters', verificarToken, verificarAutenticado, geoserverController.enlistarRasters);
router.delete('/capas/:nombreCapa', verificarToken, verificarAdmin, geoserverController.eliminarCapa);
router.put('/capas/:nombreCapa/activo', verificarToken, verificarAdmin, geoserverController.toggleActivoCapa);
router.delete('/rasters/:nombreCapa', verificarToken, verificarAdmin, geoserverController.eliminarRaster);
router.put('/rasters/:nombreCapa/activo', verificarToken, verificarAdmin, geoserverController.toggleActivoRaster);

module.exports = router;