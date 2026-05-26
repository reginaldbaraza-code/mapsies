import { defineConfig } from "vite";

const proxyOpts = { changeOrigin: true, secure: true };

const apiProxy = {
  "/api/db": {
    target: "https://v6.db.transport.rest",
    rewrite: (p: string) => p.replace(/^\/api\/db/, ""),
    ...proxyOpts,
  },
  "/api/db-v5": {
    target: "https://v5.db.transport.rest",
    rewrite: (p: string) => p.replace(/^\/api\/db-v5/, ""),
    ...proxyOpts,
  },
  "/api/nominatim": {
    target: "https://nominatim.openstreetmap.org",
    rewrite: (p: string) => p.replace(/^\/api\/nominatim/, ""),
    ...proxyOpts,
  },
};

export default defineConfig({
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "es2022",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/leaflet")) return "leaflet";
        },
      },
    },
  },
  preview: {
    port: 8765,
    strictPort: true,
    host: "127.0.0.1",
    proxy: apiProxy,
  },
  server: {
    port: 8765,
    host: "127.0.0.1",
    proxy: apiProxy,
  },
});
