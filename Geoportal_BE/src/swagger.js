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
      '/api/publicar-raster': {
        post: {
          tags: ['GeoServer'],
          summary: 'Publicar un archivo raster (TIFF, GeoTIFF, SID)',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    nombreCapa: { type: 'string' },
                    workspace: { type: 'string' },
                    raster: { type: 'string', format: 'binary' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Raster publicado con éxito' },
            400: { description: 'Archivo no válido o formato no soportado' }
          }
        }
      },
      '/api/llamar-capas': {
        get: {
          tags: ['GeoServer'],
          summary: 'Jalar capas directamente de GeoServer',
          responses: {
            200: { description: 'Lista de capas en GeoServer' }
          }
        }
      },
      '/api/descargar-capa/{nombreCapa}': {
        get: {
          tags: ['GeoServer'],
          summary: 'Descargar una capa en formato GeoJSON o Shapefile',
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre de la capa a descargar'
            },
            {
              name: 'formato',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['geojson', 'shp'], default: 'geojson' },
              description: 'Formato de descarga: geojson o shp'
            }
          ],
          responses: {
            200: { description: 'Archivo de capa descargado' },
            400: { description: 'Parámetros inválidos' },
            404: { description: 'Capa no encontrada' }
          }
        }
      }
    }
  },
  apis: [], // Mantenlo vacío si definiste los paths arriba para evitar errores de YAML
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;