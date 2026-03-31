const shp = require('shpjs');
const AdmZip = require('adm-zip');
const axios = require('axios');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const { setupGeoserver } = require('../services/geoserver_service');
const path = require('path');
const fs = require('fs');

// --- CONFIGURACIÓN DE PRISMA ---
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rastersDir = path.join(__dirname, '..', '..', 'rasters');
if (!fs.existsSync(rastersDir)) {
    fs.mkdirSync(rastersDir, { recursive: true });
}

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
        // Asegurar Workspace y Datastore en GeoServer (Puerto 8080 configurado internamente)
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
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis;`);
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

        // 5. Publicación en GeoServer (Puerto 8080)
        const geoserverRestUrl = `http://localhost:8080/geoserver/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes`;
        
        await axios.post(geoserverRestUrl, {
            featureType: {
                name: tableName,
                nativeName: tableName,
                title: nombreCapa,
                srs: 'EPSG:4326',
                enabled: true
            }
        }, {
            auth: { username: 'admin', password: 'mi_password_seguro' }, //reemplaza con geoserver la contraseña todo depende de como corre goeserver 
            headers: { 'Content-Type': 'application/json' }
        });

        res.json({ 
            mensaje: `Capa publicada con éxito en el esquema ${esquema}`,
            tabla: `${esquema}.${tableName}`,
            elementos: features.length
        });

        await prisma.$executeRawUnsafe(
            `INSERT INTO geoespacial.capas_geoespaciales (nombre, tableName, workspace, esquema) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (nombre) DO UPDATE SET eliminado = false, activo = true`,
            nombreCapa, tableName, workspace, esquema
        );

    } catch (error) {
        const errorMsg = error.response?.data || error.message || error.code || JSON.stringify(error);
        console.error("Error detallado en el proceso:", errorMsg);
        console.error("Stack:", error.stack);
        res.status(500).json({ 
            error: "Error en la automatización", 
            detalle: errorMsg 
        });
    }
};

// --- FUNCIONES ADICIONALES ---

// Enlistar capas buscando específicamente en el nuevo esquema
// 1. Enlistar las capas (Desde la vista de metadatos de PostGIS)
const enlistingCapasDB = async (req, res) => {
    try {
        const capas = await prisma.$queryRaw`
            SELECT 
                c.tableName AS table_name, 
                c.nombre,
                c.workspace,
                c.esquema,
                c.activo,
                c.created_at
            FROM geoespacial.capas_geoespaciales c
            WHERE c.eliminado = false
            ORDER BY c.created_at DESC
        `;
        
        const capasConUrls = capas.map(capa => ({
            ...capa,
            wmsUrl: `http://localhost:8080/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=${capa.workspace}:${capa.table_name}&srs=EPSG:4326&bbox=-180,-90,180,90&width=768&height=384&format=image/png&transparent=true`,
            wfsUrl: `http://localhost:8080/geoserver/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${capa.workspace}:${capa.table_name}&outputFormat=application/json`,
            leafletWmsConfig: {
                url: `http://localhost:8080/geoserver/wms`,
                params: {
                    layers: `${capa.workspace}:${capa.table_name}`,
                    format: 'image/png',
                    transparent: true,
                    version: '1.1.0'
                }
            },
            openLayersWmsConfig: {
                url: `http://localhost:8080/geoserver/wms`,
                params: {
                    LAYERS: `${capa.workspace}:${capa.table_name}`,
                    TILED: true
                },
                serverType: 'geoserver'
            }
        }));
        
        res.json({ 
            source: 'PostgreSQL/PostGIS', 
            esquema: 'geoespacial', 
            total: capasConUrls.length, 
            capas: capasConUrls
        });
    } catch (error) {
        console.error("Error al enlistar capas:", error);
        res.status(500).json({ 
            error: "Error al enlistar tablas", 
            detalle: error.message 
        });
    }
};

// Obtener capas desde GeoServer (Puerto 8080)
const obtenerCapasGeoserver = async (req, res) => {
    try {
        const capasDB = await prisma.$queryRaw`
            SELECT tableName, nombre, workspace, esquema
            FROM geoespacial.capas_geoespaciales
            WHERE eliminado = false AND activo = true
        `;

        if (capasDB.length === 0) {
            return res.json({ source: 'GeoServer REST API', total: 0, layers: [] });
        }

        const url = 'http://localhost:8080/geoserver/rest/layers.json';
        const response = await axios.get(url, {
            auth: { username: 'admin', password: 'mi_password_seguro' },
        });

        const capasGeoServer = response.data.layers ? response.data.layers.layer : [];
        const capasDBNames = capasDB.map(c => c.tableName.toLowerCase());

        const capasFiltradas = capasGeoServer
            .filter(capa => capasDBNames.includes(capa.name.toLowerCase()))
            .map(capa => {
                const dbInfo = capasDB.find(c => c.tableName.toLowerCase() === capa.name.toLowerCase());
                const nombre = capa.name;
                const workspace = dbInfo?.workspace || 'geoportal';
                return {
                    name: nombre,
                    title: dbInfo?.nombre || capa.title || nombre,
                    wmsUrl: `http://localhost:8080/geoserver/${workspace}/wms?service=WMS&version=1.1.0&request=GetMap&layers=${workspace}:${nombre}&srs=EPSG:4326&bbox=-180,-90,180,90&width=768&height=384&format=image/png&transparent=true`,
                    wfsUrl: `http://localhost:8080/geoserver/${workspace}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=${workspace}:${nombre}&outputFormat=application/json`,
                    wmsGetCapabilities: `http://localhost:8080/geoserver/${workspace}/wms?service=WMS&version=1.1.0&request=GetCapabilities`,
                    wfsGetCapabilities: `http://localhost:8080/geoserver/${workspace}/wfs?service=WFS&version=1.0.0&request=GetCapabilities`,
                    leafletWmsConfig: {
                        url: `http://localhost:8080/geoserver/${workspace}/wms`,
                        params: {
                            layers: `${workspace}:${nombre}`,
                            format: 'image/png',
                            transparent: true,
                            version: '1.1.0'
                        }
                    },
                    openLayersWmsConfig: {
                        url: `http://localhost:8080/geoserver/${workspace}/wms`,
                        params: {
                            LAYERS: `${workspace}:${nombre}`,
                            TILED: true
                        },
                        serverType: 'geoserver'
                    }
                };
            });

        res.json({
            source: 'GeoServer REST API',
            total: capasFiltradas.length,
            layers: capasFiltradas
        });
    } catch (error) {
        res.status(500).json({ error: "Error al conectar con GeoServer", detalle: error.message });
    }
};

const obtenerRastersGeoserver = async (req, res) => {
    try {
        const rastersDB = await prisma.$queryRaw`
            SELECT coberturaStore, nombre, workspace
            FROM geoespacial.rasters_geoespaciales
            WHERE eliminado = false AND activo = true
        `;

        if (rastersDB.length === 0) {
            return res.json({ source: 'GeoServer REST API', total: 0, rasters: [] });
        }

        const url = 'http://localhost:8080/geoserver/rest/coverages.json';
        const response = await axios.get(url, {
            auth: { username: 'admin', password: 'mi_password_seguro' },
        });

        const rastersGeoServer = response.data.coverages ? response.data.coverages.coverage : [];
        const rastersDBNames = rastersDB.map(r => r.coberturaStore.toLowerCase());

        const rastersFiltrados = rastersGeoServer
            .filter(raster => rastersDBNames.includes(raster.name.toLowerCase()))
            .map(raster => {
                const dbInfo = rastersDB.find(r => r.coberturaStore.toLowerCase() === raster.name.toLowerCase());
                const nombre = raster.name;
                const workspace = dbInfo?.workspace || 'geoportal';
                return {
                    name: nombre,
                    title: dbInfo?.nombre || raster.title || nombre,
                    wmsUrl: `http://localhost:8080/geoserver/${workspace}/wms?service=WMS&version=1.1.0&request=GetMap&layers=${workspace}:${nombre}&srs=EPSG:4326&bbox=-180,-90,180,90&width=768&height=384&format=image/png&transparent=true`,
                    wmsGetCapabilities: `http://localhost:8080/geoserver/${workspace}/wms?service=WMS&version=1.1.0&request=GetCapabilities`,
                    leafletWmsConfig: {
                        url: `http://localhost:8080/geoserver/${workspace}/wms`,
                        params: {
                            layers: `${workspace}:${nombre}`,
                            format: 'image/png',
                            transparent: true,
                            version: '1.1.0'
                        }
                    },
                    openLayersWmsConfig: {
                        url: `http://localhost:8080/geoserver/${workspace}/wms`,
                        params: {
                            LAYERS: `${workspace}:${nombre}`,
                            TILED: true
                        },
                        serverType: 'geoserver'
                    }
                };
            });

        res.json({
            source: 'GeoServer REST API',
            total: rastersFiltrados.length,
            rasters: rastersFiltrados
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
        const meta = await prisma.$queryRawUnsafe(
            `SELECT id, activo FROM geoespacial.capas_geoespaciales WHERE tableName = $1 AND eliminado = false`,
            tableName
        );

        if (meta.length === 0) {
            return res.status(404).json({ error: "Capa no encontrada" });
        }

        if (!meta[0].activo) {
            return res.status(403).json({ error: "Capa inactiva" });
        }

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
            
            const geoserverUrl = `http://localhost:8080/geoserver/wfs?request=GetFeature&version=1.0.0&typeName=${workspace}:${tableName}&outputFormat=shape-zip`;
            
            const response = await axios.get(geoserverUrl, {
                auth: { username: 'admin', password: 'mi_password_seguro' }, //reemplaza con geoserver la contraseña todo depende de como corre goeserver 
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
        const rastersSubdir = path.join(rastersDir, coberturaStore);
        if (!fs.existsSync(rastersSubdir)) {
            fs.mkdirSync(rastersSubdir, { recursive: true });
        }

        const fileName = `${coberturaStore}${ext}`;
        const finalPath = path.join(rastersSubdir, fileName);
        const tempPath = req.file.path;

        fs.renameSync(tempPath, finalPath);

        await setupGeoserver(workspace, coberturaStore, 'coveragestore');

        const uploadUrl = `http://localhost:8080/geoserver/rest/workspaces/${workspace}/coveragestores/${coberturaStore}/file.geotiff`;
        
        const fileStream = fs.createReadStream(finalPath);
        await axios.put(uploadUrl, fileStream, {
            auth: { username: 'admin', password: 'mi_password_seguro' },
            headers: { 
                'Content-Type': req.file.mimetype,
                'Coverage-name': nombreCapa
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        res.json({ 
            mensaje: `Raster publicado con éxito`,
            nombre: nombreCapa,
            workspace: workspace,
            coberturaStore: coberturaStore,
            archivo: fileName
        });

        await prisma.$executeRawUnsafe(
            `INSERT INTO geoespacial.rasters_geoespaciales (nombre, coberturaStore, workspace, archivo) 
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (nombre) DO UPDATE SET eliminado = false, activo = true`,
            nombreCapa, coberturaStore, workspace, fileName
        );

    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        const errorMsg = error.response?.data || error.message || error.code || JSON.stringify(error);
        console.error("Error al publicar raster:", errorMsg);
        res.status(500).json({ 
            error: "Error al publicar raster", 
            detalle: errorMsg 
        });
    }
};

const enlistarRasters = async (req, res) => {
    try {
        const rasters = await prisma.$queryRaw`
            SELECT 
                r.nombre,
                r.coberturaStore,
                r.workspace,
                r.archivo,
                r.activo,
                r.created_at
            FROM geoespacial.rasters_geoespaciales r
            WHERE r.eliminado = false
            ORDER BY r.created_at DESC
        `;
        
        const rastersConUrls = rasters.map(raster => ({
            ...raster,
            wmsUrl: `http://localhost:8080/geoserver/wms?service=WMS&version=1.1.0&request=GetMap&layers=${raster.workspace}:${raster.coberturaStore}&srs=EPSG:4326&bbox=-180,-90,180,90&width=768&height=384&format=image/png&transparent=true`,
            leafletWmsConfig: {
                url: `http://localhost:8080/geoserver/wms`,
                params: {
                    layers: `${raster.workspace}:${raster.coberturaStore}`,
                    format: 'image/png',
                    transparent: true,
                    version: '1.1.0'
                }
            },
            openLayersWmsConfig: {
                url: `http://localhost:8080/geoserver/wms`,
                params: {
                    LAYERS: `${raster.workspace}:${raster.coberturaStore}`,
                    TILED: true
                },
                serverType: 'geoserver'
            }
        }));
        
        res.json({ source: 'PostgreSQL/PostGIS', total: rastersConUrls.length, rasters: rastersConUrls });
    } catch (error) {
        console.error("Error al enlistar rasters:", error);
        res.status(500).json({ error: "Error al enlistar rasters", detalle: error.message });
    }
};

const descargarRaster = async (req, res) => {
    const { nombreCapa } = req.params;

    if (!nombreCapa) {
        return res.status(400).json({ error: "Nombre de capa requerido" });
    }

    const coberturaStore = nombreCapa.toLowerCase().replace(/\s+/g, '_');
    const rastersSubdir = path.join(rastersDir, coberturaStore);

    try {
        const meta = await prisma.$queryRawUnsafe(
            `SELECT id, activo FROM geoespacial.rasters_geoespaciales WHERE coberturaStore = $1 AND eliminado = false`,
            coberturaStore
        );

        if (meta.length === 0) {
            return res.status(404).json({ error: "Raster no encontrado" });
        }

        if (!meta[0].activo) {
            return res.status(403).json({ error: "Raster inactivo" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Error al verificar raster", detalle: error.message });
    }

    if (!fs.existsSync(rastersSubdir)) {
        return res.status(404).json({ error: "Raster no encontrado" });
    }

    const files = fs.readdirSync(rastersSubdir);
    const rasterFile = files.find(f => /\.(tif|tiff|geotiff|sid|img)$/i.test(f));

    if (!rasterFile) {
        return res.status(404).json({ error: "Archivo raster no encontrado" });
    }

    const filePath = path.join(rastersSubdir, rasterFile);
    const ext = path.extname(rasterFile).toLowerCase();
    const contentTypes = {
        '.tif': 'image/tiff',
        '.tiff': 'image/tiff',
        '.geotiff': 'image/tiff',
        '.sid': 'application/octet-stream',
        '.img': 'application/octet-stream'
    };

    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${rasterFile}"`);
    return res.sendFile(filePath);
};

const eliminarCapa = async (req, res) => {
    const { nombreCapa } = req.params;
    const tableName = nombreCapa.toLowerCase().replace(/\s+/g, '_');

    try {
        const result = await prisma.$executeRawUnsafe(
            `UPDATE geoespacial.capas_geoespaciales SET eliminado = true WHERE tableName = $1 AND eliminado = false`,
            tableName
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Capa no encontrada o ya eliminada' });
        }

        res.json({ mensaje: 'Capa eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar capa:', error);
        res.status(500).json({ error: 'Error al eliminar capa', detalle: error.message });
    }
};

const toggleActivoCapa = async (req, res) => {
    const { nombreCapa } = req.params;
    const { activo } = req.body;
    const tableName = nombreCapa.toLowerCase().replace(/\s+/g, '_');

    if (activo === undefined || typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El campo "activo" debe ser true o false' });
    }

    try {
        const result = await prisma.$executeRawUnsafe(
            `UPDATE geoespacial.capas_geoespaciales SET activo = $1 WHERE tableName = $2 AND eliminado = false`,
            activo, tableName
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Capa no encontrada o eliminada' });
        }

        res.json({ mensaje: `Capa actualizada a ${activo ? 'activa' : 'inactiva'}` });
    } catch (error) {
        console.error('Error al cambiar estado de la capa:', error);
        res.status(500).json({ error: 'Error al cambiar estado de la capa', detalle: error.message });
    }
};

const eliminarRaster = async (req, res) => {
    const { nombreCapa } = req.params;
    const coberturaStore = nombreCapa.toLowerCase().replace(/\s+/g, '_');

    try {
        const result = await prisma.$executeRawUnsafe(
            `UPDATE geoespacial.rasters_geoespaciales SET eliminado = true WHERE coberturaStore = $1 AND eliminado = false`,
            coberturaStore
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Raster no encontrado o ya eliminado' });
        }

        res.json({ mensaje: 'Raster eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar raster:', error);
        res.status(500).json({ error: 'Error al eliminar raster', detalle: error.message });
    }
};

const toggleActivoRaster = async (req, res) => {
    const { nombreCapa } = req.params;
    const { activo } = req.body;
    const coberturaStore = nombreCapa.toLowerCase().replace(/\s+/g, '_');

    if (activo === undefined || typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El campo "activo" debe ser true o false' });
    }

    try {
        const result = await prisma.$executeRawUnsafe(
            `UPDATE geoespacial.rasters_geoespaciales SET activo = $1 WHERE coberturaStore = $2 AND eliminado = false`,
            activo, coberturaStore
        );

        if (result === 0) {
            return res.status(404).json({ error: 'Raster no encontrado o eliminado' });
        }

        res.json({ mensaje: `Raster actualizado a ${activo ? 'activo' : 'inactivo'}` });
    } catch (error) {
        console.error('Error al cambiar estado del raster:', error);
        res.status(500).json({ error: 'Error al cambiar estado del raster', detalle: error.message });
    }
};

module.exports = {
    publicarShapefile,
    publicarRaster,
    enlistingCapasDB,
    obtenerCapasGeoserver,
    obtenerRastersGeoserver,
    descargarCapa,
    descargarRaster,
    enlistarRasters,
    eliminarCapa,
    toggleActivoCapa,
    eliminarRaster,
    toggleActivoRaster
};