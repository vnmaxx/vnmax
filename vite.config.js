import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Build estatico para deploy na Vercel (saida em dist/).
// MPA (multi-page): duas entradas independentes.
//   - index.html   -> landing publica (bundle enxuto, sem Firebase/portal).
//   - interno.html -> area interna (Firebase Auth + Firestore + portal), rota
//                     separada carregada so ao acessar /interno.html.
export default defineConfig({
  root: '.',
  // public/ guarda arquivos estaticos que precisam de URL fixa e sem hash
  // (robots.txt, sitemap.xml, og-image.png) — copiados ao pe da letra para dist/.
  publicDir: 'public',
  build: {
    outDir: 'dist-portal',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        interno: resolve(root, 'interno.html'),
      },
    },
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
