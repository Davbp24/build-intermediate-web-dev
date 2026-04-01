import { defineConfig } from "vite";
import { resolve } from "path";

// Background service worker build: produces a single IIFE at dist/background.js
export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/background/background.ts"),
      name: "InlineBackground",
      formats: ["iife"],
      fileName: () => "background.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
