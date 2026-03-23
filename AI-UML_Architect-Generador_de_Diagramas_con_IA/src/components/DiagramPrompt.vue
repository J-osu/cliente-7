<script setup lang="ts">
import { ref } from 'vue';
import { Sparkles, XCircle } from 'lucide-vue-next';

defineProps<{
  isGenerating: boolean;
}>();

const emit = defineEmits<{
  (e: 'generate', prompt: string): void;
  (e: 'cancel'): void;
}>();

const userPrompt = ref('');

const handleGenerate = () => {
  if (userPrompt.value.trim()) {
    emit('generate', userPrompt.value.trim());
  }
};
</script>

<template>
  <div class="prompt-panel glass-panel">
    <h3>Design Requirement</h3>
    <textarea
      v-model="userPrompt"
      class="input-base prompt-textarea"
      placeholder='e.g., "I want a flowchart of a user logging in to my website."'
      :disabled="isGenerating"
      rows="4"
    ></textarea>
    
    <div class="actions">
      <button 
        v-if="!isGenerating" 
        class="btn btn-primary" 
        @click="handleGenerate"
        :disabled="!userPrompt.trim()"
      >
        <Sparkles :size="18" />
        Generate Diagram
      </button>
      
      <button 
        v-else 
        class="btn btn-danger cancel-btn" 
        @click="emit('cancel')"
      >
        <XCircle :size="18" class="spin-slow" />
        Cancel Generation
      </button>
    </div>
  </div>
</template>

<style scoped>
.prompt-panel {
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h3 {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.prompt-textarea {
  resize: vertical;
  min-height: 100px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.cancel-btn {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

.spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
