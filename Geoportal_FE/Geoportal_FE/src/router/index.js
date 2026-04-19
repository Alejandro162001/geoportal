import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../components/DashboardView.vue'
import UsersView from '../components/UsersView.vue'
import LayersView from '../components/LayersView.vue'
import ActivityLogView from '../components/ActivityLogView.vue'
import GeoportalView from '../components/GeoportalView.vue'
import LoginView from '../components/LoginView.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true }
  },
  {
    path: '/',
    redirect: '/admin/dashboard'
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      { path: '', redirect: { name: 'Dashboard' } },
      { path: 'dashboard', name: 'Dashboard', component: DashboardView },
      { path: 'users', name: 'Users', component: UsersView },
      { path: 'layers', name: 'Layers', component: LayersView },
      { path: 'activity', name: 'Activity', component: ActivityLogView },
    ]
  },
  {
    path: '/geoportal',
    name: 'Geoportal',
    component: GeoportalView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach((to, from, next) => {
  const isLoggedIn = localStorage.getItem('user') !== null
  
  if (!to.meta.public && !isLoggedIn) {
    next('/login')
  } else if (to.name === 'Login' && isLoggedIn) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
