const shp = require('shpjs');
const AdmZip = require('adm-zip');
const axios = require('axios');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const { setupGeoserver } = require('../services/geoserver_service');

// --- CONFIGURACIÓN DE PRISMA ---
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
        const geoserverRestUrl = `http://localhost:8081/geoserver/rest/workspaces/${workspace}/datastores/${datastore}/featuretypes`;
        
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
        const url = 'http://localhost:8081/geoserver/rest/layers.json';
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

module.exports = {
    publicarShapefile,
    enlistingCapasDB,
    obtenerCapasGeoserver
};