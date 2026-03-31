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
            name : 'Usuarios',
            description : 'Autenticación y gestión de usuarios.'
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
      '/api/registro': {
        post: {
          tags: ['Usuarios'],
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
                    rol: { type: 'string', enum: ['sudo', 'admin', 'user', 'tecnico'], default: 'user', description: 'Solo sudo puede crear admin' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Usuario registrado con éxito' },
            401: { description: 'Token requerido' },
            403: { description: 'Se requiere rol de administrador' },
            409: { description: 'El email ya está registrado' }
          }
        }
      },
      '/api/login': {
        post: {
          tags: ['Usuarios'],
          summary: 'Iniciar sesión',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', format: 'password' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Login exitoso, devuelve JWT token' },
            401: { description: 'Credenciales inválidas' }
          }
        }
      },
      '/api/registro-publico': {
        post: {
          tags: ['Usuarios'],
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
            201: { description: 'Usuario registrado con éxito' },
            400: { description: 'Datos inválidos o contraseñas no coinciden' },
            409: { description: 'El email ya está registrado' }
          }
        }
      },
      '/api/perfil': {
        get: {
          tags: ['Usuarios'],
          summary: 'Obtener perfil del usuario autenticado',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Perfil del usuario' },
            401: { description: 'Token requerido' },
            403: { description: 'Token inválido o expirado' }
          }
        }
      },
      '/api/cambiar-password': {
        put: {
          tags: ['Usuarios'],
          summary: 'Cambiar contraseña del usuario autenticado',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['passwordActual', 'passwordNuevo'],
                  properties: {
                    passwordActual: { type: 'string', format: 'password' },
                    passwordNuevo: { type: 'string', format: 'password' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Contraseña actualizada con éxito' },
            401: { description: 'Contraseña actual incorrecta' }
          }
        }
      },
      '/api/usuarios': {
        get: {
          tags: ['Usuarios'],
          summary: 'Listar todos los usuarios (admin o sudo)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de usuarios' },
            403: { description: 'Se requiere rol de administrador' }
          }
        }
      },
      '/api/usuarios/{id}/rol': {
        put: {
          tags: ['Usuarios'],
          summary: 'Cambiar rol de un usuario (solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'ID del usuario'
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['rol'],
                  properties: {
                    rol: { type: 'string', enum: ['sudo', 'admin', 'user', 'tecnico'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Rol actualizado' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Usuario no encontrado' }
          }
        }
      },
      '/api/usuarios/{id}': {
        delete: {
          tags: ['Usuarios'],
          summary: 'Eliminar usuario - soft delete (admin o sudo)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'ID del usuario'
            }
          ],
          responses: {
            200: { description: 'Usuario eliminado correctamente' },
            403: { description: 'No se puede eliminar un usuario sudo o admin (según jerarquía)' },
            404: { description: 'Usuario no encontrado' }
          }
        }
      },
      '/api/usuarios/{id}/activo': {
        put: {
          tags: ['Usuarios'],
          summary: 'Activar o desactivar usuario (admin o sudo)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: 'ID del usuario'
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['activo'],
                  properties: {
                    activo: { type: 'boolean', description: 'true para activar, false para desactivar' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Estado actualizado' },
            403: { description: 'No se puede cambiar estado de usuario sudo o admin (según jerarquía)' },
            404: { description: 'Usuario no encontrado' }
          }
        }
      },
      '/api/capas/{nombreCapa}': {
        delete: {
          tags: ['GeoServer'],
          summary: 'Eliminar capa SHP (soft delete, solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre de la capa'
            }
          ],
          responses: {
            200: { description: 'Capa eliminada correctamente' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Capa no encontrada o ya eliminada' }
          }
        }
      },
      '/api/capas/{nombreCapa}/activo': {
        put: {
          tags: ['GeoServer'],
          summary: 'Activar o desactivar capa SHP (solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre de la capa'
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['activo'],
                  properties: {
                    activo: { type: 'boolean', description: 'true para activar, false para desactivar' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Estado actualizado' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Capa no encontrada o eliminada' }
          }
        }
      },
      '/api/rasters/{nombreCapa}': {
        delete: {
          tags: ['GeoServer'],
          summary: 'Eliminar raster (soft delete, solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre del raster'
            }
          ],
          responses: {
            200: { description: 'Raster eliminado correctamente' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Raster no encontrado o ya eliminado' }
          }
        }
      },
      '/api/rasters/{nombreCapa}/activo': {
        put: {
          tags: ['GeoServer'],
          summary: 'Activar o desactivar raster (solo admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'nombreCapa',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Nombre del raster'
            }
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['activo'],
                  properties: {
                    activo: { type: 'boolean', description: 'true para activar, false para desactivar' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Estado actualizado' },
            403: { description: 'Se requiere rol de administrador' },
            404: { description: 'Raster no encontrado o eliminado' }
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
  apis: [], // Mantenlo vacío si definiste los paths arriba para evitar errores de YAML
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;