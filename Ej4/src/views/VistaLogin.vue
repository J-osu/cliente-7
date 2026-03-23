<!-- src/views/VistaLogin.vue -->
<!-- Pantalla de inicio de sesión con botones OAuth -->
<template>
  <div class="login-contenedor">
    <h1>GitHub DevHub</h1>
    <p>Panel privado. Inicia sesión para continuar.</p>
 
    <div class="botones">
      <button @click="iniciarConGitHub" :disabled="cargando" class="btn-github">
        {{ cargando ? 'Conectando...' : '🐙 Iniciar sesión con GitHub' }}
      </button>
 
      <button @click="iniciarConGoogle" :disabled="cargando" class="btn-google">
        {{ cargando ? 'Conectando...' : '🔵 Iniciar sesión con Google' }}
      </button>
    </div>
 
    <p v-if="errorMensaje" class="error">{{ errorMensaje }}</p>
  </div>
</template>
 
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithPopup, OAuthProvider } from 'firebase/auth'
import { autenticacion, proveedorGitHub, proveedorGoogle } from '../firebase'
import { useSesionStore } from '../stores/sesion'
 
const enrutador    = useRouter()
const sesion       = useSesionStore()
const cargando     = ref(false)
const errorMensaje = ref('')
 
async function iniciarConGitHub() {
  cargando.value     = true
  errorMensaje.value = ''
  try {
    const resultado = await signInWithPopup(autenticacion, proveedorGitHub)
    // Extraer el Bearer Token de GitHub desde el credential
    const credencial = OAuthProvider.credentialFromResult(resultado) as any
    const tokenAcceso = credencial?.accessToken ?? resultado.user.uid
 
    sesion.guardarSesion(
      tokenAcceso,
      resultado.user.displayName ?? 'Usuario',
      resultado.user.email ?? '',
      resultado.user.photoURL ?? '',
    )
    enrutador.push('/panel')
  } catch (e: any) {
    errorMensaje.value = `Error al iniciar sesión: ${e.message}`
  } finally {
    cargando.value = false
  }
}
 
async function iniciarConGoogle() {
  cargando.value     = true
  errorMensaje.value = ''
  try {
    const resultado = await signInWithPopup(autenticacion, proveedorGoogle)
    // Google no devuelve un Bearer Token de API, usamos el idToken
    const tokenAcceso = await resultado.user.getIdToken()
 
    sesion.guardarSesion(
      tokenAcceso,
      resultado.user.displayName ?? 'Usuario',
      resultado.user.email ?? '',
      resultado.user.photoURL ?? '',
    )
    enrutador.push('/panel')
  } catch (e: any) {
    errorMensaje.value = `Error al iniciar sesión: ${e.message}`
  } finally {
    cargando.value = false
  }
}
</script>
 
<style scoped>
.login-contenedor {
  max-width: 400px;
  margin: 100px auto;
  padding: 24px;
  border: 1px solid #ccc;
  text-align: center;
}
.botones {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}
button {
  padding: 10px 16px;
  font-size: 15px;
  cursor: pointer;
  border: 1px solid #999;
  background: #f5f5f5;
}
button:hover:not(:disabled) { background: #e0e0e0; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.error { color: red; margin-top: 12px; }
</style>