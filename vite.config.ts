import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import fs from "fs";

// Plugin para copiar o manifest.json para dist
function copyManifestPlugin() {
  return {
    name: "copy-manifest",
    closeBundle() {
      fs.copyFileSync(
        resolve(__dirname, "manifest.json"),
        resolve(__dirname, "dist/manifest.json")
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), copyManifestPlugin()],
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
  base: "/",
});