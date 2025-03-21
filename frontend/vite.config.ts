import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Add base path - usually '/' for production
  base: "/",
  // Configure server for SPA routing
  server: {
    historyApiFallback: true,
  },
  preview: {
    port: 5173,
    strictPort: false,
  },
});
