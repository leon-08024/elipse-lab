import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' => funciona no GitHub Pages, Vercel ou abrindo a pasta dist localmente
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
  },
});
