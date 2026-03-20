import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

export default defineConfig(
  {

    
  // Replace process.env.NODE_ENV — browsers don't have `process`
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  plugins: [
    react(),
    {
      // Copy manifest.json and popup assets into dist/ after build
      name: 'copy-extension-files',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(__dirname, 'dist/manifest.json'),
        )
        // Copy popup entry (index.html) and icon
        try {
          copyFileSync(
            resolve(__dirname, 'public/vite.svg'),
            resolve(__dirname, 'dist/vite.svg'),
          )
        } catch {
          // Icon is optional
        }
      },
    },
  ],
  build: {
    // Build the content script as a self-contained IIFE bundle
    lib: {
      entry: resolve(__dirname, 'src/content/content.tsx'),
      name: 'InlineContent',
      formats: ['iife'],
      fileName: () => 'content.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "index.html",
        content: "src/content/content.tsx",
        background: "src/background/background.ts",
      },
      output: {
        // Ensure everything is inlined into a single file
        inlineDynamicImports: true,
        // No separate CSS file — CSS is inlined via ?inline import
        assetFileNames: 'assets/[name]-[hash].[ext]',
        entryFileNames: "[name].js"
      },
    },
    // Don't extract CSS to a separate file (it's inlined into JS via ?inline)
    cssCodeSplit: false,
  },
})
