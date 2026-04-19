const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/swagger'); // Importa tu config de Swagger
const geoserverRoutes = require('./src/routes/geoserver_routes');
const usuarioRoutes = require('./src/routes/usuario_routes');
const logRoutes = require('./src/routes/log_routes');
const userRoutes = require('./src/routes/user_routes');

const app = express();

// Configurar CORS
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', geoserverRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', logRoutes);
app.use('/api', userRoutes);

// Ruta de bienvenida simple
app.get('/', (req, res) => {
  res.send('API GIS funcionando. Ve a /api-docs para ver la documentación.');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor listo en: http://localhost:${PORT}`);
  console.log(`📖 Documentación Swagger en: http://localhost:${PORT}/api-docs\n`);
});