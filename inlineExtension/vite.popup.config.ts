import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/** Popup SPA — run first so `dist/` is created; content build uses emptyOutDir: false. */
export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
})
