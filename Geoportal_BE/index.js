const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger');
const geoserverRoutes = require('./src/routes/geoserver_routes');
const userRoutes = require('./src/routes/user_routes');

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', geoserverRoutes);
app.use('/api', userRoutes);

// Ruta de bienvenida simple
app.get('/', (req, res) => {
  res.send('API GIS funcionando. Ve a /api-docs para ver la documentación.');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor listo en: http://localhost:${PORT}`);
  console.log(`📖 Documentación Swagger en: http://localhost:${PORT}/api-docs\n`);
});