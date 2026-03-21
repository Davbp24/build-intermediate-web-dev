import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Content script build: produces a single self-contained IIFE at dist/content.js
export default defineConfig({
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/content/content.tsx"),
      name: "InlineContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    outDir: "dist",
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
