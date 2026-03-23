<!-- src/views/VistaPanel.vue -->
<!-- Panel principal protegido por autenticación -->
<template>
  <div class="panel-contenedor">
    <header>
      <h1>Panel — GitHub DevHub</h1>
      <button @click="cerrarSesion" class="btn-salir">Cerrar sesión</button>
    </header>

    <section class="perfil">
      <img v-if="sesion.fotoUsuario" :src="sesion.fotoUsuario" alt="Avatar" class="avatar" />
      <div>
        <strong>{{ sesion.nombreUsuario }}</strong>
        <br />
        <small>{{ sesion.emailUsuario }}</small>
      </div>
    </section>

    <hr />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { autenticacion } from '../firebase'
import { useSesionStore } from '../stores/sesion'

const sesion        = useSesionStore()
const enrutador     = useRouter()

async function cerrarSesion() {
  await signOut(autenticacion)
  sesion.borrarSesion()
  enrutador.push('/login')
}
</script>

<style scoped>
.panel-contenedor {
  max-width: 700px;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #ccc;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.perfil {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #ccc;
}
.lista-repos {
  margin-top: 12px;
  padding-left: 20px;
}
.lista-repos li { margin-bottom: 6px; }
button {
  padding: 8px 14px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #999;
  background: #f5f5f5;
}
button:hover:not(:disabled) { background: #e0e0e0; }
button:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-salir { background: #fdd; border-color: #f99; }
.error { color: red; margin-top: 8px; }
</style>