<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import ConfigPanel from './components/ConfigPanel.vue';
import DiagramPrompt from './components/DiagramPrompt.vue';
import DiagramViewer from './components/DiagramViewer.vue';

const apiKey = ref('');
const isGenerating = ref(false);
const mermaidCode = ref('');
const errorMsg = ref<string | null>(null);

let abortController: AbortController | null = null;

const handleCancel = () => {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
};

const extractMermaidCode = (text: string): string => {
  const match = text.match(/```(?:mermaid)?([\s\S]*?)```/);
  if (match) {
    return match[1].trim();
  }
  return text.trim();
};

const handleGenerate = async (promptText: string) => {
  if (!apiKey.value) {
    errorMsg.value = 'Please provide an API Key in the Configuration panel first.';
    return;
  }

  mermaidCode.value = '';
  errorMsg.value = null;
  isGenerating.value = true;
  
  abortController = new AbortController();

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey.value}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: promptText
        }]
      }],
      systemInstruction: {
        parts: [{
          text: `You are an expert software architect requested to generate UML Diagrams or Flowcharts. 
Given the user's requirement, generate ONLY a valid Mermaid.js diagram representing it.
DO NOT include any markdown formatting wrappers (like \`\`\`mermaid).
DO NOT include any greetings, explanations, or text other than the pure Mermaid.js code.
Use the modern mermaid syntax.`
        }]
      },
      generationConfig: {
        temperature: 0.2
      }
    };

    const response = await axios.post(url, requestBody, {
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const rawText = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!rawText) {
      throw new Error('Received empty response from the AI.');
    }

    mermaidCode.value = extractMermaidCode(rawText);
    
  } catch (err: any) {
    if (axios.isCancel(err)) {
      errorMsg.value = 'Generation was canceled by the user.';
    } else {
      errorMsg.value = err.response?.data?.error?.message 
        || err.message 
        || 'An unexpected error occurred while generating the diagram.';
    }
  } finally {
    isGenerating.value = false;
    abortController = null;
  }
};
</script>

<template>
  <main class="app-container">
    <header class="app-header">
      <div class="logo">
        <h1 class="text-gradient">AI UML Architect</h1>
        <span class="badge">PRO</span>
      </div>
      <p class="subtitle">Generate architectural diagrams instantly with AI</p>
    </header>

    <div class="split-layout">
      <aside class="sidebar">
        <ConfigPanel v-model:apiKey="apiKey" />
        <DiagramPrompt 
          :is-generating="isGenerating"
          @generate="handleGenerate"
          @cancel="handleCancel"
        />
      </aside>

      <section class="main-content">
        <DiagramViewer 
          :mermaid-code="mermaidCode"
          :error-msg="errorMsg"
        />
      </section>
    </div>
  </main>
</template>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  width: 100%;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.app-header {
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo h1 {
  font-size: 2.5rem;
  margin: 0;
}

.badge {
  background: var(--accent-primary);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.split-layout {
  display: flex;
  gap: 2rem;
  flex-grow: 1;
}

.sidebar {
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (max-width: 900px) {
  .split-layout {
    flex-direction: column;
  }
  
  .sidebar {
    flex: none;
    width: 100%;
  }
}
</style>
