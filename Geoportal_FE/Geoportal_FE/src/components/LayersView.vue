<template>
  <v-container fluid class="bg-grey-lighten-4 pa-8">
    <div class="mb-2 text-caption font-weight-bold text-grey opacity-70">CONSOLE / DATA MANAGEMENT</div>
    <div class="mb-8">
      <div class="d-flex justify-space-between align-end">
        <div>
          <h1 class="text-h3 font-weight-black color-meridian mb-2">Gestión de Capas</h1>
          <p class="text-subtitle-1 text-grey-darken-1 font-weight-medium max-width-600">
            Centralized inventory for geospatial assets. Manage high-resolution rasters, vector shapefiles, and metadata synchronization across the global GIS engine.
          </p>
        </div>
        <div class="d-flex ga-4 align-center">
          <v-btn 
            variant="outlined" 
            color="indigo-darken-4" 
            prepend-icon="mdi-grid" 
            class="text-none font-weight-bold rounded-lg px-6" 
            size="large"
            @click="rasterDialog = true"
          >
            Subir Raster
          </v-btn>
          <v-btn 
            color="indigo-darken-4" 
            prepend-icon="mdi-upload" 
            class="text-none font-weight-bold rounded-lg px-6" 
            size="large"
            @click="uploadDialog = true"
          >
            Subir Capa
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Modal de Subida de Raster -->
    <v-dialog v-model="rasterDialog" max-width="600" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2" elevation="12">
        <v-card-title class="pa-6 d-flex align-center">
          <v-avatar color="indigo-lighten-4" size="40" class="mr-4">
            <v-icon icon="mdi-grid" color="indigo-darken-4"></v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-black color-meridian">Publicar Raster (GeoTIFF)</div>
            <div class="text-caption font-weight-bold text-grey">GeoServer Imagery Service</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey" @click="closeRaster"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-8">
          <v-form ref="rasterForm" v-model="rasterFormValid" @submit.prevent="handleRasterUpload">
            <v-row>
              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Nombre del Raster</label>
                <v-text-field
                  v-model="rasterData.nombreCapa"
                  placeholder="ej: ortofoto_2024"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  :rules="[v => !!v || 'Requerido']"
                  hide-details="auto"
                  class="mb-4"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Workspace</label>
                <v-text-field
                  v-model="rasterData.workspace"
                  placeholder="ej: geoportal"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  :rules="[v => !!v || 'Requerido']"
                  hide-details="auto"
                  class="mb-4"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Imagen GeoTIFF (.tif)</label>
                <v-file-input
                  v-model="rasterData.file"
                  prepend-icon=""
                  prepend-inner-icon="mdi-image-multiple"
                  placeholder="Selecciona el archivo TIFF"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  show-size
                  accept=".tif,.tiff"
                  :rules="[v => !!v || 'Archivo requerido']"
                  hide-details="auto"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none font-weight-black" color="grey" @click="closeRaster">Cancelar</v-btn>
          <v-btn 
            color="indigo-darken-4" 
            class="text-none font-weight-black rounded-lg px-8" 
            size="large"
            :loading="rasterLoading"
            :disabled="!rasterFormValid"
            @click="handleRasterUpload"
          >
            Publicar Raster
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal de Subida de Capa -->
    <v-dialog v-model="uploadDialog" max-width="600" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2" elevation="12">
        <v-card-title class="pa-6 d-flex align-center">
          <v-avatar color="indigo-darken-4" size="40" class="mr-4">
            <v-icon icon="mdi-cloud-upload" color="white"></v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-black color-meridian">Publicar Capa SHP</div>
            <div class="text-caption font-weight-bold text-grey">GeoServer Gateway Service</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey" @click="closeUpload"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-8">
          <v-form ref="uploadForm" v-model="formValid" @submit.prevent="handleUpload">
            <v-row>
              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Nombre de la Capa</label>
                <v-text-field
                  v-model="uploadData.nombreCapa"
                  placeholder="ej: catastro_urbanismo"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  :rules="[v => !!v || 'Requerido']"
                  hide-details="auto"
                  class="mb-4"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Workspace (GeoServer)</label>
                <v-text-field
                  v-model="uploadData.workspace"
                  placeholder="ej: geoportal"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  :rules="[v => !!v || 'Requerido']"
                  hide-details="auto"
                  class="mb-4"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Archivo Shapefile (.zip)</label>
                <v-file-input
                  v-model="uploadData.shapefile"
                  prepend-icon=""
                  prepend-inner-icon="mdi-zip-box"
                  placeholder="Selecciona el archivo comprimido"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  show-size
                  accept=".zip"
                  :rules="[v => !!v || 'Archivo requerido']"
                  hide-details="auto"
                ></v-file-input>
                <div class="text-caption text-grey mt-2 px-1">
                  * El archivo debe contener los archivos .shp, .dbf, .shx y .prj comprimidos en ZIP.
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none font-weight-black" color="grey" @click="closeUpload">Cancelar</v-btn>
          <v-btn 
            color="indigo-darken-4" 
            class="text-none font-weight-black rounded-lg px-8" 
            size="large"
            :loading="loading"
            :disabled="!formValid"
            @click="handleUpload"
          >
            Publicar Capa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar Feedback -->
    <v-snackbar v-model="feedback.show" :color="feedback.color" timeout="4000" location="top">
      {{ feedback.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="feedback.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>

    <!-- Carpintería Original -->
    <v-row class="mb-8 ga-0">
      <v-col cols="12" md="8">
        <v-card class="rounded-xl border-0 bg-white pa-8 overflow-hidden" elevation="0">
          <v-row align="center">
            <v-col cols="12" sm="4" v-for="(stat, i) in stats" :key="i" class="border-e-sm border-grey-lighten-3 px-6 last-col-no-border">
              <div class="text-caption text-grey-darken-1 font-weight-black mb-2 opacity-70 text-uppercase">{{ stat.title }}</div>
              <div class="text-h2 font-weight-black color-meridian d-flex align-baseline ga-2">
                {{ stat.value }}
                <span v-if="stat.unit" class="text-h6 opacity-50">{{ stat.unit }}</span>
              </div>
            </v-col>
            <!-- Visualizador lateral mini -->
            <div class="d-flex align-end ga-1 ms-auto pe-8" style="height: 100px;">
              <div v-for="h in [30, 50, 45, 80, 70, 95]" :key="h" class="bg-indigo-lighten-3 rounded-t-xs" :style="{ height: h + '%', width: '12px' }"></div>
            </div>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-xl border-0 bg-indigo-darken-4 text-white pa-8 overflow-hidden h-100" elevation="0">
          <div class="position-relative" style="z-index:1">
            <div class="text-caption font-weight-bold opacity-60 mb-1">SYSTEM STATUS</div>
            <div class="text-h5 font-weight-black mb-2">Optimization in progress</div>
            <p class="text-caption opacity-80 mb-0 font-weight-medium">
              Indexing 12 new raster tiles from Sentinel-2B.
            </p>
          </div>
          <v-icon icon="mdi-engine-outline" size="120" color="white" class="position-absolute opacity-10" style="right: -20px; bottom: -20px;"></v-icon>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de Capas -->
    <v-card class="rounded-xl border-0 overflow-hidden" elevation="0">
      <div class="pa-6 border-b d-flex align-center ga-6">
        <v-btn variant="text" prepend-icon="mdi-filter-variant" class="text-none font-weight-bold opacity-70">Filter</v-btn>
        <v-btn variant="text" prepend-icon="mdi-sort-variant" class="text-none font-weight-bold opacity-70">Sort by Date</v-btn>
        <v-spacer></v-spacer>
        <span class="text-caption text-grey font-weight-bold opacity-70">SHOWING 1-10 OF 1,284 ASSETS</span>
      </div>
      
      <v-progress-linear v-if="tableLoading" indeterminate color="indigo-darken-4"></v-progress-linear>
      
      <v-table class="layers-table px-4">
        <thead>
          <tr class="text-grey-darken-1">
            <th class="text-left font-weight-bold opacity-50 px-6">LAYER NAME</th>
            <th class="text-center font-weight-bold opacity-50">TYPE</th>
            <th class="text-left font-weight-bold opacity-50">DATE UPLOADED</th>
            <th class="text-center font-weight-bold opacity-50">FILE SIZE</th>
            <th class="text-center font-weight-bold opacity-50">VISIBILITY</th>
            <th class="text-right font-weight-bold opacity-50 pe-10">ACTIONS</th>
          </tr>
        </thead>
        <tbody class="color-meridian">
          <tr v-for="layer in layers" :key="layer.id">
            <td class="py-4 px-6">
              <div class="d-flex align-center">
                <v-avatar :color="layer.iconBg" rounded="lg" size="44" class="mr-4">
                  <v-icon :icon="layer.icon" color="white" size="24"></v-icon>
                </v-avatar>
                <div>
                  <div class="font-weight-black">{{ layer.name }}</div>
                  <div class="text-caption text-grey font-weight-bold">{{ layer.srid }}</div>
                </div>
              </div>
            </td>
            <td class="text-center">
              <v-chip size="x-small" label class="font-weight-black rounded-sm px-4" 
                      :color="layer.type === 'RASTER' ? 'amber-lighten-4' : 'indigo-lighten-4'" 
                      :text-color="layer.type === 'RASTER' ? 'amber-darken-4' : 'indigo-darken-4'">
                {{ layer.type }}
              </v-chip>
            </td>
            <td>
              <div class="text-caption font-weight-bold">{{ layer.date }}</div>
              <div class="text-caption text-grey font-weight-medium opacity-70">{{ layer.time }}</div>
            </td>
            <td class="text-center font-weight-bold">{{ layer.size }}</td>
            <td class="text-center">
              <v-switch v-model="layer.visible" color="amber-darken-2" hide-details density="compact" class="d-inline-flex"></v-switch>
            </td>
            <td class="text-right pe-4">
               <v-menu transition="scale-transition">
                 <template v-slot:activator="{ props }">
                   <v-btn icon="mdi-dots-vertical" variant="text" size="small" color="grey-darken-1" v-bind="props"></v-btn>
                 </template>
                 <v-list class="rounded-lg pa-2" min-width="220">
                   <div class="text-caption font-weight-black text-grey px-4 py-2 opacity-70 uppercase">EXPORT OPTIONS</div>
                   <v-list-item 
                     prepend-icon="mdi-code-json" 
                     title="Descargar como GeoJSON" 
                     class="rounded-md mb-1" 
                     density="comfortable"
                     @click="descargarCapa(layer.name, 'geojson')"
                   ></v-list-item>
                   <v-list-item 
                     prepend-icon="mdi-folder-zip-outline" 
                     title="Descargar como Shapefile" 
                     class="rounded-md" 
                     density="comfortable"
                     @click="descargarCapa(layer.name, 'shp')"
                   ></v-list-item>
                 </v-list>
               </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <div class="pa-6 border-t d-flex justify-space-between align-center">
        <span class="text-caption text-grey font-weight-bold">Page 1 of 128</span>
        <v-pagination :length="128" density="compact" total-visible="4" color="indigo-darken-4" active-color="indigo-darken-4"></v-pagination>
      </div>
    </v-card>

    <!-- Footer Alerts -->
    <v-row class="mt-8 ga-4">
      <v-col cols="12" md="6">
        <v-alert color="white" border="start" border-color="amber-darken-4" class="rounded-xl pa-8 border-start-4" elevation="0">
          <template v-slot:prepend>
            <v-avatar color="amber-darken-4" size="24" class="mr-4">
                <span class="text-white font-weight-bold" style="font-size: 14px">i</span>
              </v-avatar>
          </template>
          <div>
            <div class="text-subtitle-1 font-weight-black color-meridian mb-1">Auto-Archive Policy</div>
            <div class="text-caption text-grey-darken-1 font-weight-medium">Layers inactive for more than 180 days will be automatically moved to cold storage (S3 Glacier). Metadata remains searchable.</div>
          </div>
        </v-alert>
      </v-col>
      <v-col cols="12" md="6">
        <v-alert color="white" border="start" border-color="indigo-darken-4" class="rounded-xl pa-8 border-start-4" elevation="0">
          <template v-slot:prepend>
            <v-avatar color="indigo-darken-4" size="24" class="mr-4">
                <v-icon icon="mdi-chart-line" color="white" size="14"></v-icon>
              </v-avatar>
          </template>
          <div>
            <div class="text-subtitle-1 font-weight-black color-meridian mb-1">Cache Performance</div>
            <div class="text-caption text-grey-darken-1 font-weight-medium">Tile server latency is currently optimal (14ms). Raster rendering engine operating at 99.98% efficiency.</div>
          </div>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'

const stats = reactive([
  // ... (rest of the file follows the same pattern)
  { title: 'TOTAL ASSETS', value: '0' },
  { title: 'ACTIVE LAYERS', value: '0' },
  { title: 'STORAGE USED', value: '0.0', unit: 'GB' }
])

const layers = ref([])
const tableLoading = ref(false)

// Lógica de Subida SHP
const uploadDialog = ref(false)
const formValid = ref(false)
const loading = ref(false)
const uploadForm = ref(null)

const uploadData = reactive({
  nombreCapa: '',
  workspace: 'geoportal',
  shapefile: null
})

// Lógica de Subida RASTER
const rasterDialog = ref(false)
const rasterFormValid = ref(false)
const rasterLoading = ref(false)
const rasterForm = ref(null)

const rasterData = reactive({
  nombreCapa: '',
  workspace: 'geoportal',
  file: null
})

const feedback = reactive({
  show: false,
  text: '',
  color: 'success'
})

const closeRaster = () => {
  rasterDialog.value = false
  rasterData.nombreCapa = ''
  rasterData.file = null
  if (rasterForm.value) rasterForm.value.resetValidation()
}

const descargarCapa = async (nombreCapa, formato = 'geojson') => {
  try {
    const ext = formato === 'shp' ? 'zip' : 'geojson'
    feedback.text = `Generando archivo ${formato.toUpperCase()} para: ${nombreCapa}...`
    feedback.color = 'indigo'
    feedback.show = true

    // Usar la variable de entorno para el endpoint de descarga
    const response = await api.get(`${import.meta.env.VITE_API_DOWNLOAD}/${nombreCapa}?formato=${formato}`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${nombreCapa}.${ext}`)
    document.body.appendChild(link)
    link.click()
    
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    feedback.text = '¡Exportación completada con éxito!'
    feedback.color = 'success'
    feedback.show = true
  } catch (error) {
    console.error('Error al exportar capa:', error)
    feedback.text = 'Error al generar el archivo. Verifique la conexión con el motor GIS.'
    feedback.color = 'error'
    feedback.show = true
  }
}

const handleRasterUpload = async () => {
  if (!rasterFormValid.value) return

  rasterLoading.value = true
  const formData = new FormData()
  formData.append('nombreCapa', rasterData.nombreCapa)
  formData.append('workspace', rasterData.workspace)
  formData.append('file', rasterData.file[0] || rasterData.file)

  try {
    // Usar la variable de entorno para publicar raster
    await api.post(import.meta.env.VITE_API_UPLOAD_RASTER, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    feedback.text = '¡Imagen Raster publicada exitosamente!'
    feedback.color = 'success'
    feedback.show = true
    closeRaster()
    fetchLayers()
  } catch (error) {
    console.error('Error al publicar raster:', error)
    feedback.text = error.response?.data?.message || 'Error al conectar con el servidor de imágenes'
    feedback.color = 'error'
    feedback.show = true
  } finally {
    rasterLoading.value = false
  }
}

const fetchLayers = async () => {
  tableLoading.value = true
  try {
    // Ejecutar ambas peticiones en paralelo para mayor velocidad usando la instancia central api
    const [dbResponse, rasterResponse] = await Promise.all([
      api.get(import.meta.env.VITE_API_LAYERS_DB),
      api.get(import.meta.env.VITE_API_LAYERS_GS).catch(e => {
        console.warn('Endpoint GeoServer vacío o no disponible:', e)
        return { data: { capas: [] } }
      })
    ])
    
    // 1. Mapear los datos de la DB (Vectores)
    const vectorLayers = dbResponse.data.capas.map((c, index) => ({
      id: `v-${index + 1}`,
      name: c.table_name,
      srid: `SRID: ${c.srid} - ${c.f_geometry_column}`,
      type: c.type || 'GEOMETRY',
      date: 'Base de Datos',
      time: 'Live',
      size: '-',
      visible: true,
      icon: c.type === 'POINT' ? 'mdi-map-marker' : (c.type === 'LINESTRING' ? 'mdi-vector-line' : 'mdi-share-variant'),
      iconBg: 'indigo-lighten-2'
    }))

    // 2. Mapear los datos de Rasters (si existen)
    const rasterLayers = (rasterResponse.data.capas || []).map((r, index) => ({
      id: `r-${index + 1}`,
      name: r.name || r.table_name || 'Capa Raster',
      srid: r.srid || 'EPSG:4326',
      type: 'RASTER',
      date: 'Almacenamiento Geo',
      time: '-',
      size: r.size || '-',
      visible: true,
      icon: 'mdi-grid',
      iconBg: 'blue-lighten-2'
    }))

    // 3. Unir ambos resultados
    layers.value = [...vectorLayers, ...rasterLayers]

    // Actualizar stats (suma de ambos)
    const totalCount = vectorLayers.length + rasterLayers.length
    stats[0].value = totalCount.toString()
    stats[1].value = totalCount.toString()
    
  } catch (error) {
    console.error('Error al sincronizar capas:', error)
    feedback.text = 'Error al sincronizar el inventario de capas'
    feedback.color = 'error'
    feedback.show = true
  } finally {
    tableLoading.value = false
  }
}

onMounted(() => {
  fetchLayers()
})

const closeUpload = () => {
  uploadDialog.value = false
  uploadData.nombreCapa = ''
  uploadData.shapefile = null
  if (uploadForm.value) uploadForm.value.resetValidation()
}

const handleUpload = async () => {
  if (!formValid.value) return

  loading.value = true
  const formData = new FormData()
  formData.append('nombreCapa', uploadData.nombreCapa)
  formData.append('workspace', uploadData.workspace)
  formData.append('shapefile', uploadData.shapefile[0] || uploadData.shapefile)

  try {
    // Usar la variable de entorno para publicar SHP
    await api.post(import.meta.env.VITE_API_UPLOAD_SHP, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    feedback.text = '¡Capa publicada exitosamente!'
    feedback.color = 'success'
    feedback.show = true
    closeUpload()
    fetchLayers() // Recargar la tabla
  } catch (error) {
    console.error('Error al publicar:', error)
    feedback.text = error.response?.data?.message || 'Error al conectar con el servidor'
    feedback.color = 'error'
    feedback.show = true
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.color-meridian { color: #0D2149; }
.max-width-600 { max-width: 600px; }
.last-col-no-border:last-of-type { border-right: none !important; }
.layers-table th {
  height: 64px !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
}
.layers-table td {
  height: 80px !important;
  font-size: 14px;
}
.border-start-4 { border-inline-start-width: 4px !important; }
.br-indigo::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 40%; background: #F8F9FF; z-index: 0; border-radius: 24px 0 0 24px; }
</style>
