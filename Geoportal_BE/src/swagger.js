const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GIS API con GeoServer (Institucional)',
      version: '1.0.0',
      description: 'API para gestionar capas y datos geográficos con auditoría institucional.',
    },
    tags: [
        {
            name : 'GeoServer',
            description : 'Operaciones relacionadas con GeoServer y la gestión de capas.'
        },
        {
            name : 'USUARIOS',
            description : 'Gestión de usuarios y autenticación.'
        },
        {
            name : 'AUDITORIA',
            description : 'Bitácora de actividades y eventos del sistema.'
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
          summary: 'Publicar un Shapefile (admin o técnico)',
          security: [{ bearerAuth: [] }],
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
            200: { description: 'Exito' },
            403: { description: 'Se requiere rol de administrador o técnico' }
          }
        }
      },
      '/api/enlistar-db': {
        get: {
          tags: ['GeoServer'],
          summary: 'Enlistar capas desde la base de datos',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de tablas espaciales' },
            401: { description: 'Token requerido' },
            403: { description: 'Token inválido o expirado' }
          }
        }
      },
      '/api/publicar-raster': {
        post: {
          tags: ['GeoServer'],
          summary: 'Publicar un archivo raster (TIFF, GeoTIFF, SID) (admin o técnico)',
          security: [{ bearerAuth: [] }],
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
            400: { description: 'Archivo no válido o formato no soportado' },
            403: { description: 'Se requiere rol de administrador o técnico' }
          }
        }
      },
      '/api/llamar-capas': {
        get: {
          tags: ['GeoServer'],
          summary: 'Jalar capas SHP desde GeoServer con URLs WMS/WFS para OpenLayers',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de capas con configuración lista para visor' },
            401: { description: 'Token requerido' },
            403: { description: 'Token inválido o expirado' }
          }
        }
      },
      '/api/llamar-rasters': {
        get: {
          tags: ['GeoServer'],
          summary: 'Jalar rasters desde GeoServer con URLs WMS para OpenLayers',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de rasters con configuración lista para visor' },
            401: { description: 'Token requerido' },
            403: { description: 'Token inválido o expirado' }
          }
        }
      },
      '/api/descargar-capa/{nombreCapa}': {
        get: {
          tags: ['GeoServer'],
          summary: 'Descargar una capa en formato GeoJSON o Shapefile (solo admin)',
          security: [{ bearerAuth: [] }],
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
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Capa no encontrada' }
          }
        }
      },
      '/api/descargar-raster/{nombreCapa}': {
        get: {
          tags: ['GeoServer'],
          summary: 'Descargar un raster como GeoTIFF (solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre del coverage/raster a descargar'
            },
            {
              name: 'workspace',
              in: 'query',
              required: false,
              schema: { type: 'string', default: 'geoportal' },
              description: 'Workspace de GeoServer donde está el raster'
            }
          ],
          responses: {
            200: { description: 'Archivo raster descargado (GeoTIFF)' },
            400: { description: 'Nombre de capa requerido' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Raster no encontrado en GeoServer' }
          }
        }
      },
      '/api/enlistar-rasters': {
        get: {
          tags: ['GeoServer'],
          summary: 'Enlistar rasters del directorio local',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de rasters almacenados localmente' },
            401: { description: 'Token requerido' },
            403: { description: 'Token inválido o expirado' }
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
          summary: 'Listar todos los usuarios (Excluyendo eliminados)',
          responses: {
            200: { description: 'Lista de usuarios' }
          }
        }
      },
      '/api/usuarios/{id}': {
        patch: {
          tags: ['USUARIOS'],
          summary: 'Editar campos de un usuario específico',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID del usuario'
            }
          ],
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
                    rol: { type: 'string' },
                    activo: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Usuario actualizado' },
            400: { description: 'Error en la actualización' }
          }
        },
        delete: {
          tags: ['USUARIOS'],
          summary: 'Eliminar usuario (Soft Delete)',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'ID del usuario'
            }
          ],
          responses: {
            200: { description: 'Usuario marcado como eliminado' },
            400: { description: 'Error al eliminar' }
          }
        }
      },
      '/api/registro': {
        post: {
          tags: ['USUARIOS'],
          summary: 'Registrar un nuevo usuario (admin o sudo)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nombre', 'email', 'password'],
                  properties: {
                    nombre: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' },
                    rol: { type: 'string', enum: ['sudo', 'admin', 'user', 'tecnico'], default: 'user' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario registrado con éxito' }
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
                    contrasena: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' }
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
      },
      '/api/logs': {
        get: {
          tags: ['AUDITORIA'],
          summary: 'Obtener bitácora de actividades',
          responses: {
            200: { description: 'Lista de eventos del sistema' }
          }
        }
      },
      '/api/registro-publico': {
        post: {
          tags: ['USUARIOS'],
          summary: 'Auto-registro de usuario (rol user)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['nombre', 'apellidos', 'email', 'password', 'passwordConfirmacion'],
                  properties: {
                    nombre: { type: 'string' },
                    apellidos: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password', minLength: 6 },
                    passwordConfirmacion: { type: 'string', format: 'password' },
                    telefono: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario registrado con éxito' }
          }
        }
      },
      '/api/perfil': {
        get: {
          tags: ['USUARIOS'],
          summary: 'Obtener perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Perfil del usuario' }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: [],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;