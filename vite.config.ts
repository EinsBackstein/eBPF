import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/api/lab": { target: "http://127.0.0.1:4174", changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api/lab": { target: "http://127.0.0.1:4174", changeOrigin: true },
    },
  },
});
