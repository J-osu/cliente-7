<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(import.meta.env.VITE_HF_TOKEN);

const descripcion = ref('warrior running, side view, pixel art');
const numFrames = ref(4);
const fps = ref(10);
const cargando = ref(false);
const mensaje = ref('');
const urlSprite = ref('');
const animando = ref(false);
const frameActual = ref(0);
const anchoPx = ref(0);   // ancho total de la imagen
const altoPx = ref(0);    // alto total de la imagen
const viewportW = ref(0);
const viewportH = ref(0);
const viewportEl = ref(null);
let intervalo = null;

// Detecta automáticamente el layout de la cuadrícula
// FLUX suele generar cuadrículas cuadradas: 2x2, 3x2, 4x1, etc.
const cols = computed(() => {
  if (!anchoPx.value || !altoPx.value) return numFrames.value;
  const ratio = anchoPx.value / altoPx.value;
  // Si la imagen es casi cuadrada y frames es 4 → 2x2
  if (ratio < 1.5 && numFrames.value === 4) return 2;
  if (ratio < 1.5 && numFrames.value === 6) return 3;
  if (ratio < 1.5 && numFrames.value === 9) return 3;
  // Imagen horizontal → todos en una fila
  return numFrames.value;
});

const rows = computed(() => Math.ceil(numFrames.value / cols.value));

// Tamaño de un frame individual
const frameW = computed(() => anchoPx.value / cols.value);
const frameH = computed(() => altoPx.value / rows.value);

// Escala para que quepa en el viewport
const scale = computed(() => {
  if (!frameW.value || !frameH.value || !viewportW.value || !viewportH.value) return 1;
  const maxW = viewportW.value * 0.8;
  const maxH = viewportH.value * 0.8;
  const s = Math.min(maxW / frameW.value, maxH / frameH.value);
  return Math.max(1, Math.floor(s));
});

// Posición del frame actual en la cuadrícula
const frameCol = computed(() => frameActual.value % cols.value);
const frameRow = computed(() => Math.floor(frameActual.value / cols.value));

// Ventana: muestra exactamente un frame
const estiloVentana = computed(() => ({
  width: `${frameW.value * scale.value}px`,
  height: `${frameH.value * scale.value}px`,
  overflow: 'hidden',
  position: 'relative',
}));

// La imagen se desplaza para mostrar el frame correcto
const estiloSprite = computed(() => ({
  width: `${anchoPx.value * scale.value}px`,
  height: `${altoPx.value * scale.value}px`,
  transform: `translate(-${frameCol.value * frameW.value * scale.value}px, -${frameRow.value * frameH.value * scale.value}px)`,
  imageRendering: 'pixelated',
  display: 'block',
  position: 'absolute',
  top: 0,
  left: 0,
}));

const generarSprite = async () => {
  if (!descripcion.value.trim()) return;
  cargando.value = true;
  mensaje.value = 'Generando...';
  try {
    const response = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: `pixel art style, spritesheet with ${numFrames.value} frames of ${descripcion.value}, white background, animation frames, flat design`,
      parameters: { num_inference_steps: 4 },
    });
    if (urlSprite.value) URL.revokeObjectURL(urlSprite.value);
    urlSprite.value = URL.createObjectURL(response);
    mensaje.value = '✓ Listo';
  } catch (e) {
    if (e.message.includes('429')) mensaje.value = 'Límite de peticiones. Espera un momento.';
    else if (e.message.includes('loading')) mensaje.value = 'Modelo cargando, reintenta en 20s.';
    else { mensaje.value = 'Error: ' + e.message; generarDemoInterno(); }
  } finally {
    cargando.value = false;
  }
};

const generarDemoInterno = () => {
  const fw = 48, fh = 64;
  const c = cols.value, r = rows.value;
  const canvas = document.createElement('canvas');
  canvas.width = fw * c;
  canvas.height = fh * r;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < numFrames.value; i++) {
    const cx = (i % c) * fw, cy = Math.floor(i / c) * fh;
    ctx.fillStyle = i % 2 === 0 ? '#e94560' : '#4cc9f0';
    ctx.fillRect(cx + 8, cy + 8, fw - 16, fh - 16);
  }
  canvas.toBlob(blob => { urlSprite.value = URL.createObjectURL(blob); });
};

const toggleAnimacion = () => {
  if (animando.value) {
    clearInterval(intervalo);
    animando.value = false;
  } else {
    animando.value = true;
    intervalo = setInterval(() => {
      frameActual.value = (frameActual.value + 1) % numFrames.value;
    }, 1000 / fps.value);
  }
};

const onImgLoad = (e) => {
  anchoPx.value = e.target.naturalWidth;
  altoPx.value = e.target.naturalHeight;
};

const medirViewport = () => {
  if (viewportEl.value) {
    viewportW.value = viewportEl.value.clientWidth;
    viewportH.value = viewportEl.value.clientHeight;
  }
};

onMounted(() => {
  medirViewport();
  window.addEventListener('resize', medirViewport);
});
onUnmounted(() => {
  clearInterval(intervalo);
  window.removeEventListener('resize', medirViewport);
});
</script>

<template>
  <div class="layout">

    <!-- LEFT: controls -->
    <aside class="panel-left">
      <span class="panel-title">SPRITE FORGE</span>

      <div class="section">
        <label class="lbl">Descripción</label>
        <textarea v-model="descripcion" placeholder="Ej: blue slime jumping..." rows="4" />
      </div>

      <div class="section row-fields">
        <div class="field">
          <label class="lbl">FPS</label>
          <input type="number" v-model.number="fps" min="1" max="60" />
        </div>
      </div>

      <button class="btn-gen" @click="generarSprite" :disabled="cargando">
        <span v-if="cargando" class="spinner" />
        {{ cargando ? 'Generando...' : 'Generar' }}
      </button>

      <p v-if="mensaje" class="status">{{ mensaje }}</p>

      <!-- Grid info -->
      <div v-if="urlSprite" class="grid-info">
        <span>{{ cols }}×{{ rows }} grid · frame {{ frameW.toFixed(0) }}×{{ frameH.toFixed(0) }}px</span>
      </div>

      <div v-if="urlSprite" class="section sheet-section">
        <label class="lbl">Spritesheet</label>
        <img :src="urlSprite" @load="onImgLoad" class="sheet-img" />
      </div>
    </aside>

    <!-- RIGHT -->
    <main class="panel-right">

      <div v-if="!urlSprite" class="empty-state">
        <div class="empty-icon">◈</div>
        <p>Genera un sprite para verlo aquí</p>
      </div>

      <template v-else>
        <div class="viewport" ref="viewportEl">
          <div :style="estiloVentana" class="anim-window">
            <img :src="urlSprite" :style="estiloSprite" />
          </div>
          <div class="scale-badge">×{{ scale }}</div>
        </div>

        <div class="controls-bar">
          <button class="btn-play" @click="toggleAnimacion">
            {{ animando ? '⏹ Detener' : '▶ Reproducir' }}
          </button>
          <span class="frame-info">Frame {{ frameActual + 1 }} / {{ numFrames }}</span>
        </div>
      </template>

    </main>
  </div>
</template>

<style scoped>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: #0a0a0a;
  font-family: 'Courier New', monospace;
  color: #d0d0d0;
  overflow: hidden;
}

.panel-left {
  width: 300px;
  min-width: 260px;
  flex-shrink: 0;
  background: #111;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 28px 22px;
  overflow-y: auto;
}

.panel-title {
  font-size: 0.63rem;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #444;
  padding-bottom: 16px;
  border-bottom: 1px solid #1e1e1e;
}

.section { display: flex; flex-direction: column; gap: 8px; }

.lbl {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #4a4a4a;
}

textarea {
  background: #0a0a0a;
  color: #d0d0d0;
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  padding: 10px;
  font-family: inherit;
  font-size: 0.82rem;
  resize: none;
  width: 100%;
  outline: none;
  line-height: 1.5;
}
textarea:focus { border-color: #2e2e2e; }

.row-fields { flex-direction: row; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; flex: 1; }

input[type="number"] {
  background: #0a0a0a;
  color: #d0d0d0;
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  padding: 9px 10px;
  font-family: inherit;
  font-size: 0.82rem;
  width: 100%;
  outline: none;
}
input[type="number"]:focus { border-color: #2e2e2e; }

.btn-gen {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  background: #e8e8e8;
  color: #111;
  border: none;
  border-radius: 4px;
  padding: 13px;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: bold;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-gen:hover:not(:disabled) { background: #fff; }
.btn-gen:disabled { opacity: 0.3; cursor: default; }

.spinner {
  width: 11px; height: 11px;
  border: 2px solid #555;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

.status { font-size: 0.7rem; color: #4a4a4a; }

.grid-info {
  font-size: 0.62rem;
  color: #333;
  letter-spacing: 0.06em;
}

.sheet-section { margin-top: auto; }

.sheet-img {
  width: 100%;
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  image-rendering: pixelated;
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0a0a0a;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #222;
  user-select: none;
}
.empty-icon { font-size: 2.5rem; }
.empty-state p {
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.viewport {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.anim-window {
  border: 1px solid #1e1e1e;
  background: #000;
}

.scale-badge {
  position: absolute;
  bottom: 12px;
  right: 16px;
  font-size: 0.62rem;
  color: #2a2a2a;
  letter-spacing: 0.1em;
}

.controls-bar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid #1a1a1a;
}

.btn-play {
  background: none;
  color: #d0d0d0;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  padding: 10px 28px;
  font-family: inherit;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: border-color 0.15s;
}
.btn-play:hover { border-color: #555; }

.frame-info {
  font-size: 0.68rem;
  color: #383838;
  letter-spacing: 0.1em;
}
</style>