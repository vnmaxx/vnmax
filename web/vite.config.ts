import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // remove console.*/debugger do bundle de producao (menos ruido e menos
  // vazamento de estado interno no console do navegador)
  esbuild: { drop: ['console', 'debugger'] },
  build: {
    // sem sourcemaps em producao → nao expoe a arvore de codigo-fonte no F12
    sourcemap: false,
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // nomes de bundle genericos e apenas-hash: o Network tab NAO revela
        // as libs (firebase/three/gsap) nem a estrutura de pastas.
        entryFileNames: 'assets/[hash].js',
        chunkFileNames: 'assets/[hash].js',
        manualChunks: {
          v1: ['three', '@react-three/fiber', '@react-three/drei'],
          v2: ['firebase/app', 'firebase/auth'],
          v3: ['gsap', 'lenis'],
        },
      },
    },
  },
});
