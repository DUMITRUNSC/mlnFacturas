import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',            // ← clave para que no quede en blanco al empaquetar
  plugins: [react(), tailwindcss()],
});
