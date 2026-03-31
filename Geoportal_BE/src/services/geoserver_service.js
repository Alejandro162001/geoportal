const axios = require('axios');

const GEOSERVER_URL = 'http://localhost:8080/geoserver/rest';
const AUTH =  { username: 'admin', password: 'mi_password_seguro' }; //reemplaza con geoserver la contraseña todo depende de como corre goeserver

const setupGeoserver = async (workspace, store, tipo = 'datastore') => {
    try {
        await axios.post(`${GEOSERVER_URL}/workspaces`, 
            { workspace: { name: workspace } }, 
            { auth: AUTH }).catch(() => console.log("Workspace ya existe."));

        if (tipo === 'datastore') {
            const dsConfig = {
                dataStore: {
                    name: store,
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
                dsConfig, { auth: AUTH }).catch(() => console.log("Datastore ya existe."));
        } else if (tipo === 'coveragestore') {
            const csConfig = {
                coverageStore: {
                    name: store,
                    type: "GeoTIFF",
                    url: "file:data/" + workspace
                }
            };
            await axios.post(`${GEOSERVER_URL}/workspaces/${workspace}/coveragestores`, 
                csConfig, { auth: AUTH }).catch(() => console.log("CoverageStore ya existe."));
        }

        return true;
    } catch (error) {
        console.error("Error configurando GeoServer:", error.message);
        return false;
    }
};

module.exports = { setupGeoserver };