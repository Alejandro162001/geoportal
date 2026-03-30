const axios = require('axios');

const GEOSERVER_URL = 'http://localhost:8080/geoserver/rest';
const AUTH = { username: 'admin', password: 'geoserver' };

const setupGeoserver = async (workspace, datastore) => {
    try {
        // 1. Crear Workspace si no existe
        await axios.post(`${GEOSERVER_URL}/workspaces`, 
            { workspace: { name: workspace } }, 
            { auth: AUTH }).catch(() => console.log("Workspace ya existe."));

        // 2. Crear Datastore (Conexión a PostGIS)
        const dsConfig = {
            dataStore: {
                name: datastore,
                connectionParameters: {
                    entry: [
                        { "@key": "host", "$": "localhost" },
                        { "@key": "port", "$": "5432" },
                        { "@key": "database", "$": "gis_db" },
                        { "@key": "user", "$": "postgres" },
                        { "@key": "passwd", "$": "postgres" },
                        { "@key": "dbtype", "$": "postgis" }
                    ]
                }
            }
        };

        await axios.post(`${GEOSERVER_URL}/workspaces/${workspace}/datastores`, 
            dsConfig, 
            { auth: AUTH }).catch(() => console.log("Datastore ya existe."));

        return true;
    } catch (error) {
        console.error("Error configurando GeoServer:", error.message);
        return false;
    }
};

module.exports = { setupGeoserver };