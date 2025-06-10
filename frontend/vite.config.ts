import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/HomeEasy/", // Updated to match actual repository name
  build: {
    outDir: "dist",
  },
});
