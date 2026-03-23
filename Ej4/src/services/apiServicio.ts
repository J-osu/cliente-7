// src/services/apiServicio.ts
// ─────────────────────────────────────────────────────────────
// SERVICIO AXIOS CON INTERCEPTORES
//
// • Interceptor de petición  → inyecta el Bearer Token si el
//   usuario está autenticado.
// • Interceptor de respuesta → captura 401/403, muestra Toast
//   y borra la sesión de Pinia.
// ─────────────────────────────────────────────────────────────
import axios from 'axios'
import { useSesionStore } from '../stores/sesion'
import { useToast } from 'vue-toast-notification'
 
// Instancia de Axios configurada para la API de GitHub
export const instanciaAxios = axios.create({
  baseURL: 'https://api.github.com',
  headers: {
    Accept: 'application/vnd.github+json',
  },
})
 
// ── Interceptor de PETICIÓN ───────────────────────────────────
// Si hay token en el store, lo inyecta en todas las peticiones.
instanciaAxios.interceptors.request.use(
  (configuracion) => {
    const sesion = useSesionStore()
    if (sesion.token) {
      configuracion.headers['Authorization'] = `Bearer ${sesion.token}`
    }
    return configuracion
  },
  (error) => Promise.reject(error),
)
 
// ── Interceptor de RESPUESTA ──────────────────────────────────
// Maneja globalmente errores 401 y 403.
instanciaAxios.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const codigoEstado = error.response?.status
    const sesion       = useSesionStore()
    const toast        = useToast()
 
    if (codigoEstado === 401 || codigoEstado === 403) {
      sesion.borrarSesion()
      toast.error(
        codigoEstado === 401
          ? 'Sesión expirada. Por favor, vuelve a iniciar sesión.'
          : 'Acceso denegado (403). Tu sesión ha sido cerrada.',
        { duration: 5000, position: 'top-right' },
      )
    } else {
      toast.error(
        `Error del servidor (${codigoEstado ?? 'desconocido'}). Inténtalo más tarde.`,
        { duration: 4000, position: 'top-right' },
      )
    }
 
    return Promise.reject(error)
  },
)
 
// ── Funciones de la API ───────────────────────────────────────
export async function obtenerPerfil() {
  const respuesta = await instanciaAxios.get('/user')
  return respuesta.data
}