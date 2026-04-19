<template>
  <v-container fluid class="bg-grey-lighten-4 pa-8">
    <!-- Header de Estadísticas Rápidas -->
    <v-row>
      <v-col cols="12" sm="6" md="3" v-for="(stat, i) in stats" :key="i">
        <v-card class="rounded-xl border-0" elevation="0">
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-start">
              <div>
                <div class="text-caption text-grey-darken-1 font-weight-bold mb-1 opacity-70">{{ stat.title }}</div>
                <div class="text-h4 font-weight-black mb-1 color-meridian">{{ stat.value }}</div>
                <div :style="{ color: stat.trendColor === 'text-amber-darken-4' ? '#AE8200' : '' }" class="text-caption d-flex align-center font-weight-bold">
                  <v-icon :icon="stat.trendIcon" size="x-small" class="mr-1"></v-icon>
                  {{ stat.trend }}
                </div>
              </div>
              <v-avatar :color="stat.color + '-lighten-4'" rounded="lg" size="56">
                <v-icon :icon="stat.icon" color="#17305b" size="28"></v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Fila Central: Chart.js y Distribución -->
    <v-row class="mt-6">
      <!-- Frecuencia de Uso del Sistema con Chart.js -->
      <v-col cols="12" md="8">
        <v-card class="rounded-xl border-0 pa-4" elevation="0">
          <v-card-title class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h6 font-weight-bold color-meridian">System Usage Frequency</div>
              <div class="text-caption text-grey">Transaction volume over the last 30 days</div>
            </div>
            <v-btn-toggle density="compact" color="indigo-darken-4" variant="flat" border mandatory class="rounded-lg">
              <v-btn value="30D" class="px-4">30D</v-btn>
              <v-btn value="90D" class="px-4">90D</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text class="pt-6">
            <div style="height: 300px;">
              <Bar :data="chartData" :options="chartOptions" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Distribución de Almacenamiento -->
      <v-col cols="12" md="4">
        <v-card class="rounded-xl border-0 pa-6" elevation="0">
          <v-card-title class="pa-0 mb-8 text-h6 font-weight-bold color-meridian">Storage Distribution</v-card-title>
          
          <div class="mb-8">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
              <span class="color-meridian">Raster Data (GeoTIFF)</span>
              <span>2.8 TB</span>
            </div>
            <v-progress-linear color="indigo-darken-4" height="8" model-value="85" rounded></v-progress-linear>
          </div>

          <div class="mb-10">
            <div class="d-flex justify-space-between text-caption font-weight-bold mb-2">
              <span class="color-meridian">Vector Layers (SHP/GeoJSON)</span>
              <span>1.4 TB</span>
            </div>
            <v-progress-linear color="#AE8200" height="8" model-value="45" rounded></v-progress-linear>
          </div>
          
          <v-alert rounded="lg" color="#FFF8E1" class="text-brown-darken-4 text-caption border-0 py-4" style="border: 1px solid #FFECB3 !important;">
            <template v-slot:prepend>
              <v-avatar color="#AE8200" size="24" class="mr-2">
                <span class="text-white font-weight-bold" style="font-size: 14px">i</span>
              </v-avatar>
            </template>
            Archival protocols scheduled for 15% of inactive rasters in 48 hours.
          </v-alert>
        </v-card>
      </v-col>
    </v-row>

    <!-- Fila Inferior: Capas más accedidas y Actividad Reciente -->
    <v-row class="mt-6 ga-0">
      <v-col cols="12" md="6">
        <v-card class="rounded-xl border-0 pa-6" elevation="0">
          <v-card-title class="pa-0 mb-6 d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold color-meridian">Top Accessed Layers</span>
            <v-btn variant="text" color="indigo-darken-4" size="small" class="text-none font-weight-bold">VIEW ALL</v-btn>
          </v-card-title>
          <v-list class="pa-0 bg-transparent">
            <v-list-item v-for="(layer, i) in topLayers" :key="i" class="px-4 py-3 mb-3 bg-grey-lighten-5 rounded-lg border">
              <template v-slot:prepend>
                <v-avatar color="#344fa2" rounded="lg" size="52" class="mr-4 border">
                  <v-icon color="white" size="28">mdi-share-variant</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold color-meridian mb-1">{{ layer.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ layer.dept }} • {{ layer.views }} views</v-list-item-subtitle>
              <template v-slot:append>
                <v-chip size="x-small" label class="font-weight-black rounded-sm" color="#AE8200" variant="flat" style="background-color: #FFF8E1 !important; color: #AE8200 !important; border: 1px solid #FFECB3 !important;">
                  {{ layer.type }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="rounded-xl border-0 pa-6" elevation="0">
          <v-card-title class="pa-0 mb-8 text-h6 font-weight-bold color-meridian">System Activity</v-card-title>
          <v-timeline side="end" align="start" density="compact" line-color="grey-lighten-3" class="ps-2">
            <v-timeline-item
              v-for="(item, i) in activities"
              :key="i"
              :dot-color="item.color"
              size="x-small"
              class="mb-6"
            >
              <div class="mb-2">
                <div class="text-subtitle-2 font-weight-black color-meridian">{{ item.title }}</div>
                <div class="text-caption text-grey-darken-2" v-html="item.desc"></div>
                <div class="text-caption text-grey font-weight-bold mt-2 opacity-70">{{ item.time }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const stats = ref([
  { title: 'USUARIOS TOTALES', value: '0', trend: 'Base de Datos', trendColor: 'text-success', trendIcon: 'mdi-refresh', color: '#17305b', icon: 'mdi-account', iconColor: '#17305b' },
  { title: 'CAPAS ACTIVAS', value: '1', trend: 'Live from Engine', trendColor: 'text-success', trendIcon: 'mdi-plus', color: '#FFFFFF', icon: 'mdi-layers-triple', iconColor: '#17305b' },
  { title: 'ALMACENAMIENTO', value: '4.2 TB', trend: '84% capacidad', trendColor: 'text-amber-darken-4', trendIcon: 'mdi-alert', color: '#FFFFFF', icon: 'mdi-database', iconColor: '#17305b' },
  { title: 'DESCARGAS', value: '156', trend: 'Últimas 24h', trendColor: 'text-grey', trendIcon: 'mdi-clock-outline', color: '#FFFFFF', icon: 'mdi-download', iconColor: '#17305b' }
])

const activities = ref([])
const loading = ref(false)

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + " years ago"
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + " months ago"
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + " days ago"
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + " hours ago"
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + " minutes ago"
  return Math.floor(seconds) + " seconds ago"
}

const topLayers = ref([])

const fetchDashboardData = async () => {
    loading.value = true
    try {
        // Usar variables de entorno declaradas en .env
        const [usersResp, logsResp, dbLayersResp, gsLayersResp] = await Promise.all([
          api.get(import.meta.env.VITE_API_USERS),
          api.get(import.meta.env.VITE_API_LOGS),
          api.get(import.meta.env.VITE_API_LAYERS_DB).catch(() => ({ data: { capas: [] } })),
          api.get(import.meta.env.VITE_API_LAYERS_GS).catch(() => ({ data: { capas: [] } }))
        ])

        // 1. Contador de Usuarios
        stats.value[0].value = usersResp.data.length.toLocaleString()

        // 2. Contador de Capas Activas (Vectores DB + Rasters GeoServer)
        const vLayers = dbLayersResp.data.capas || []
        const rLayers = gsLayersResp.data.capas || []
        const totalCapas = vLayers.length + rLayers.length
        stats.value[1].value = totalCapas.toLocaleString()
        stats.value[1].trend = 'Live from Engine'

        // 3. Poblar "Top Accessed Layers" con datos reales (Primeros 3)
        const allLayers = [
          ...vLayers.map(l => ({ name: l.table_name, dept: 'Geoespacial DB', type: 'GEOMETRY' })),
          ...rLayers.map(l => ({ name: l.name, dept: 'GeoServer Raster', type: 'RASTER' }))
        ]
        topLayers.value = allLayers.slice(0, 3)

        // 4. Línea de tiempo de Logs - Solo mostrar los últimos 4 eventos
        activities.value = logsResp.data.slice(0, 4).map(log => ({
            title: log.accion,
            desc: `Usuario <strong>${log.usuario}</strong> realizó una acción sobre <strong>${log.entidad}</strong>`,
            color: log.accion.includes('DELETED') ? '#d32f2f' : 
                   (log.accion.includes('LOGIN') ? '#344fa2' : 
                   (log.accion.includes('LOGOUT') ? '#AE8200' : 
                   (log.accion.includes('CREATED') ? '#17305b' : '#344fa2'))),
            time: timeAgo(log.timestamp).toUpperCase()
        }))
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchDashboardData()
})

const chartData = {
  labels: ['OCT 01', 'OCT 04', 'OCT 07', 'OCT 10', 'OCT 13', 'OCT 16', 'OCT 19', 'OCT 22', 'OCT 25', 'OCT 28', 'OCT 30'],
  datasets: [
    {
      label: 'Transactions',
      backgroundColor: (ctx) => {
        const index = ctx.dataIndex;
        return index % 2 === 0 ? '#17305b' : '#344fa2';
      },
      borderRadius: 4,
      data: [35, 55, 42, 65, 60, 50, 75, 95, 68, 45, 50]
    }
  ]
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { display: false },
      ticks: { color: '#9E9E9E', font: { size: 10, weight: 'bold' } }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#9E9E9E', font: { size: 10, weight: 'bold' } }
    }
  }
}
</script>

<script>
export default {
  name: 'DashboardView'
}
</script>

<style scoped>
.color-meridian {
  color: #17305b;
}
.text-success { color: #2E7D32 !important; }
</style>
