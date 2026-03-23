<script setup>
import { HfInference } from '@huggingface/inference';
// ─── Requisito 2 & 3: Axios para progreso de descarga y manejo de Blobs ───
import axios from 'axios';
import { ref, computed, onUnmounted, onMounted } from 'vue';

// ── Estado general ──────────────────────────────────────────────────────────

const apiKey = import.meta.env.VITE_HF_TOKEN;
const hf = new HfInference(apiKey);
const descripcion  = ref('warrior running, side view, pixel art');
const numFrames    = ref(4);
const fps          = ref(10);
const cargando     = ref(false);
const mensaje      = ref('');
const urlSprite    = ref('');
const animando     = ref(false);
const frameActual  = ref(0);
const anchoPx      = ref(0);
const altoPx       = ref(0);
const viewportW    = ref(0);
const viewportH    = ref(0);
const viewportEl   = ref(null);

// ── Requisito 2: Barra de progreso ─────────────────────────────────────────
const progreso = ref(0);   // 0-100
let intervalo  = null;

// ── Detección automática de layout de la cuadrícula ────────────────────────
// FLUX puede generar 2×2, 3×2, 4×1, etc. según los frames pedidos
const cols = computed(() => {
  if (!anchoPx.value || !altoPx.value) return numFrames.value;
  const ratio = anchoPx.value / altoPx.value;
  if (ratio < 1.5 && numFrames.value === 4) return 2;
  if (ratio < 1.5 && numFrames.value === 6) return 3;
  if (ratio < 1.5 && numFrames.value === 9) return 3;
  return numFrames.value;
});
const rows = computed(() => Math.ceil(numFrames.value / cols.value));

// ── Tamaño de un frame individual ──────────────────────────────────────────
const frameW = computed(() => anchoPx.value / cols.value);
const frameH = computed(() => altoPx.value  / rows.value);

// ── Escala automática para que el sprite quepa en el viewport ──────────────
const scale = computed(() => {
  if (!frameW.value || !frameH.value || !viewportW.value || !viewportH.value) return 1;
  const s = Math.min(
    (viewportW.value * 0.8) / frameW.value,
    (viewportH.value * 0.8) / frameH.value
  );
  return Math.max(1, Math.floor(s));
});

// ── Posición del frame actual en la cuadrícula ─────────────────────────────
const frameCol = computed(() => frameActual.value % cols.value);
const frameRow = computed(() => Math.floor(frameActual.value / cols.value));

// ── Requisito 4 & 5: estilos CSS calculados con v-bind ─────────────────────
// Ventana recortadora: muestra exactamente UN frame
const estiloVentana = computed(() => ({
  width:    `${frameW.value * scale.value}px`,
  height:   `${frameH.value * scale.value}px`,
  overflow: 'hidden',
  position: 'relative',
}));

// La imagen completa se desplaza (X e Y) para encuadrar el frame correcto
const estiloSprite = computed(() => ({
  width:          `${anchoPx.value * scale.value}px`,
  height:         `${altoPx.value  * scale.value}px`,
  transform:      `translate(
                    -${frameCol.value * frameW.value * scale.value}px,
                    -${frameRow.value * frameH.value * scale.value}px
                  )`,
  imageRendering: 'pixelated',
  display:        'block',
  position:       'absolute',
  top:  0,
  left: 0,
}));

const generarSprite = async () => {
  if (!descripcion.value.trim()) return;
  
  // Reiniciar estado
  cargando.value = true;
  progreso.value = 0;
  mensaje.value = 'Iniciando generación...';

  // --- Simulación de progreso ---
  // Iniciamos un intervalo que sube el progreso gradualmente
  const intervaloProgreso = setInterval(() => {
    if (progreso.value < 90) {
      // Sube rápido al principio, luego más lento
      const incremento = progreso.value < 50 ? 5 : 1;
      progreso.value += incremento;
    }
  }, 300);

  try {
    const response = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: `pixel art style, spritesheet with ${numFrames.value} frames of ${descripcion.value}, white background, animation frames, flat design`,
      parameters: { num_inference_steps: 4 },
    });

    // Éxito: Saltamos al 100%
    progreso.value = 100;
    
    if (urlSprite.value) URL.revokeObjectURL(urlSprite.value);
    urlSprite.value = URL.createObjectURL(response);
    mensaje.value = '✓ ¡Sprite generado!';

    // Limpiar barra después de un segundo
    setTimeout(() => { if (!cargando.value) progreso.value = 0; }, 1500);

  } catch (e) {
    progreso.value = 0;
    if (e.message.includes('429')) {
      mensaje.value = 'Demasiadas peticiones. Espera un poco.';
    } else if (e.message.includes('loading')) {
      mensaje.value = 'El modelo se está despertando, reintenta en breve.';
    } else {
      mensaje.value = 'Error: ' + e.message;
      generarDemoInterno();
    }
  } finally {
    clearInterval(intervaloProgreso);
    cargando.value = false;
  }
};
// ── Demo interno (fallback sin red) ────────────────────────────────────────
const generarDemoInterno = () => {
  const fw = 48, fh = 64;
  const c = cols.value, r = rows.value;
  const canvas = document.createElement('canvas');
  canvas.width  = fw * c;
  canvas.height = fh * r;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < numFrames.value; i++) {
    const cx = (i % c) * fw, cy = Math.floor(i / c) * fh;
    ctx.fillStyle = i % 2 === 0 ? '#e94560' : '#4cc9f0';
    ctx.fillRect(cx + 8, cy + 8, fw - 16, fh - 16);
  }
  canvas.toBlob(blob => {
    urlSprite.value = URL.createObjectURL(blob);
    progreso.value  = 100;
  });
};

// ── Animación ───────────────────────────────────────────────────────────────
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

// ── Medición de imagen y viewport ──────────────────────────────────────────
const onImgLoad = (e) => {
  anchoPx.value = e.target.naturalWidth;
  altoPx.value  = e.target.naturalHeight;
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

    <!-- ════════════════ PANEL IZQUIERDO ════════════════ -->
    <aside class="panel-left">
      <span class="panel-title">SPRITE FORGE</span>

      <!-- Descripción -->
      <div class="section">
        <label class="lbl">Descripción</label>
        <textarea
          v-model="descripcion"
          placeholder="Ej: blue slime jumping..."
          rows="4"
        />
      </div>

      <!-- Requisito 4: campo Frames que el usuario introduce manualmente -->
      <div class="section row-fields">
        <div class="field">
          <label class="lbl">Frames</label>
          <input type="number" v-model.number="numFrames" min="1" max="16" />
        </div>
        <div class="field">
          <label class="lbl">FPS</label>
          <input type="number" v-model.number="fps" min="1" max="60" />
        </div>
      </div>

      <!-- Botón generar -->
      <button class="btn-gen" @click="generarSprite" :disabled="cargando">
        <span v-if="cargando" class="spinner" />
        {{ cargando ? 'Generando...' : 'Generar' }}
      </button>

      <!-- Requisito 2: Barra de progreso visual -->
      <div v-if="cargando || progreso > 0" class="progress-wrap">
        <div class="progress-bar" :style="{ width: progreso + '%' }" />
        <span class="progress-pct">{{ progreso }}%</span>
      </div>

      <p v-if="mensaje" class="status">{{ mensaje }}</p>

      <!-- Info de cuadrícula detectada -->
      <div v-if="urlSprite" class="grid-info">
        {{ cols }}×{{ rows }} grid · frame {{ frameW.toFixed(0) }}×{{ frameH.toFixed(0) }}px
      </div>

      <!-- Spritesheet completo (miniatura) -->
      <div v-if="urlSprite" class="section sheet-section">
        <label class="lbl">Spritesheet</label>
        <!-- Requisito 3: src viene de createObjectURL(blob) -->
        <img :src="urlSprite" @load="onImgLoad" class="sheet-img" />
      </div>
    </aside>

    <!-- ════════════════ PANEL DERECHO ════════════════ -->
    <main class="panel-right">

      <div v-if="!urlSprite" class="empty-state">
        <div class="empty-icon">◈</div>
        <p>Genera un sprite para verlo aquí</p>
      </div>

      <template v-else>
        <!-- Viewport de animación -->
        <div class="viewport" ref="viewportEl">
          <!--
            Requisito 5: v-bind aplica estilos calculados en tiempo real.
            estiloVentana recorta exactamente 1 frame.
            estiloSprite desplaza la imagen para encuadrar el frame correcto.
          -->
          <div v-bind:style="estiloVentana" class="anim-window">
            <img :src="urlSprite" v-bind:style="estiloSprite" />
          </div>
          <div class="scale-badge">×{{ scale }}</div>
        </div>

        <!-- Controles -->
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

/* ── Panel izquierdo ── */
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

/* ── Requisito 2: barra de progreso ── */
.progress-wrap {
  position: relative;
  height: 6px;
  background: #1e1e1e;
  border-radius: 3px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: #e8e8e8;
  border-radius: 3px;
  transition: width 0.2s ease;
}
.progress-pct {
  position: absolute;
  right: 0;
  top: -16px;
  font-size: 0.6rem;
  color: #555;
}

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

/* ── Panel derecho ── */
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