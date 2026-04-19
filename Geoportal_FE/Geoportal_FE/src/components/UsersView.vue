<template>
  <v-container fluid class="bg-grey-lighten-4 pa-8">
    <div class="mb-8">
      <div class="d-flex justify-space-between align-end">
        <div>
          <h1 class="text-h3 font-weight-black color-meridian mb-2">Gestión de Usuarios</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Control acceso y roles.</p>
        </div>
        <v-btn 
          color="indigo-darken-4" 
          prepend-icon="mdi-account-plus" 
          class="text-none font-weight-bold rounded-lg px-6" 
          size="large"
          @click="userDialog = true"
        >
          Add User
        </v-btn>
      </div>
    </div>

    <!-- Modal para Añadir/Editar Usuario -->
    <v-dialog v-model="userDialog" max-width="600" persistent transition="dialog-bottom-transition">
      <v-card class="rounded-xl pa-2" elevation="12">
        <v-card-title class="pa-6 d-flex align-center">
          <v-avatar :color="isEditing ? 'amber-darken-3' : 'indigo-darken-4'" size="40" class="mr-4">
            <v-icon :icon="isEditing ? 'mdi-account-edit' : 'mdi-account-plus'" color="white"></v-icon>
          </v-avatar>
          <div>
            <div class="text-h5 font-weight-black color-meridian">{{ isEditing ? 'Editar Usuario' : 'Registrar Usuario' }}</div>
            <div class="text-caption font-weight-bold text-grey">Access Management Control</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="grey" @click="closeUserDialog"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-8">
          <v-form ref="userForm" v-model="formValid" @submit.prevent="saveUser">
            <v-row>
              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Nombre Completo</label>
                <v-text-field
                  v-model="userData.nombreCompleto"
                  placeholder="ej: Alejandro Mendoza"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  :rules="[v => !!v || 'Campo requerido']"
                  hide-details="auto"
                  class="mb-4"
                  :disabled="isEditing"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Correo Electrónico</label>
                <v-text-field
                  v-model="userData.correo"
                  placeholder="ej: a.mendoza@meridiandeep.io"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  type="email"
                  :rules="[v => !!v || 'Campo requerido', v => /.+@.+\..+/.test(v) || 'Correo inválido']"
                  hide-details="auto"
                  class="mb-4"
                  :disabled="isEditing"
                ></v-text-field>
              </v-col>

              <v-col cols="12" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Dirección / Ubicación</label>
                <v-text-field
                  v-model="userData.direccion"
                  placeholder="ej: Tegucigalpa, Honduras"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  hide-details="auto"
                  class="mb-4"
                  :disabled="isEditing"
                ></v-text-field>
              </v-col>

              <v-col cols="6" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">{{ isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña' }}</label>
                <v-text-field
                  v-model="userData.contrasena"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  type="password"
                  :rules="isEditing ? [] : [v => !!v || 'Requerido']"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <v-col cols="6" class="pb-2">
                <label class="text-caption font-weight-black color-meridian mb-1 d-block text-uppercase">Rol de Acceso</label>
                <v-select
                  v-model="userData.rol"
                  :items="['ADMIN', 'EDITOR', 'VIEWER']"
                  variant="solo"
                  flat
                  bg-color="grey-lighten-4"
                  rounded="lg"
                  placeholder="Selecciona el rol"
                  :rules="[v => !!v || 'Requerido']"
                  hide-details="auto"
                ></v-select>
              </v-col>

              <v-col cols="12" v-if="isEditing" class="pt-0">
                <div class="d-flex align-center bg-grey-lighten-4 pa-4 rounded-lg">
                  <v-icon :icon="userData.activo ? 'mdi-account-check' : 'mdi-account-off'" :color="userData.activo ? 'green' : 'red'" class="mr-3"></v-icon>
                  <div>
                    <div class="text-caption font-weight-black color-meridian text-uppercase">Estado de la Cuenta</div>
                    <div class="text-caption font-weight-bold" :class="userData.activo ? 'text-green' : 'text-red'">
                      El usuario está actualmente <b>{{ userData.activo ? 'ACTIVO' : 'INACTIVO' }}</b>
                    </div>
                  </div>
                  <v-spacer></v-spacer>
                  <v-switch
                    v-model="userData.activo"
                    color="green"
                    hide-details
                    inset
                  ></v-switch>
                </div>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" class="text-none font-weight-black" color="grey" @click="closeUserDialog">Cancelar</v-btn>
          <v-btn 
            :color="isEditing ? 'amber-darken-3' : 'indigo-darken-4'" 
            class="text-none font-weight-black rounded-lg px-8" 
            size="large"
            :loading="loading"
            :disabled="!formValid"
            @click="saveUser"
          >
            {{ isEditing ? 'Guardar Cambios' : 'Registrar Usuario' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de Confirmación para eliminar -->
    <v-dialog v-model="confirmDelete.show" max-width="400">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h6 font-weight-black color-meridian d-flex align-center">
          <v-icon icon="mdi-alert-circle" color="red" class="mr-2"></v-icon>
          ¿Eliminar Usuario?
        </v-card-title>
        <v-card-text class="text-body-2 text-grey-darken-1">
          Esta acción ocultará al usuario <b>{{ confirmDelete.userName }}</b> del sistema mediante un borrado lógico. Podrá ser restaurado por un administrador DB si es necesario.
        </v-card-text>
        <v-card-actions class="pt-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" class="text-none font-weight-bold" @click="confirmDelete.show = false">Cancelar</v-btn>
          <v-btn color="red-darken-1" variant="flat" class="text-none font-weight-bold rounded-lg px-6" :loading="loading" @click="deleteUser">Eliminar</v-btn>
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

    <!-- Cards de Resumen -->
    <v-row class="mb-8">
      <v-col cols="12" sm="6" md="3" v-for="(stat, i) in stats" :key="i">
        <v-card class="rounded-xl border-0 border-s-4" :style="{ borderColor: stat.color }" elevation="0">
          <v-card-text class="pa-6">
            <div class="text-caption text-grey-darken-1 font-weight-black mb-1 opacity-70 text-uppercase">{{ stat.title }}</div>
            <div class="d-flex align-center justify-space-between mt-2">
              <div class="text-h3 font-weight-black color-meridian">{{ stat.value }}</div>
              <v-icon v-if="stat.icon" :icon="stat.icon" color="grey-lighten-2" size="40"></v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabla de Usuarios -->
    <v-card class="rounded-xl border-0 overflow-hidden" elevation="0">
      <v-progress-linear v-if="tableLoading" indeterminate color="indigo-darken-4"></v-progress-linear>
      <v-table class="meridian-table px-4">
        <thead>
          <tr class="bg-grey-lighten-5 text-grey-darken-1">
            <th class="text-left font-weight-bold opacity-70">NAME</th>
            <th class="text-left font-weight-bold opacity-70">EMAIL</th>
            <th class="text-center font-weight-bold opacity-70">ROLE</th>
            <th class="text-center font-weight-bold opacity-70">STATUS</th>
            <th class="text-right font-weight-bold opacity-70 pe-10">ACTIONS</th>
          </tr>
        </thead>
        <tbody class="color-meridian">
          <tr v-for="user in users" :key="user.id">
            <td class="py-4">
              <div class="d-flex align-center">
                <v-avatar :color="user.avatarColor + '-lighten-4'" rounded="lg" size="36" class="mr-3">
                  <span class="text-caption font-weight-black" :class="'text-' + user.avatarColor + '-darken-4'">{{ user.initials }}</span>
                </v-avatar>
                <span class="font-weight-bold">{{ user.name }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td class="text-center">
              <v-chip size="x-small" label class="font-weight-black rounded-sm px-4" 
                      :color="user.roleColor + '-lighten-4'" 
                      :text-color="user.roleColor + '-darken-4'">
                {{ user.role }}
              </v-chip>
            </td>
            <td class="text-center">
              <div class="d-flex align-center justify-center ga-2">
                <div :class="'bg-' + (user.status === 'Active' ? 'amber-darken-2' : 'grey-lighten-1')" 
                     style="width: 8px; height: 8px; border-radius: 50%;"></div>
                <span class="text-caption font-weight-bold" :class="user.status === 'Active' ? 'text-amber-darken-2' : 'text-grey'">{{ user.status }}</span>
              </div>
            </td>
            <td class="text-right pe-4">
               <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="grey-darken-1" @click="openEditDialog(user)"></v-btn>
               <v-btn icon="mdi-history" variant="text" size="small" color="grey-darken-1"></v-btn>
               <v-btn icon="mdi-trash-can-outline" variant="text" size="small" color="grey-darken-1" @click="triggerDelete(user)"></v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
      
      <!-- Footer de Tabla / Paginación -->
      <div class="pa-6 border-t d-flex justify-space-between align-center">
        <span class="text-caption text-grey-darken-1 font-weight-bold">Showing 1 to 4 of 1,284 users</span>
        <v-pagination :length="128" density="compact" total-visible="4" color="indigo-darken-4" active-color="indigo-darken-4"></v-pagination>
      </div>
    </v-card>

    <!-- Fila Inferior con Módulos Especiales -->
    <v-row class="mt-8 ga-4">
      <v-col cols="12" md="6">
        <v-card class="rounded-xl border-0 bg-white" elevation="0">
          <v-row no-gutters>
            <v-col cols="auto" class="pa-8 d-flex align-center br-indigo">
              <v-avatar color="indigo-darken-4" rounded="lg" size="56" elevation="2">
                <v-icon icon="mdi-shield-lock" color="white" size="32"></v-icon>
              </v-avatar>
            </v-col>
            <v-col class="pa-8 ps-0">
               <div class="text-h6 font-weight-black color-meridian mb-2">Security Audit Logs</div>
               <p class="text-caption text-grey-darken-1 font-weight-medium line-height-relaxed mb-4">
                 Review comprehensive logs for all permission changes and authentication attempts within the geospatial platform.
               </p>
               <v-btn variant="text" class="text-none font-weight-black px-0" color="indigo-darken-4" append-icon="mdi-arrow-right">VIEW AUDIT TRAIL</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="rounded-xl border-0 bg-white" elevation="0">
          <v-row no-gutters>
            <v-col cols="auto" class="pa-8 d-flex align-center br-amber">
              <v-avatar color="amber-darken-4" rounded="lg" size="56" elevation="2">
                <v-icon icon="mdi-hub-outline" color="white" size="32"></v-icon>
              </v-avatar>
            </v-col>
            <v-col class="pa-8 ps-0">
               <div class="text-h6 font-weight-black color-meridian mb-2">Organizational Hierarchy</div>
               <p class="text-caption text-grey-darken-1 font-weight-medium line-height-relaxed mb-4">
                 Structure users by department or regional branch to streamline large-scale geospatial data distribution and access.
               </p>
               <v-btn variant="text" class="text-none font-weight-black px-0" color="amber-darken-4" append-icon="mdi-arrow-right">MANAGE TEAMS</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import api from '../api'

const stats = reactive([
  { title: 'Total Active', value: '0', color: '#0D2149' },
  { title: 'Admin Roles', value: '0', color: '#D49B35' },
  { title: 'Editors', value: '0', color: '#1A3673' },
  { title: 'Avg Security Score', value: '98%', color: '#E0E0E0', icon: 'mdi-shield-check-outline' }
])

const users = ref([])
const tableLoading = ref(false)

// Lógica de Diálogo
const userDialog = ref(false)
const isEditing = ref(false)
const formValid = ref(false)
const loading = ref(false)
const userForm = ref(null)

const userData = reactive({
  id: null,
  nombreCompleto: '',
  direccion: '',
  correo: '',
  contrasena: '',
  rol: 'VIEWER',
  activo: true
})

const confirmDelete = reactive({
  show: false,
  userId: null,
  userName: ''
})

const feedback = reactive({
  show: false,
  text: '',
  color: 'success'
})

const openEditDialog = (user) => {
  isEditing.value = true
  userData.id = user.id
  userData.nombreCompleto = user.name
  userData.direccion = user.direccion || ''
  userData.correo = user.email
  userData.rol = user.role
  userData.activo = user.status === 'Active'
  userData.contrasena = '' // No mostramos la contraseña actual
  userDialog.value = true
}

const triggerDelete = (user) => {
  confirmDelete.userId = user.id
  confirmDelete.userName = user.name
  confirmDelete.show = true
}

const closeUserDialog = () => {
  userDialog.value = false
  isEditing.value = false
  userData.id = null
  userData.nombreCompleto = ''
  userData.direccion = ''
  userData.correo = ''
  userData.contrasena = ''
  userData.rol = 'VIEWER'
  userData.activo = true
  if (userForm.value) userForm.value.resetValidation()
}

const fetchUsers = async () => {
  tableLoading.value = true
  try {
    // Usar la variable de entorno para el endpoint de usuarios
    const response = await api.get(import.meta.env.VITE_API_USERS)
    
    users.value = response.data.map(u => ({
      id: u.id,
      name: u.nombreCompleto,
      direccion: u.direccion,
      initials: u.nombreCompleto.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
      avatarColor: u.rol === 'ADMIN' ? 'indigo' : (u.rol === 'EDITOR' ? 'amber' : 'grey'),
      email: u.correo,
      role: u.rol,
      roleColor: u.rol === 'ADMIN' ? 'indigo' : (u.rol === 'EDITOR' ? 'amber' : 'grey'),
      status: u.activo ? 'Active' : 'Inactive'
    }))

    // Actualizar stats básicos
    stats[0].value = users.value.length.toString()
    stats[1].value = users.value.filter(u => u.role === 'ADMIN').length.toString()
    stats[2].value = users.value.filter(u => u.role === 'EDITOR').length.toString()
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
  } finally {
    tableLoading.value = false
  }
}

const saveUser = async () => {
  if (!formValid.value) return

  loading.value = true
  try {
    const endpoint = import.meta.env.VITE_API_USERS
    
    if (isEditing.value) {
      // Logic for PATCH (Update)
      const updatePayload = { ...userData }
      if (!updatePayload.contrasena) delete updatePayload.contrasena // Don't send empty password
      
      await api.patch(`${endpoint}/${userData.id}`, updatePayload)
      feedback.text = '¡Usuario actualizado correctamente!'
    } else {
      // Logic for POST (Create)
      await api.post(endpoint, userData)
      feedback.text = '¡Usuario registrado exitosamente!'
    }

    feedback.color = 'success'
    feedback.show = true
    
    closeUserDialog()
    fetchUsers()
  } catch (error) {
    console.error('Error al guardar usuario:', error)
    feedback.text = error.response?.data?.error || error.response?.data?.message || 'Error al procesar la solicitud'
    feedback.color = 'error'
    feedback.show = true
  } finally {
    loading.value = false
  }
}

const deleteUser = async () => {
  if (!confirmDelete.userId) return
  
  loading.value = true
  try {
    const endpoint = import.meta.env.VITE_API_USERS
    await api.delete(`${endpoint}/${confirmDelete.userId}`)
    
    feedback.text = `Usuario ${confirmDelete.userName} eliminado.`
    feedback.color = 'success'
    feedback.show = true
    
    confirmDelete.show = false
    fetchUsers()
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    feedback.text = 'Error al eliminar el usuario'
    feedback.color = 'error'
    feedback.show = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.color-meridian { color: #0D2149; }
.meridian-table th {
  height: 56px !important;
  font-size: 11px !important;
  letter-spacing: 0.5px;
}
.meridian-table td {
  height: 64px !important;
  font-size: 14px;
}
.line-height-relaxed { line-height: 1.6; }
.br-indigo { border-right: 0px solid #E0E0E0; position: relative; }
/* Secciones de color en el lado izquierdo de los módulos inferiores */
.br-indigo::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 40%; background: #F8F9FF; z-index: 0; border-radius: 24px 0 0 24px; }
.br-amber::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 40%; background: #FFF9F0; z-index: 0; border-radius: 24px 0 0 24px; }
.v-avatar { z-index: 1; }
</style>
