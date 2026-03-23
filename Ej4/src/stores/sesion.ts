// src/stores/sesion.ts
// ─────────────────────────────────────────────────────────────
// STORE DE SESIÓN (Pinia)
// Almacena el token Bearer y los datos básicos del usuario.
// ─────────────────────────────────────────────────────────────
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
 
export const useSesionStore = defineStore('sesion', () => {
  // ── Estado ────────────────────────────────────────────────
  const token        = ref<string | null>(null)
  const nombreUsuario = ref<string | null>(null)
  const emailUsuario  = ref<string | null>(null)
  const fotoUsuario   = ref<string | null>(null)
 
  // ── Getters ───────────────────────────────────────────────
  const estaAutenticado = computed(() => token.value !== null)
 
  // ── Acciones ──────────────────────────────────────────────
  function guardarSesion(nuevoToken: string, nombre: string, email: string, foto: string) {
    token.value        = nuevoToken
    nombreUsuario.value = nombre
    emailUsuario.value  = email
    fotoUsuario.value   = foto
  }
 
  function borrarSesion() {
    token.value        = null
    nombreUsuario.value = null
    emailUsuario.value  = null
    fotoUsuario.value   = null
  }
 
  return {
    token,
    nombreUsuario,
    emailUsuario,
    fotoUsuario,
    estaAutenticado,
    guardarSesion,
    borrarSesion,
  }
})