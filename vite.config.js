import { defineConfig } from 'vite';

// Build estatico para deploy na Vercel (saida em dist/).
export default defineConfig({
  root: '.',
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // DEV apenas: encaminha /api/* para o backend do assistente rodando localmente,
  // assim o widget funciona em `npm run dev` sem precisar de VITE_CHAT_API_URL.
  // Em producao (Vercel) o widget usa VITE_CHAT_API_URL (servidor Linux por HTTPS).
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
});
