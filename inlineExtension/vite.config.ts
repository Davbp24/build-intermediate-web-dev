import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      async closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true })

        /* bundle the background service worker via esbuild */
        const esbuild = await import('esbuild')
        await esbuild.build({
          entryPoints: [resolve(__dirname, 'src/background/background.ts')],
          bundle: true,
          outfile: resolve(__dirname, 'dist/background.js'),
          platform: 'browser',
          target: 'chrome114',
          format: 'iife',
        })

        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(__dirname, 'dist/manifest.json'),
        )
        copyFileSync(
          resolve(__dirname, 'public/popup.html'),
          resolve(__dirname, 'dist/popup.html'),
        )
        try {
          copyFileSync(
            resolve(__dirname, 'public/vite.svg'),
            resolve(__dirname, 'dist/vite.svg'),
          )
        } catch {
          /* icon is optional */
        }
      },
    },
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/content/content.tsx'),
      name: 'InlineContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    cssCodeSplit: false,
  },
})
