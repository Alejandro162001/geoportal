const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger'); // Importa tu config de Swagger
const geoserverRoutes = require('./src/routes/geoserver_routes'); // Importa tus rutas

const app = express();
const PORT = 3000;

// Middleware para entender JSON (importante para POST/PUT/PATCH)
app.use(express.json());

// 1. Ruta para la Documentación (Interfaz Visual)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 2. Rutas de tu API
app.use('/api', geoserverRoutes);

// Ruta de bienvenida simple
app.get('/', (req, res) => {
  res.send('API GIS funcionando. Ve a /api-docs para ver la documentación.');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor listo en: http://localhost:${PORT}`);
  console.log(`📖 Documentación Swagger en: http://localhost:${PORT}/api-docs\n`);
});