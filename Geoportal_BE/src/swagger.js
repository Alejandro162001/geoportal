const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Asegúrate de que esta línea esté AQUÍ
    info: {
      title: 'GIS API con GeoServer',
      version: '1.0.0',
      description: 'API para gestionar capas y datos geográficos.',
    },
    tags: [
        {
            name : 'GeoServer',
            description : 'Operaciones relacionadas con GeoServer y la gestión de capas.'
        }
    ],
        
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local de Desarrollo',
      },
    ],
    paths: {
      '/api/publicar-shp': {
        post: {
            tags: ['GeoServer'],
          summary: 'Publicar un Shapefile',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    nombreCapa: { type: 'string' },
                    workspace: { type: 'string' },
                    shapefile: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Exito' }
          }
        }
      },
      '/api/enlistar-db': {
        get: {
          tags: ['GeoServer'],
          summary: 'Enlistar capas desde la base de datos',
          responses: {
            200: { description: 'Lista de tablas espaciales' }
          }
        }
      },
      '/api/geoserver-layers': {
        get: {
          tags: ['GeoServer'],
          summary: 'Jalar capas directamente de GeoServer',
          responses: {
            200: { description: 'Lista de capas en GeoServer' }
          }
        }
      }
    }
  },
  apis: [], // Mantenlo vacío si definiste los paths arriba para evitar errores de YAML
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;