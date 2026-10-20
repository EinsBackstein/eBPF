import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { notesMiddleware } from "./server/presenter-notes.mjs";
import { slides } from "./src/deck";
import { fileURLToPath } from "node:url";
const labApiUrl = process.env.LAB_API_URL || "http://127.0.0.1:4174";
const notesDirectory = fileURLToPath(new URL("./speaker-notes", import.meta.url));
export default defineConfig({
  plugins: [react(), {
    name: "private-presenter-notes",
    configureServer(server) {
      server.middlewares.use(notesMiddleware(notesDirectory, slides.map((slide) => slide.notesId)));
    },
    configurePreviewServer(server) {
      server.middlewares.use(notesMiddleware(notesDirectory, slides.map((slide) => slide.notesId)));
    },
  }],
  base: "./",
  server: {
    fs: { deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/speaker-notes/**"] },
    proxy: {
      "/api/lab": { target: labApiUrl, changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      "/api/lab": { target: labApiUrl, changeOrigin: true },
    },
  },
});
