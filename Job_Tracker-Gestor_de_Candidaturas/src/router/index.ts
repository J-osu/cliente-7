import { createRouter, createWebHistory } from 'vue-router'
// Cambiamos el nombre del import para que sea coherente
import JobsView from '../views/JobsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'jobs', // El nombre de la ruta ahora es más descriptivo
      component: JobsView,
    },
    // La ruta 'about' la puedes borrar si no la vas a usar, 
    // así el menú de navegación queda más limpio.
  ],
})

export default router
