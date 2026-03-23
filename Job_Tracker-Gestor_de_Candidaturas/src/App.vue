<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useJobStore } from './stores/jobStore';

const store = useJobStore();

// Referencias reactivas
const nuevaEmpresa = ref('');
const nuevoPuesto = ref('');
const nuevaUbicacion = ref('');
const nuevaDescripcion = ref('');

// Cargando inicial
onMounted(async () => {
  await store.fetchJobs();
});

// Computed para bloquear el botón si falta info básica
const formularioInvalido = computed(() => {
  return !nuevaEmpresa.value || !nuevoPuesto.value || store.loading;
});

const handleSubmit = async () => {
  if (formularioInvalido.value) return;

  // Creamos el objeto basado en la estructura de Job.ts actualizada
  await store.addJob({
    company: nuevaEmpresa.value,
    title: nuevoPuesto.value,
    location: nuevaUbicacion.value || 'No especificada',
    description: nuevaDescripcion.value || 'Sin descripción',
    status: 'CV Enviado'
  });
  
  // Limpieza de campos
  nuevaEmpresa.value = '';
  nuevoPuesto.value = '';
  nuevaUbicacion.value = '';
  nuevaDescripcion.value = '';
};
</script>

<template>
  <div class="container">
    <h1>💼 Job Tracker - Josu Edition</h1>
    
    <form @submit.prevent="handleSubmit" class="job-form">
      <div class="form-row">
        <input v-model="nuevaEmpresa" placeholder="Empresa" :disabled="store.loading" />
        <input v-model="nuevoPuesto" placeholder="Puesto" :disabled="store.loading" />
      </div>
      <input v-model="nuevaUbicacion" placeholder="Ubicación (ej: Remote)" :disabled="store.loading" />
      <textarea v-model="nuevaDescripcion" placeholder="Descripción..." :disabled="store.loading"></textarea>
      
      <button type="submit" :disabled="formularioInvalido" :class="{ 'btn-loading': store.loading }">
        {{ store.loading ? '⏳ Procesando...' : '➕ Añadir Candidatura' }}
      </button>
    </form>

    <div v-if="store.loading && store.jobs.length === 0" class="status-msg">
      🛰️ Conectando con el servidor...
    </div>
    
    <ul v-else-if="store.jobs.length > 0">
      <li v-for="job in store.jobs" :key="job.id" class="job-card">
        <div class="job-info">
          <strong>{{ job.company }}</strong> — {{ job.title }}
          <div class="job-meta">
            <small>📍 {{ job.location }}</small> | <span class="badge">{{ job.status }}</span>
          </div>
        </div>
        
        <div class="actions">
          <button @click="store.updateStatus(job.id!, 'Entrevista Técnica')" :disabled="store.loading">🎯</button>
          <button @click="store.deleteJob(job.id!)" class="btn-delete" :disabled="store.loading">🗑️</button>
        </div>
      </li>
    </ul>

    <div v-else class="status-msg">No hay vacantes todavía. ¡A por ellas!</div>
  </div>
</template>

<style scoped>
.container { max-width: 600px; margin: 2rem auto; font-family: system-ui, sans-serif; }
.job-form { display: flex; flex-direction: column; gap: 0.8rem; background: #f4f4f9; padding: 1.5rem; border-radius: 10px; }
.form-row { display: flex; gap: 0.5rem; }
input, textarea { padding: 0.6rem; border: 1px solid #ccc; border-radius: 4px; }
button { cursor: pointer; border: none; padding: 0.8rem; border-radius: 4px; background: #42b883; color: white; font-weight: bold; }
button:disabled { background: #ccc; cursor: not-allowed; }
.btn-loading { animation: pulse 1.5s infinite; }
.job-card { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.status-msg { text-align: center; margin-top: 2rem; color: #666; }
@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
</style>
