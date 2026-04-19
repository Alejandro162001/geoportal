# Geoportal - Sistema GIS Fullstack

Este proyecto integra un visualizador de mapas (Vue 3 + Vuetify + Leaflet), un servidor de datos geográficos (GeoServer), una base de datos espacial (PostGIS) y una API de gestión (Node.js + Prisma).

## 🚀 Guía de Inicio (Paso a Paso)

Sigue estos pasos para levantar el entorno completo de desarrollo:

### 1. Requisitos Previos

- Tener **Docker Desktop instalado y abierto**.
- Un archivo `.env` configurado en la raíz de `Geoportal_BE` (puedes copiar el ejemplo si existe).

### 2. Levantar el Entorno con Docker

Ejecuta el siguiente comando en la raíz del proyecto para construir e iniciar todos los servicios:

```bash
docker-compose up --build -d
```

> **Nota:** La primera vez tardará unos minutos. El backend ejecutará automáticamente `prisma generate` y `prisma db push` al iniciar, por lo que las tablas se crearán solas.

### 3. Poblar la Base de Datos (Opcional)

Si deseas cargar los datos iniciales (usuarios de prueba, etc.), ejecuta el seed:

```bash
cd Geoportal_BE
npx prisma db seed
```

### 4. Verificar el Estado

GeoServer puede tardar hasta 2 minutos en estar totalmente activo. Puedes ver los logs para asegurar que todo va bien:

```bash
docker-compose logs -f backend
```

## 🔗 Enlaces de Interés

- **Frontend (Interfaz)**: [http://localhost:5173](http://localhost:5173)
- **API Docs (Swagger)**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Panel GeoServer**: [http://localhost:8081/geoserver](http://localhost:8081/geoserver)

## 🔐 Credenciales y Configuración

### GeoServer

- **Usuario**: `admin`
- **Contraseña**: `geoserver`

### Base de Datos (PostGIS)

- **Host**: `localhost` (externo) / `db` (interno Docker)
- **Puerto**: `5432`
- **Usuario/Pass**: `postgres` / `postgres`
- **DB**: `gis_db`

## 🛠️ Desarrollo

El proyecto usa **Hot-Reload**. Los cambios en el código local de `Geoportal_BE` o `Geoportal_FE` se reflejan automáticamente.

Para detener el sistema:

```bash
docker-compose down
```

Si en el futuro llegas a vaciar la base de datos o bajas por completo los contenedores con docker-compose down, recuerda que tus comandos ahora viven dentro del contenedor. Puedes volver a poblarla con:

powershell
docker exec geoportal-backend-1 npx prisma db seed
La contraseña para el usuario administrador es:

admin123

(Con el correo: admin@geoportal.gov)

Esta es la contraseña que está configurada por defecto en tu archivo seed.js. ¡Pruébala y deberías poder entrar al sistema!
