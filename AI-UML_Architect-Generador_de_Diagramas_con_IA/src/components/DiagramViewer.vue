<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import mermaid from 'mermaid';
import { DownloadCloud, Image as ImageIcon } from 'lucide-vue-next';

const props = defineProps<{
  mermaidCode: string;
  errorMsg: string | null;
}>();

const svgContent = ref('');
const renderError = ref('');
const isRendering = ref(false);
const diagramContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Inter, sans-serif'
  });
});

watch(() => props.mermaidCode, async (newCode) => {
  renderError.value = '';
  svgContent.value = '';
  
  if (!newCode) return;

  isRendering.value = true;
  try {
    const id = `mermaid-render-${Date.now()}`;
    const { svg } = await mermaid.render(id, newCode);
    svgContent.value = svg;
  } catch (err: any) {
    renderError.value = 'Failed to render diagram: ' + (err.message || 'Syntax error in Mermaid code.');
    console.error('Mermaid rendering error:', err);
  } finally {
    isRendering.value = false;
  }
});

const exportSVG = () => {
  if (!svgContent.value) return;
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = `diagram-${Date.now()}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const exportPNG = () => {
  if (!svgContent.value || !diagramContainer.value) return;
  
  const svgWrapper = diagramContainer.value.querySelector('svg');
  if (!svgWrapper) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const svgData = new XMLSerializer().serializeToString(svgWrapper);
  const img = new Image();
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
  
  img.onload = () => {
    canvas.width = img.width || 800;
    canvas.height = img.height || 600;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `diagram-${Date.now()}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  };
};
</script>

<template>
  <div class="viewer-panel glass-panel">
    <div class="header">
      <h3>Diagram Canvas</h3>
      <div class="export-actions" v-if="svgContent">
        <button class="btn btn-secondary btn-sm" @click="exportSVG">
          <DownloadCloud :size="16" />
          SVG
        </button>
        <button class="btn btn-secondary btn-sm" @click="exportPNG">
          <ImageIcon :size="16" />
          PNG
        </button>
      </div>
    </div>

    <div class="canvas-area">
      <div v-if="props.errorMsg" class="error-msg">
        {{ props.errorMsg }}
      </div>
      <div v-else-if="renderError" class="error-msg">
        {{ renderError }}
      </div>
      <div v-else-if="isRendering" class="loading-msg">
        Rendering diagram...
      </div>
      <div v-else-if="!svgContent" class="empty-msg">
        Use the prompt above to generate your architectural diagram.
      </div>
      <div 
        v-else 
        class="svg-container" 
        v-html="svgContent"
        ref="diagramContainer"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.viewer-panel {
  border-radius: var(--radius-md);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
  min-height: 400px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h3 {
  font-size: 1.1rem;
  color: var(--text-primary);
}

.export-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
}

.canvas-area {
  background: var(--bg-primary);
  border: 1px dashed var(--border-color);
  border-radius: var(--radius-sm);
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: auto;
  position: relative;
}

.svg-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.svg-container :deep(svg) {
  max-width: 100%;
  height: auto;
}

.empty-msg {
  color: var(--text-secondary);
  font-style: italic;
}

.error-msg {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239, 68, 68, 0.2);
  max-width: 80%;
  text-align: center;
}

.loading-msg {
  color: var(--accent-secondary);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
