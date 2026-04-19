<template>
  <v-layout class="geoportal-layout">
    <!-- Barra Superior -->
    <v-app-bar elevation="0" border="b" class="px-4" height="64" color="white">
      <v-app-bar-nav-icon @click="drawer = !drawer" color="indigo-darken-4"></v-app-bar-nav-icon>
      <div class="d-flex align-center cursor-pointer ml-2" @click="$router.push('/admin/dashboard')">
        <img src="/Logo IP 2026 Horizontal.png" height="36" class="mr-2" style="object-fit: contain" />
        <v-divider vertical class="mx-3" thickness="2" style="height: 24px"></v-divider>
        <div class="text-h6 font-weight-black color-meridian">VISOR</div>
      </div>
      <v-spacer></v-spacer>
      <div class="search-container-map">
         <v-text-field
          v-model="searchQuery"
          placeholder="Ej: 477600, 1555800 o Lat, Lon"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          hide-details
          density="compact"
          class="search-bar-map"
          bg-color="grey-lighten-4"
          rounded="lg"
          @keyup.enter="handleSearch"
        ></v-text-field>
      </div>
      <v-spacer></v-spacer>
      <v-btn variant="text" color="indigo-darken-4" class="text-none font-weight-bold" prepend-icon="mdi-arrow-left" to="/admin/dashboard">
        Panel Admin
      </v-btn>
    </v-app-bar>

    <!-- Sidebar -->
    <v-navigation-drawer v-model="drawer" width="300" elevation="0" class="border-e">
      <div class="pa-6">
        <div class="text-subtitle-1 font-weight-black color-meridian mb-4">Capas y Recursos</div>
        <v-list density="comfortable" class="pa-0">
          <v-list-subheader class="font-weight-bold opacity-50 px-0">BASE MAPS</v-list-subheader>
          <v-list-item 
            prepend-icon="mdi-map" 
            title="Open Street Map" 
            :active="activeBaseMap === 'osm'" 
            rounded="lg" 
            color="indigo-darken-4" 
            class="mb-2"
            @click="setBaseMap('osm')"
          ></v-list-item>
          <v-list-item 
            prepend-icon="mdi-satellite-variant" 
            title="Satellite View (Esri)" 
            :active="activeBaseMap === 'satellite'" 
            rounded="lg" 
            color="indigo-darken-4" 
            class="mb-2"
            @click="setBaseMap('satellite')"
          ></v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>

    <!-- Área del Mapa -->
    <v-main class="pa-0 fill-height map-main">
      <div id="map" class="map-view"></div>

      <!-- Card Flotante de Coordenadas (Modo Edición) -->
      <v-expand-transition>
        <div v-if="activeTool === 'Point' || coordCardShow" class="coord-card-container">
          <v-card width="340" class="rounded-xl border-t-4 border-indigo-darken-4" elevation="12">
            <v-card-title class="pa-4 d-flex align-center">
              <v-icon icon="mdi-crosshairs-gps" color="indigo-darken-4" class="mr-2" size="small"></v-icon>
              <span class="text-button font-weight-black color-meridian flex-grow-1">Coordenadas Z16N</span>
              <v-btn icon="mdi-close" size="x-small" variant="tonal" color="grey" @click="closeCoordCard"></v-btn>
            </v-card-title>
            
            <v-divider></v-divider>

            <v-card-text class="pa-5">
              <div class="mb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                  <label class="text-caption font-weight-black text-grey-darken-1">COORDENADA E (X)</label>
                  <v-chip size="x-small" label color="indigo-lighten-4" class="text-indigo-darken-4 font-weight-bold">METROS</v-chip>
                </div>
                <v-text-field v-model="coordX" density="comfortable" variant="solo" flat bg-color="grey-lighten-4" hide-details rounded="lg"></v-text-field>
              </div>
              <div class="mb-6">
                <div class="d-flex justify-space-between align-center mb-1">
                  <label class="text-caption font-weight-black text-grey-darken-1">COORDENADA N (Y)</label>
                  <v-chip size="x-small" label color="indigo-lighten-4" class="text-indigo-darken-4 font-weight-bold">METROS</v-chip>
                </div>
                <v-text-field v-model="coordY" density="comfortable" variant="solo" flat bg-color="grey-lighten-4" hide-details rounded="lg"></v-text-field>
              </div>
              <v-btn block color="indigo-darken-4" class="text-none font-weight-black rounded-lg py-6" size="large" elevation="2" @click="goToCoords">
                Localizar en Mapa
              </v-btn>
            </v-card-text>
          </v-card>
        </div>
      </v-expand-transition>

      <!-- Botones Flotantes (Derecha) -->
      <div class="map-tools-container">
        <v-card class="rounded-xl pa-2 mb-2 d-flex flex-column ga-2" elevation="4">
          <v-tooltip text="Zoom In" location="left"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="mdi-plus" size="small" variant="text" color="indigo-darken-4" @click="handleZoom(1)"></v-btn></template></v-tooltip>
          <v-tooltip text="Zoom Out" location="left"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="mdi-minus" size="small" variant="text" color="indigo-darken-4" @click="handleZoom(-1)"></v-btn></template></v-tooltip>
        </v-card>

        <v-card class="rounded-xl pa-2 d-flex flex-column ga-2" elevation="4">
          <v-tooltip text="Ubicar Punto (WGS84 Z16N)" location="left">
            <template v-slot:activator="{ props }">
              <v-btn 
                v-bind="props" 
                icon="mdi-map-marker-plus" 
                size="small" 
                :variant="activeTool === 'Point' ? 'tonal' : 'text'" 
                :color="activeTool === 'Point' ? 'indigo-darken-4' : 'grey-darken-3'" 
                @click="toggleMeasure('Point')"
              ></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Medir Línea" location="left">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-ruler" size="small" :variant="activeTool === 'LineString' ? 'tonal' : 'text'" :color="activeTool === 'LineString' ? 'indigo-darken-4' : 'grey-darken-3'" @click="toggleMeasure('LineString')"></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Medir Área" location="left">
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-vector-square" size="small" :variant="activeTool === 'Polygon' ? 'tonal' : 'text'" :color="activeTool === 'Polygon' ? 'indigo-darken-4' : 'grey-darken-3'" @click="toggleMeasure('Polygon')"></v-btn>
            </template>
          </v-tooltip>

          <v-tooltip text="Limpiar" location="left"><template v-slot:activator="{ props }"><v-btn v-bind="props" icon="mdi-delete-outline" size="small" variant="text" color="error" @click="clearMeasurements"></v-btn></template></v-tooltip>
        </v-card>
      </div>
      
      <!-- Footer de Coordenadas -->
      <div class="map-footer bg-white border-t px-4 py-1 d-flex justify-space-between align-center text-caption font-weight-bold color-meridian">
        <span>EPSG:32616 | WGS 84 / UTM ZONE 16N</span>
        <div class="d-flex ga-4">
          <span v-if="utmPointer">E: {{ utmPointer[0].toFixed(2) }} | N: {{ utmPointer[1].toFixed(2) }}</span>
        </div>
      </div>
    </v-main>
  </v-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import 'ol/ol.css'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import { fromLonLat, toLonLat, transform } from 'ol/proj'
import { Vector as VectorLayer } from 'ol/layer'
import { Vector as VectorSource } from 'ol/source'
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style'
import Draw from 'ol/interaction/Draw'
import Overlay from 'ol/Overlay'
import { getArea, getLength } from 'ol/sphere'
import { unByKey } from 'ol/Observable'
import proj4 from 'proj4'
import { register } from 'ol/proj/proj4'

// Registro de UTM Zona 16N
proj4.defs("EPSG:32616", "+proj=utm +zone=16 +datum=WGS84 +units=m +no_defs");
register(proj4);

const drawer = ref(true)
const activeTool = ref(null)
const searchQuery = ref('')
const activeBaseMap = ref('osm')
const utmPointer = ref(null)

const coordCardShow = ref(false)
const coordX = ref('')
const coordY = ref('')

let mapInstance = null
let drawInteraction = null
let measureSource = new VectorSource()
let measureLayer = new VectorLayer({
  source: measureSource,
  style: [
    new Style({ stroke: new Stroke({ color: 'white', width: 6 }) }),
    new Style({
      fill: new Fill({ color: 'rgba(23, 48, 91, 0.25)' }),
      stroke: new Stroke({ color: '#17305b', width: 3 }),
      image: new CircleStyle({ 
        radius: 6, 
        stroke: new Stroke({ color: '#17305b', width: 2.5 }),
        fill: new Fill({ color: 'white' }) 
      })
    })
  ]
})

const osmLayer = new TileLayer({ source: new OSM(), visible: true })
const satelliteLayer = new TileLayer({ 
  source: new XYZ({ url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' }),
  visible: false
})

const overlays = []

onMounted(() => {
  mapInstance = new Map({
    target: 'map',
    layers: [osmLayer, satelliteLayer, measureLayer],
    view: new View({
      center: fromLonLat([-87.2068, 14.0723]),
      zoom: 12
    }),
    controls: []
  })

  mapInstance.on('pointermove', (evt) => {
    if (evt.dragging) return
    const utmCoord = transform(evt.coordinate, 'EPSG:3857', 'EPSG:32616')
    utmPointer.value = utmCoord
  })
})

const setBaseMap = (type) => {
  activeBaseMap.value = type
  osmLayer.setVisible(type === 'osm')
  satelliteLayer.setVisible(type === 'satellite')
}

const handleZoom = (delta) => {
  const view = mapInstance.getView()
  view.animate({ zoom: view.getZoom() + delta, duration: 250 })
}

const toggleMeasure = (type) => {
  if (activeTool.value === type) {
    stopMeasure()
  } else {
    startMeasure(type)
    if (type === 'Point') coordCardShow.value = true
  }
}

const handleSearch = () => {
  if (!searchQuery.value) return
  const parts = searchQuery.value.split(',').map(p => parseFloat(p.trim()))
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    // Si son coordenadas UTM (valores grandes) o Lat/Lon
    if (parts[0] > 1000) { // Asumimos UTM
      const lonlat = transform(parts, 'EPSG:32616', 'EPSG:3857')
      mapInstance.getView().animate({ center: lonlat, zoom: 16, duration: 800 })
    } else { // Asumimos Lat/Lon
      const lonlat = fromLonLat([parts[1], parts[0]])
      mapInstance.getView().animate({ center: lonlat, zoom: 16, duration: 800 })
    }
  }
}

const goToCoords = () => {
  const x = parseFloat(coordX.value)
  const y = parseFloat(coordY.value)
  if (!isNaN(x) && !isNaN(y)) {
    const coord3857 = transform([x, y], 'EPSG:32616', 'EPSG:3857')
    mapInstance.getView().animate({ center: coord3857, zoom: 16 })
  }
}

const startMeasure = (type) => {
  stopMeasure()
  activeTool.value = type
  mapInstance.getTargetElement().style.cursor = 'crosshair'
  
  drawInteraction = new Draw({
    source: measureSource,
    type: type,
    style: [
      new Style({ stroke: new Stroke({ color: 'white', width: 5 }) }),
      new Style({
        fill: new Fill({ color: 'rgba(23, 48, 91, 0.2)' }),
        stroke: new Stroke({ color: '#17305b', lineDash: [10, 10], width: 2.5 }),
        image: new CircleStyle({ radius: 6, stroke: new Stroke({ color: '#17305b', width: 2 }), fill: new Fill({ color: 'white' }) })
      })
    ]
  })
  mapInstance.addInteraction(drawInteraction)

  let tooltipObj, listener
  if (type !== 'Point') {
    tooltipObj = createMeasureTooltip()
  }

  drawInteraction.on('drawstart', (evt) => {
    const sketch = evt.feature
    if (type === 'Point') return

    listener = sketch.getGeometry().on('change', (ev) => {
      const geom = ev.target
      let output, coord
      if (geom.getType() === 'Polygon') {
        output = formatArea(geom); coord = geom.getInteriorPoint().getCoordinates()
      } else {
        output = formatLength(geom); coord = geom.getLastCoordinate()
      }
      tooltipObj.element.innerHTML = output
      tooltipObj.tooltip.setPosition(coord)
    })
  })

  drawInteraction.on('drawend', (evt) => {
    if (type === 'Point') {
      const utmCoord = transform(evt.feature.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:32616')
      coordX.value = utmCoord[0].toFixed(2)
      coordY.value = utmCoord[1].toFixed(2)
      coordCardShow.value = true
    } else {
      tooltipObj.element.className = 'ol-tooltip ol-tooltip-static'
      tooltipObj.tooltip.setOffset([0, -7])
      unByKey(listener)
    }
    stopMeasure()
  })
}

const stopMeasure = () => {
  if (drawInteraction) { mapInstance.removeInteraction(drawInteraction); drawInteraction = null }
  if (mapInstance) mapInstance.getTargetElement().style.cursor = ''
  activeTool.value = null
}

const closeCoordCard = () => { coordCardShow.value = false; stopMeasure() }

const clearMeasurements = () => {
  measureSource.clear(); overlays.forEach(o => mapInstance.removeOverlay(o)); overlays.length = 0; stopMeasure()
}

const createMeasureTooltip = () => {
  const element = document.createElement('div'); element.className = 'ol-tooltip ol-tooltip-measure'
  const tooltip = new Overlay({ element: element, offset: [0, -15], positioning: 'bottom-center', stopEvent: false })
  mapInstance.addOverlay(tooltip); overlays.push(tooltip)
  return { tooltip, element }
}

const formatLength = (line) => {
  const length = getLength(line)
  return length > 1000 ? (Math.round((length / 1000) * 100) / 100) + ' km' : (Math.round(length * 100) / 100) + ' m'
}

const formatArea = (polygon) => (Math.round(getArea(polygon) * 100) / 100) + ' m²'
</script>

<style scoped>
.geoportal-layout { height: 100vh; overflow: hidden; }
.map-main { position: relative; display: flex; flex-direction: column; }
.map-view { flex-grow: 1; width: 100%; }
.color-meridian { color: #17305b; }
.search-container-map { width: 100%; max-width: 400px; }
.map-tools-container { position: absolute; top: 100px; right: 20px; z-index: 1000; display: flex; flex-direction: column; }
.map-footer { height: 32px; z-index: 1000; opacity: 0.9; }

.coord-card-container {
  position: absolute;
  top: 100px;
  left: 320px; /* Al lado del sidebar */
  z-index: 1000;
}

:deep(.ol-tooltip) {
  position: relative; background: rgba(13, 33, 73, 0.9); border-radius: 4px; color: white; padding: 4px 10px; font-size: 11px; font-weight: 800; pointer-events: none;
}
:deep(.ol-tooltip-static) { background-color: #17305b; border: 1px solid white; }
.cursor-pointer { cursor: pointer; }
.ga-2 { gap: 8px; }
.ga-4 { gap: 16px; }
</style>
