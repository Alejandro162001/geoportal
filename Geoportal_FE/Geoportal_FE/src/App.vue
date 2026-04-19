<script setup>
import { ref } from 'vue'
import LoginView from './components/LoginView.vue'

const drawer = ref(true)
const isLoggedIn = ref(localStorage.getItem('user') !== null)
const activeView = ref('dashboard')

const logout = () => {
  localStorage.removeItem('user')
  isLoggedIn.value = false
}
</script>

<template>
  <v-app>
    <!-- Interfaz una vez logueado -->
    <template v-if="isLoggedIn">
      <!-- Barra Superior -->
      <v-app-bar color="primary" elevation="2">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-toolbar-title class="font-weight-bold">
          <v-icon icon="mdi-compass-outline" class="mr-2"></v-icon>
          GEOPORTAL PRECISION
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-logout" @click="logout"></v-btn>
      </v-app-bar>

      <!-- Menú Lateral -->
      <v-navigation-drawer v-model="drawer" elevation="1">
        <v-list density="compact" nav>
          <v-list-subheader>MODULOS</v-list-subheader>
          
          <v-list-item 
            prepend-icon="mdi-view-dashboard" 
            title="Dashboard" 
            value="dashboard"
            @click="activeView = 'dashboard'"
          ></v-list-item>
          
          <v-list-item 
            prepend-icon="mdi-account-group" 
            title="Usuarios" 
            value="users"
            @click="activeView = 'users'"
          ></v-list-item>

          <v-list-item 
            prepend-icon="mdi-layers-triple" 
            title="Capas GIS" 
            value="layers"
            @click="activeView = 'layers'"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <div class="pa-2">
            <v-chip color="info" block variant="flat" class="w-100 justify-center">
              v1.0.0-dev
            </v-chip>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- Contenido Principal -->
      <v-main class="bg-grey-lighten-4">
        <v-container fluid class="fill-height">
          <v-row justify="center" align="center">
            <v-col cols="12" md="8" class="text-center">
              <v-card class="pa-8 rounded-xl" elevation="4">
                <v-icon icon="mdi-check-circle" color="success" size="100" class="mb-4"></v-icon>
                <h2 class="text-h3 font-weight-bold mb-2">¡Bienvenido al Portal!</h2>
                <p class="text-h6 text-grey-darken-1">Has iniciado sesión correctamente. Los módulos de mapas y capas se integrarán pronto.</p>
                
                <v-btn color="primary" class="mt-6" variant="outlined" prepend-icon="mdi-plus">
                  Nueva Operación
                </v-btn>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </template>

    <!-- Vista de Login -->
    <LoginView v-else @login-success="isLoggedIn = true" />
  </v-app>
</template>

<style>
/* Reset global */
html, body, #app, .v-application {
  height: 100% !important;
  margin: 0;
  padding: 0;
}
</style>
