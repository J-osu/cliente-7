// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ToastPlugin from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-default.css'

import App from './App.vue'
import { enrutador } from './router'

const app = createApp(App)

app.use(createPinia())
app.use(enrutador)
app.use(ToastPlugin)

app.mount('#app')