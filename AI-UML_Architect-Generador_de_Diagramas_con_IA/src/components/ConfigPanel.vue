<script setup lang="ts">
import { ref, watch } from 'vue';
import { Settings, Key } from 'lucide-vue-next';

const apiKey = ref(localStorage.getItem('ai_uml_api_key') || '');
const emit = defineEmits<{
  (e: 'update:apiKey', key: string): void
}>();

watch(apiKey, (newVal) => {
  localStorage.setItem('ai_uml_api_key', newVal);
  emit('update:apiKey', newVal);
});

if (apiKey.value) {
  emit('update:apiKey', apiKey.value);
}
</script>

<template>
  <div class="config-panel glass-panel">
    <div class="header">
      <Settings class="icon" :size="20" />
      <h2>Configuration</h2>
    </div>
    <div class="content">
      <p class="description">
        Please provide a Gemini API Key to use the generator. Get one free at 
        <a href="https://aistudio.google.com/" target="_blank">Google AI Studio</a>.
      </p>
      <div class="input-group">
        <Key class="input-icon" :size="18" />
        <input 
          v-model="apiKey" 
          type="password" 
          class="input-base" 
          placeholder="Paste your Gemini API Key here (AIz...)" 
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-panel {
  border-radius: var(--radius-md);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.header h2 {
  font-size: 1.25rem;
  color: var(--text-primary);
}

.icon {
  color: var(--accent-secondary);
}

.description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.description a {
  color: var(--accent-secondary);
  text-decoration: none;
}

.description a:hover {
  text-decoration: underline;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: var(--text-secondary);
}

.input-base {
  padding-left: 3rem;
}
</style>
