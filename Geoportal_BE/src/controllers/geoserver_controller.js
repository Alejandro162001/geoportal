const shp = require('shpjs');
const AdmZip = require('adm-zip');
const axios = require('axios');
const prisma = require('../db');
const { setupGeoserver } = require('../services/geoserver_service');
const path = require('path');
require('dotenv').config();

const GEOSERVER_URL = process.env.GEOSERVER_URL || 'http://localhost:8080/geoserver';

const publicarShapefile = async (req, res) => {
    // 1. Limpieza de variables de entrada
    const workspace = req.body.workspace ? req.body.workspace.trim() : 'geoportal';
    const nombreCapa = req.body.nombreCapa ? req.body.nombreCapa.trim() : 'capa_sin_nombre';
    const datastore = "postgis_store";
    const esquema = "geoespacial"; 

    if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo" });
    }

    try {
        // Asegurar Workspace y Datastore en GeoServer (Puerto 8081 configurado internamente)
        await setupGeoserver(workspace, datastore);

        // 2. Procesar Shapefile a GeoJSON
        const geojson = await shp(req.file.buffer);
        const tableName = nombreCapa.toLowerCase().replace(/\s+/g, '_');
        
        // Lógica robusta para extraer features (Corrige el error de 'feautures' y duplicidad)
        let features = [];
        if (Array.isArray(geojson)) {
            // Caso: ZIP con múltiples capas
            features = geojson.flatMap(layer => layer.features || []);
        } else if (geojson && geojson.features) {
            // Caso: ZIP con una sola capa (estándar)
            features = geojson.features;
        } else if (geojson && geojson.type === 'Feature') {
            // Caso: Un solo elemento
            features = [geojson];
        }

        console.log(`Elementos finales encontrados: ${features.length}`);

        if (features.length === 0) {
            return res.status(400).json({ 
                error: "El archivo no contiene elementos geográficos.",
                detalle: "Asegúrate de que el ZIP contenga archivos .shp y .dbf válidos." 
            });
        }

        // 3. Preparar Base de Datos (Esquema y Tabla)
        await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${esquema}";`);
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "${esquema}"."${tableName}" (
                id SERIAL PRIMARY KEY,
                properties JSONB,
                geom GEOMETRY(Geometry, 4326)
            )
        `);

        // 4. Inserción de datos con parámetros seguros
        for (const feature of features) {
            const props = JSON.stringify(feature.properties);
            const geom = JSON.stringify(feature.geometry);
            
            await prisma.$executeRawUnsafe(
                `INSERT INTO "${esquema}"."${tableName}" (properties, geom) 
                 VALUES ($1::jsonb, ST_SetSRID(ST_GeomFromGeoJSON($2), 4326))`,
                props,
                geom
            );
        }

        // 5. Publicación en GeoServer (Puerto 8081)
        const geoserverRestUrl = `${GEOSERVER_URL}/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes`;
        
        await axios.post(geoserverRestUrl, {
            featureType: {
                name: tableName,
                nativeName: tableName,
                title: nombreCapa,
                srs: 'EPSG:4326',
                enabled: true
            }
        }, {
            auth: { username: 'admin', password: 'geoserver' },
            headers: { 'Content-Type': 'application/json' }
        });

        res.json({ 
            mensaje: `Capa publicada con éxito en el esquema ${esquema}`,
            tabla: `${esquema}.${tableName}`,
            elementos: features.length
        });

    } catch (error) {
        console.error("Error detallado en el proceso:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "Error en la automatización", 
            detalle: error.message 
        });
    }
};

// --- FUNCIONES ADICIONALES ---

// Enlistar capas buscando específicamente en el nuevo esquema
// 1. Enlistar las capas (Desde la vista de metadatos de PostGIS)
const enlistingCapasDB = async (req, res) => {
    try {
        // Corregido: f_table_name en lugar de table_name
        // Corregido: f_table_schema en lugar de table_schema
        const capas = await prisma.$queryRaw`
            SELECT 
                f_table_name AS table_name, 
                f_geometry_column, 
                srid, 
                type 
            FROM geometry_columns 
            WHERE f_table_schema = 'geoespacial'
        `;
        
        res.json({ 
            source: 'PostgreSQL/PostGIS', 
            esquema: 'geoespacial', 
            total: capas.length, 
            capas 
        });
    } catch (error) {
        console.error("Error al enlistar capas:", error);
        res.status(500).json({ 
            error: "Error al enlistar tablas", 
            detalle: error.message 
        });
    }
};

// Obtener capas desde GeoServer (Puerto 8081)
const obtenerCapasGeoserver = async (req, res) => {
    try {
        const url = `${GEOSERVER_URL}/rest/layers.json`;
        const response = await axios.get(url, {
            auth: { username: 'admin', password: 'geoserver' }
        });
        
        res.json({
            source: 'GeoServer REST API',
            layers: response.data.layers ? response.data.layers.layer : []
        });
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con GeoServer", detalle: error.message });
    }
};

// Descargar capa en formato GeoJSON o Shapefile
const descargarCapa = async (req, res) => {
    const { nombreCapa } = req.params;
    const formato = (req.query.formato || 'geojson').toLowerCase();
    
    if (!nombreCapa) {
        return res.status(400).json({ error: "Nombre de capa requerido" });
    }
    
    const esquema = 'geoespacial';
    const workspace = 'geoportal';
    const tableName = nombreCapa.toLowerCase().replace(/\s+/g, '_');
    
    try {
        const datos = await prisma.$queryRawUnsafe(`
            SELECT 
                json_build_object(
                    'type', 'FeatureCollection',
                    'features', json_agg(
                        json_build_object(
                            'type', 'Feature',
                            'geometry', ST_AsGeoJSON(geom)::json,
                            'properties', COALESCE(properties, '{}')
                        )
                    )
                ) AS geojson
            FROM "${esquema}"."${tableName}"
        `);
        
        if (!datos || datos.length === 0 || !datos[0].geojson) {
            return res.status(404).json({ error: "Capa no encontrada o vacía" });
        }
        
        if (formato === 'geojson') {
            res.setHeader('Content-Type', 'application/vnd.geo+json');
            res.setHeader('Content-Disposition', `attachment; filename="${tableName}.geojson"`);
            return res.send(datos[0].geojson);
        }
        
        if (formato === 'shp') {
            const features = datos[0].geojson.features || [];
            
            if (features.length === 0) {
                return res.status(404).json({ error: "La capa no tiene geometrías" });
            }
            
            const geoserverUrl = `${GEOSERVER_URL}/wfs?request=GetFeature&version=1.0.0&typeName=${workspace}:${tableName}&outputFormat=shape-zip`;
            
            const response = await axios.get(geoserverUrl, {
                auth: { username: 'admin', password: 'geoserver' },
                responseType: 'arraybuffer'
            });
            
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="${tableName}.zip"`);
            return res.send(Buffer.from(response.data));
        }
        
        return res.status(400).json({ error: "Formato no soportado. Use: geojson o shp" });
        
    } catch (error) {
        console.error("Error al descargar capa:", error);
        res.status(500).json({ error: "Error al descargar capa", detalle: error.message });
    }
};

// Publicar raster (TIFF, GeoTIFF, SID)
const publicarRaster = async (req, res) => {
    const workspace = req.body.workspace ? req.body.workspace.trim() : 'geoportal';
    const nombreCapa = req.body.nombreCapa ? req.body.nombreCapa.trim() : 'raster_sin_nombre';

    if (!req.file) {
        return res.status(400).json({ error: "No se subió ningún archivo raster" });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const mimeTypes = ['.tiff', '.tif', '.sid', '.img', '.geotiff'];
    
    if (!mimeTypes.includes(ext)) {
        return res.status(400).json({ 
            error: "Formato no soportado", 
            detalle: `Extensiones válidas: ${mimeTypes.join(', ')}`
        });
    }

    const coberturaStore = nombreCapa.replace(/\s+/g, '_').toLowerCase();

    try {
        await setupGeoserver(workspace, coberturaStore, 'coveragestore');

        const uploadUrl = `${GEOSERVER_URL}/rest/workspaces/${workspace}/coveragestores/${coberturaStore}/file.geotiff`;
        
        await axios.put(uploadUrl, req.file.buffer, {
            auth: { username: 'admin', password: 'geoserver' },
            headers: { 
                'Content-Type': req.file.mimetype,
                'Coverage-name': nombreCapa
            }
        });

        res.json({ 
            mensaje: `Raster publicado con éxito`,
            nombre: nombreCapa,
            workspace: workspace,
            coberturaStore: coberturaStore
        });

    } catch (error) {
        console.error("Error al publicar raster:", error.response ? error.response.data : error.message);
        res.status(500).json({ 
            error: "Error al publicar raster", 
            detalle: error.message 
        });
    }
};

module.exports = {
    publicarShapefile,
    publicarRaster,
    enlistingCapasDB,
    obtenerCapasGeoserver,
    descargarCapa
};