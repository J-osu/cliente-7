<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useJobStore } from './stores/jobStore';

const store = useJobStore();
const nuevaEmpresa = ref('');
const nuevoPuesto = ref('');

onMounted(() => store.fetchJobs());

const handleSubmit = () => {
  if (nuevaEmpresa.value && nuevoPuesto.value) {
    store.addJob({
      empresa: nuevaEmpresa.value,
      puesto: nuevoPuesto.value,
      estado: 'CV Enviado'
    });
    nuevaEmpresa.value = '';
    nuevoPuesto.value = '';
  }
};
</script>

<template>
  <div class="container">
    <h1>💼 Job Tracker - Josu Edition</h1>
    
    <form @submit.prevent="handleSubmit">
      <input v-model="nuevaEmpresa" placeholder="Empresa" required />
      <input v-model="nuevoPuesto" placeholder="Puesto" required />
      <button type="submit">Añadir Candidatura</button>
    </form>

    <div v-if="store.loading">Cargando...</div>
    <ul v-else>
      <li v-for="job in store.jobs" :key="job.id">
        <strong>{{ job.empresa }}</strong> - {{ job.puesto }} 
        <span>({{ job.estado }})</span>
        
        <button @click="store.updateStatus(job.id!, 'Entrevista Técnica')">🎯 Entrevista</button>
        <button @click="store.deleteJob(job.id!)" class="btn-delete">🗑️ Borrar</button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Un poco de estilo para que no parezca una web de 1995 */
.container { max-width: 600px; margin: 0 auto; font-family: sans-serif; }
form { margin-bottom: 20px; display: flex; gap: 10px; }
li { margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; list-style: none; }
.btn-delete { background-color: #ff4d4d; color: white; border: none; cursor: pointer; margin-left: 10px;}
</style>
