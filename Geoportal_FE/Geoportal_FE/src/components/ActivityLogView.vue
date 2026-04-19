<template>
  <v-container fluid class="bg-grey-lighten-4 pa-8">
    <div class="mb-8">
      <h1 class="text-h3 font-weight-black color-meridian mb-2">Activity Log</h1>
      <p class="text-subtitle-1 text-grey-darken-1">Monitor real-time system events and geospatial data modifications.</p>
    </div>

    <!-- Filtros y Resumen -->
    <v-row class="mb-8">
      <v-col cols="12" md="8">
        <v-card class="rounded-xl border-0 pa-8" elevation="0">
          <v-row>
            <v-col cols="12" sm="4">
              <label class="text-caption font-weight-black text-grey opacity-70 text-uppercase mb-2 d-block">Date Range</label>
              <v-select
                v-model="filters.dateRange"
                :items="['All Time', 'Last 24 Hours']"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                color="indigo-darken-4"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <label class="text-caption font-weight-black text-grey opacity-70 text-uppercase mb-2 d-block">User Role</label>
              <v-select
                v-model="filters.role"
                :items="['All Users', 'Admins', 'System']"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                color="indigo-darken-4"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <label class="text-caption font-weight-black text-grey opacity-70 text-uppercase mb-2 d-block">Action Type</label>
              <v-select
                v-model="filters.actionType"
                :items="['All Actions', 'Uploads', 'Deletions', 'Config Changes']"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                color="indigo-darken-4"
              ></v-select>
            </v-col>
          </v-row>
          <div class="d-flex justify-end mt-4">
             <v-btn color="indigo-darken-4" class="text-none font-weight-black rounded-lg px-8 py-4" size="large" @click="fetchLogs" :loading="loading">Refresh Data</v-btn>
          </div>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card class="rounded-xl border-0 bg-indigo-darken-1 text-white pa-8 h-100 position-relative overflow-hidden" elevation="0">
          <div class="position-relative" style="z-index:1">
            <div class="text-caption font-weight-bold opacity-70 mb-2 uppercase">TOTAL EVENTS (CURRENT)</div>
            <div class="text-h2 font-weight-black mb-1">{{ filteredLogs.length }}</div>
            <div class="text-caption font-weight-bold d-flex align-center">
              <v-icon icon="mdi-history" size="x-small" class="mr-1"></v-icon>
              Showing filtered activities
            </div>
          </div>
          <v-icon icon="mdi-chart-bar" size="100" class="position-absolute opacity-10" style="right: 10px; top: 10px;"></v-icon>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de Logs -->
    <v-card class="rounded-xl border-0 overflow-hidden" elevation="0">
      <v-progress-linear v-if="loading" indeterminate color="indigo-darken-4"></v-progress-linear>
      <v-table class="logs-table px-4">
        <thead>
          <tr class="bg-grey-lighten-5 text-grey-darken-1">
            <th class="text-left font-weight-bold opacity-50 px-6">TIMESTAMP</th>
            <th class="text-left font-weight-bold opacity-50">USER</th>
            <th class="text-center font-weight-bold opacity-50">ACTION</th>
            <th class="text-center font-weight-bold opacity-50">TARGET ENTITY</th>
            <th class="text-center font-weight-bold opacity-50">IP ADDRESS</th>
            <th class="text-right font-weight-bold opacity-50 pe-6">DETAILS</th>
          </tr>
        </thead>
        <tbody class="color-meridian">
          <tr v-for="(log, i) in filteredLogs" :key="i" class="border-b">
            <td class="py-6 px-6">
              <div class="font-weight-black">{{ log.date }}</div>
              <div class="text-caption text-grey font-weight-bold">{{ log.time }}</div>
            </td>
            <td>
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-3 border" color="grey-lighten-4">
                  <v-img :src="log.avatar"></v-img>
                </v-avatar>
                <div class="font-weight-bold">{{ log.usuario }}</div>
              </div>
            </td>
            <td class="text-center">
              <v-chip size="x-small" label class="font-weight-black rounded-sm px-4" 
                      :color="log.actionColor + '-darken-4 text-white'" 
                      variant="flat">
                {{ log.accion.toUpperCase() }}
              </v-chip>
            </td>
            <td class="text-center">
                <code class="bg-indigo-lighten-5 text-indigo-darken-4 px-2 py-1 rounded text-caption font-weight-bold">{{ log.entidad }}</code>
            </td>
            <td class="text-center text-caption font-weight-medium text-grey-darken-1">{{ log.ip }}</td>
            <td class="text-right pe-4">
              <v-tooltip :text="log.detalles" location="top" v-if="log.detalles">
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-information-outline" variant="text" size="small" color="grey-darken-1" v-bind="props"></v-btn>
                </template>
              </v-tooltip>
            </td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="6" class="text-center py-8 text-grey font-weight-bold">
               No activity logs found with current filters.
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <div class="pa-6 border-t d-flex justify-space-between align-center">
        <span class="text-caption text-grey font-weight-bold">Total Events: {{ rawLogs.length }}</span>
        <v-pagination :length="1" density="compact" total-visible="4" color="indigo-darken-4" active-color="indigo-darken-4"></v-pagination>
      </div>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api'

const filters = ref({
  dateRange: 'All Time',
  role: 'All Users',
  actionType: 'All Actions'
})

const rawLogs = ref([])
const loading = ref(false)

const fetchLogs = async () => {
  loading.value = true
  try {
    // Usar la variable de entorno para el endpoint de logs
    const response = await api.get(import.meta.env.VITE_API_LOGS)
    rawLogs.value = response.data
  } catch (error) {
    console.error('Error al cargar logs:', error)
  } finally {
    loading.value = false
  }
}

const filteredLogs = computed(() => {
  return rawLogs.value.filter(log => {
    // Filtro por Acción
    if (filters.value.actionType !== 'All Actions') {
      const type = filters.value.actionType.toUpperCase()
      if (type === 'UPLOADS' && !log.accion.includes('CREATED')) return false
      if (type === 'DELETIONS' && !log.accion.includes('DELETED')) return false
      if (type === 'CONFIG CHANGES' && !log.accion.includes('EDITED')) return false
    }

    // Filtro por Usuario
    if (filters.value.role !== 'All Users') {
       if (filters.value.role === 'Admins' && log.usuario !== 'Administrador') return false
       if (filters.value.role === 'System' && log.usuario !== 'Sistema') return false
    }

    // Filtro por Tiempo (Simplificado para el demo)
    if (filters.value.dateRange === 'Last 24 Hours') {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        if (new Date(log.timestamp) < yesterday) return false
    }

    return true
  }).map(log => {
      const dt = new Date(log.timestamp)
      return {
          ...log,
          date: dt.toISOString().split('T')[0],
          time: dt.toLocaleTimeString(),
          actionColor: log.accion.includes('DELETED') ? 'red' : (log.accion.includes('CREATED') ? 'indigo' : 'amber'),
          avatar: `https://ui-avatars.com/api/?name=${log.usuario}&background=random`
      }
  })
})

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.color-meridian { color: #0D2149; }
.logs-table th {
  height: 64px !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
}
.logs-table td {
  height: 90px !important;
}
code {
  font-family: 'Roboto Mono', monospace;
  font-size: 11px !important;
}
.bg-indigo-darken-1 { background-color: #1A3673 !important; }
</style>
