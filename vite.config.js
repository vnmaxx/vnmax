import { defineConfig } from 'vite';

// Build estatico para deploy na Vercel (saida em dist/).
export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
