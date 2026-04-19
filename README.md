# Geoportal - Sistema GIS Fullstack

Este proyecto integra un visualizador de mapas (Vue 3 + Vuetify + Leaflet), un servidor de datos geográficos (GeoServer), una base de datos espacial (PostGIS) y una API de gestión (Node.js + Prisma).

## 🚀 Inicio Rápido (Docker)

Ahora no necesitas configurar nada localmente. Asegúrate de tener **Docker Desktop** abierto y ejecuta:

```bash
docker-compose up --build -d
```

> **Nota:** La primera vez tardará unos minutos en descargar las imágenes. GeoServer puede tardar hasta 2 minutos en estar totalmente activo después de que el contenedor indique "Running".

## 🔗 Enlaces de Interés

- **Frontend (Interfaz)**: [http://localhost:5173](http://localhost:5173)
- **API Docs (Swagger)**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Panel GeoServer**: [http://localhost:8081/geoserver](http://localhost:8081/geoserver)

## 🔐 Credenciales y Configuración

### GeoServer
- **Usuario**: `admin`
- **Contraseña**: `geoserver` (Configurable en `.env`)

### Base de Datos (PostGIS)
- **Host**: `localhost` (para acceso externo) / `db` (interno Docker)
- **Puerto**: `5432` 
- **Usuario/Pass**: `postgres` / `postgres` 
- **DB**: `gis_db`

## 🛠️ Desarrollo

El proyecto está configurado con **Hot-Reload**. Cualquier cambio que realices en el código local de las carpetas `Geoportal_BE` o `Geoportal_FE` se reflejará automáticamente dentro de los contenedores sin necesidad de reiniciar Docker.

Para detener todo el sistema:
```bash
docker-compose down
```
