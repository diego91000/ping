import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

// Config de test isolée : on réutilise l'alias "@/..." de vite.config.ts.
// Environnement "node" : les fonctions testées sont pures (pas de DOM,
// pas de micro, pas de Monaco).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
