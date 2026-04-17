import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    // Proxy /api/* to a local dev server during development
    // Run `vercel dev` instead of `npm run dev` to test the API routes locally
    proxy: {},
  },
});
