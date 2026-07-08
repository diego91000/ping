import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Alias "@/..." -> "src/...", pour des imports propres (plus de ../../..).
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Le front appelle "/api/...", Vite redirige vers le backend Quarkus.
    // Ça évite les problèmes de CORS entre le port 5173 (front) et 8080 (back).
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
