import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSesionStore } from '../stores/sesion'

// Definimos el tipo explícitamente para evitar el error ts(2322)
const rutas: RouteRecordRaw[] = [
  {
    path: '/',
    // Cambiamos el nombre de la propiedad para que TS esté feliz
    redirect: { name: 'login' }, 
  },
  {
    path: '/login',
    name: 'login', // Es buena práctica poner nombres a las rutas
    component: () => import('../views/VistaLogin.vue'),
  },
  {
    path: '/panel',
    name: 'panel',
    component: () => import('../views/VistaPanel.vue'),
    meta: { requiereAuth: true },
  },
]

export const enrutador = createRouter({
  history: createWebHistory(),
  routes: rutas,
})

// Guardia de navegación
enrutador.beforeEach((to) => {
  const sesion = useSesionStore()
  
  // Si la ruta requiere auth y no hay sesión, al login
  if (to.meta.requiereAuth && !sesion.estaAutenticado) {
    return { name: 'login' }
  }
  
  // Si ya está logueado y trata de ir al login, mándalo al panel
  if (to.path === '/login' && sesion.estaAutenticado) {
    return { name: 'panel' }
  }
})