import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync } from "fs";

const copyExtensionFiles = {
  name: "copy-extension-files",
  closeBundle() {
    mkdirSync(resolve(__dirname, "dist"), { recursive: true });
    copyFileSync(
      resolve(__dirname, "public/manifest.json"),
      resolve(__dirname, "dist/manifest.json"),
    );
    try {
      copyFileSync(
        resolve(__dirname, "public/vite.svg"),
        resolve(__dirname, "dist/vite.svg"),
      );
    } catch {
      // Icon is optional
    }
  },
};

export default [
  {
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    plugins: [react(), copyExtensionFiles],
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
          background: resolve(__dirname, "src/background/background.ts"),
        },
        output: {
          assetFileNames: "assets/[name]-[hash].[ext]",
          entryFileNames: "[name].js",
        },
      },
      cssCodeSplit: false,
    },
  },
  {
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    plugins: [react()],
    build: {
      outDir: "dist",
      emptyOutDir: false,
      lib: {
        entry: resolve(__dirname, "src/content/content.tsx"),
        name: "InlineContent",
        formats: ["iife"],
        fileName: () => "content.js",
      },
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash].[ext]",
        },
      },
      cssCodeSplit: false,
    },
  },
] satisfies UserConfig[];