<template>
  <div class="login-page">
    <!-- Header Logo -->
    <div class="header-logo pa-6">
      <div class="d-flex align-center text-white">
        <v-icon icon="mdi-compass-outline" size="32" class="mr-2"></v-icon>
        <span class="text-h5 font-weight-bold">GeoPortal Precision</span>
      </div>
    </div>

    <!-- Contenedor del Login con Centrado Absoluto -->
    <div class="login-wrapper">
      <v-card width="450" class="login-card rounded-lg pa-4" elevation="12">
        <v-card-text>
          <div class="text-center mb-6">
            <v-avatar color="primary" size="64" class="mb-4">
              <v-icon icon="mdi-compass" size="36" color="white"></v-icon>
            </v-avatar>
            <h1 class="text-h4 font-weight-bold color-deep-blue">GeoPortal Precision</h1>
            
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4 text-caption"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>
          </div>

          <v-form @submit.prevent="handleLogin">
            <div class="mb-4">
              <label class="text-caption font-weight-bold text-grey-darken-2 text-uppercase ml-1">Correo Institucional</label>
              <v-text-field
                v-model="email"
                placeholder="nombre.apellido@geoportal.gov"
                persistent-placeholder
                variant="solo-filled"
                flat
                bg-color="grey-lighten-4"
                density="comfortable"
                class="mt-1"
                prepend-inner-icon="mdi-email-outline"
              ></v-text-field>
            </div>

            <div class="mb-2">
              <label class="text-caption font-weight-bold text-grey-darken-2 text-uppercase ml-1">Clave de Acceso</label>
              <v-text-field
                v-model="password"
                type="password"
                placeholder="••••••••••••"
                persistent-placeholder
                variant="solo-filled"
                flat
                bg-color="grey-lighten-4"
                density="comfortable"
                class="mt-1"
                prepend-inner-icon="mdi-lock-outline"
              ></v-text-field>
            </div>

            <div class="d-flex align-center justify-space-between mb-4">
              <v-checkbox
                v-model="remember"
                label="Recordarme"
                hide-details
                density="compact"
                color="primary"
              ></v-checkbox>
              <a href="#" class="text-caption font-weight-bold text-primary text-decoration-none">¿Olvidó su clave?</a>
            </div>

            <v-btn
              block
              color="primary"
              size="x-large"
              type="submit"
              class="text-none font-weight-bold rounded-lg mb-6"
              :loading="loading"
            >
              Ingresar al Portal
              <v-icon icon="mdi-arrow-right" class="ml-2"></v-icon>
            </v-btn>
          </v-form>

          <v-divider class="mb-6"></v-divider>

          <div class="d-flex justify-center ga-2">
            <v-chip size="small" variant="tonal" class="rounded-pill px-4" color="info">
              TERMINAL SEGURO
            </v-chip>
            <v-chip size="small" variant="tonal" class="rounded-pill px-4" color="grey">
              AES-256 ENABLED
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Footer -->
    <div class="footer pa-4">
      <div class="d-flex justify-center ga-4 text-white text-caption text-uppercase mb-2">
        <a href="#" class="text-white text-decoration-none">Protocolos de Seguridad</a>
        <a href="#" class="text-white text-decoration-none">Soporte Técnico</a>
        <a href="#" class="text-white text-decoration-none">Arquitectura de Red</a>
      </div>
      <div class="text-center text-white text-caption opacity-60">
        © 2024 GEOPORTAL PRECISION. GEOSPATIAL INTELLIGENCE DIVISION.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const email = ref('')
const password = ref('')
const remember = ref(false)
const loading = ref(false)

const emit = defineEmits(['login-success'])

const errorMessage = ref('')
const apiUrl = import.meta.env.VITE_API_URL

const handleLogin = async () => {
    if (!apiUrl) {
        console.error('ERROR: VITE_API_URL no está definida en el archivo .env')
        errorMessage.value = 'Configuración del servidor incompleta.'
        return
    }
    if (!email.value || !password.value) {
        errorMessage.value = 'Por favor, completa todos los campos.'
        return
    }

    loading.value = true
    errorMessage.value = ''

    try {
        const response = await axios.post(`${apiUrl}${import.meta.env.VITE_API_LOGIN}`, {
            correo: email.value,
            contrasena: password.value
        })

        loading.value = false
        // Guardamos el usuario en localStorage si es necesario
        localStorage.setItem('user', JSON.stringify(response.data))
        emit('login-success')
    } catch (error) {
        loading.value = false
        console.error('Error en login:', error)
        errorMessage.value = error.response?.data?.error || 'Error al conectar con el servidor. Verifica tus credenciales.'
    }
}
</script>

<style scoped>
.login-page {
  background: linear-gradient(rgba(26, 54, 115, 0.4), rgba(26, 54, 115, 0.6)), url('/tegucigalpa-hd.png');
  background-size: cover;
  background-position: center;
  height: 100vh;
  width: 100vw;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

.header-logo {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

/* MÉTODO INFALIBLE DE CENTRADO ABSOLUTO */
.login-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 5;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}

.color-deep-blue {
  color: #1A3673;
}

.footer {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 10;
}

.opacity-60 { opacity: 0.6; }
.ga-2 { gap: 8px; }
.ga-4 { gap: 16px; }

:deep(.v-field__input) {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
