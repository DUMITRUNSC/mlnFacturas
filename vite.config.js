import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // 👈 Aquí usamos Tailwind como plugin de Vite

export default defineConfig({
  plugins: [react(), tailwindcss()],
});