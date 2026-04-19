const axios = require('axios');
require('dotenv').config();

const GEOSERVER_URL = process.env.GEOSERVER_URL || 'http://localhost:8080/geoserver';
const REST_URL = `${GEOSERVER_URL}/rest`;
const AUTH = { 
    username: process.env.GEOSERVER_USER || 'admin', 
    password: process.env.GEOSERVER_PASS || 'geoserver' 
};

const setupGeoserver = async (workspace, store, tipo = 'datastore') => {
    try {
        await axios.post(`${REST_URL}/workspaces`, 
            { workspace: { name: workspace } }, 
            { auth: AUTH }).catch(() => console.log("Workspace ya existe."));

        if (tipo === 'datastore') {
            const dsConfig = {
                dataStore: {
                    name: store,
                    connectionParameters: {
                        entry: [
                            { "@key": "host", "$": process.env.DB_HOST || "localhost" },
                            { "@key": "port", "$": "5432" },
                            { "@key": "database", "$": "gis_db" },
                            { "@key": "user", "$": "postgres" },
                            { "@key": "passwd", "$": "postgres" },
                            { "@key": "dbtype", "$": "postgis" }
                        ]
                    }
                }
            };
            await axios.post(`${REST_URL}/workspaces/${workspace}/datastores`, 
                dsConfig, { auth: AUTH }).catch(() => console.log("Datastore ya existe."));
        } else if (tipo === 'coveragestore') {
            const csConfig = {
                coverageStore: {
                    name: store,
                    type: "GeoTIFF",
                    url: "file:data/" + workspace
                }
            };
            await axios.post(`${REST_URL}/workspaces/${workspace}/coveragestores`, 
                csConfig, { auth: AUTH }).catch(() => console.log("CoverageStore ya existe."));
        }

        return true;
    } catch (error) {
        console.error("Error configurando GeoServer:", error.message);
        return false;
    }
};

module.exports = { setupGeoserver };