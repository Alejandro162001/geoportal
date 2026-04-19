<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const router = useRouter()
const route = useRoute()
const drawer = ref(true)

const navigationItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', path: '/admin/dashboard' },
  { title: 'Usuarios', icon: 'mdi-account-group-outline', path: '/admin/users' },
  { title: 'Capas', icon: 'mdi-layers-outline', path: '/admin/layers' },
  { title: 'Bitácora', icon: 'mdi-history', path: '/admin/activity' }
]

const logout = async () => {
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      // Avisar al backend para guardar el log de salida
      await api.post(import.meta.env.VITE_API_LOGOUT, { 
        nombreCompleto: user.nombreCompleto 
      })
    }
  } catch (error) {
    console.error('Error al registrar logout:', error)
  } finally {
    localStorage.removeItem('user')
    router.push('/login')
  }
}
</script>

<template>
  <v-layout class="meridian-app">
    <!-- Sidebar de Navegación -->
    <v-navigation-drawer 
      v-model="drawer" 
      class="border-e pa-0" 
      elevation="0"
      width="280"
    >
      <div class="pa-6 mb-4 d-flex justify-center">
        <img src="/Logo IP 2026 Horizontal.png" height="50" style="object-fit: contain" />
      </div>

      <div class="px-6 mb-6">
         <v-btn 
          block 
          color="#AE8200" 
          prepend-icon="mdi-map-search" 
          class="text-none font-weight-black rounded-lg py-6 text-white"
          size="large"
          to="/geoportal"
          elevation="4"
         >
           Visor Geográfico
         </v-btn>
      </div>

      <v-list density="comfortable" nav class="px-6 mb-8 mt-4">
        <v-list-item
          v-for="item in navigationItems"
          :key="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.path"
          rounded="lg"
          class="mb-2 menu-item"
          active-class="menu-item-active"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <v-list density="comfortable" nav class="px-6 mb-10">
          <v-list-item prepend-icon="mdi-help-circle-outline" title="Support" rounded="lg" class="menu-item"></v-list-item>
          <v-list-item 
            prepend-icon="mdi-logout" 
            title="Logout" 
            @click="logout"
            class="menu-item mt-2 logout-item"
            rounded="lg"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Barra Superior -->
    <v-app-bar elevation="0" border="b" class="px-4" height="72">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <div class="text-h5 font-weight-black color-meridian mr-6 ml-2">ADMINISTRACION</div>
      
      <v-spacer></v-spacer>
      
      <div class="search-container">
         <v-text-field
          placeholder="Buscar activos geoespaciales..."
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          hide-details
          density="compact"
          class="search-bar"
          bg-color="grey-lighten-4"
          rounded="lg"
        ></v-text-field>
      </div>

      <v-spacer></v-spacer>

      <v-btn icon="mdi-bell-outline" class="mr-2"></v-btn>
      <v-btn icon="mdi-cog-outline" class="mr-4"></v-btn>
      <v-avatar color="#F4F6F8" size="38" class="mr-2 border cursor-pointer">
         <v-icon color="#17305b" size="24">mdi-account</v-icon>
      </v-avatar>
    </v-app-bar>

    <!-- Contenido Principal -->
    <v-main class="main-content-scroll">
      <div class="scroll-container">
        <router-view />
      </div>
    </v-main>
  </v-layout>
</template>

<style scoped>
.main-content-scroll {
  height: calc(100vh - 72px);
  background-color: var(--meridian-bg);
}

.scroll-container {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.search-container {
  width: 100%;
  max-width: 500px;
}

.search-bar :deep(.v-field__input) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}

.menu-item {
  font-weight: 500 !important;
  color: #5F6368 !important;
}

.menu-item-active {
  background-color: var(--meridian-blue-light) !important;
  color: var(--meridian-blue-dark) !important;
  font-weight: 700 !important;
}

.logout-item {
  color: #FF5252 !important;
}

.lh-1 { line-height: 1.2 !important; }
.cursor-pointer { cursor: pointer; }
</style>
