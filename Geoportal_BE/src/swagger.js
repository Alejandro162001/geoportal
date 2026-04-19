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
        },
        {
            name : 'USUARIOS',
            description : 'Gestión de usuarios y autenticación.'
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
      },
      '/api/usuarios': {
        post: {
          tags: ['USUARIOS'],
          summary: 'Registrar un nuevo usuario',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    nombreCompleto: { type: 'string' },
                    direccion: { type: 'string' },
                    correo: { type: 'string' },
                    contrasena: { type: 'string' },
                    rol: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario creado' }
          }
        },
        get: {
          tags: ['USUARIOS'],
          summary: 'Listar todos los usuarios',
          responses: {
            200: { description: 'Lista de usuarios' }
          }
        }
      },
      '/api/login': {
        post: {
          tags: ['USUARIOS'],
          summary: 'Iniciar sesión',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    correo: { type: 'string' },
                    contrasena: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login exitoso' },
            401: { description: 'Credenciales inválidas' }
          }
        }
      }
    }
  },
  apis: [], // Mantenlo vacío si definiste los paths arriba para evitar errores de YAML
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;