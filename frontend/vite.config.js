import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 8123 — этот адрес разрешён в CORS бэкенда
  server: { port: 8123, host: '127.0.0.1', strictPort: true },
  preview: { port: 8123, host: '127.0.0.1', strictPort: true },
  // Three.js (~550 КБ) — отдельный чанк, грузится после первого экрана
  build: { chunkSizeWarningLimit: 600 },
})
