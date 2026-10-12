import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 8123 — этот адрес разрешён в CORS бэкенда
  server: { port: 8123, host: '127.0.0.1', strictPort: true },
  preview: { port: 8123, host: '127.0.0.1', strictPort: true },
  // Three.js (~550 КБ) и MapLibre (~1 МБ) — отдельные чанки, грузятся лениво, когда их блок рядом
  build: { chunkSizeWarningLimit: 1100 },
})
