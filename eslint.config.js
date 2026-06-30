// Configuracao do ESLint (flat config) para o projeto VNMAX.
// - Frontend (src/): modulos ES, ambiente de browser + import.meta (Vite).
// - Backend (server/, scripts/): modulos ES, ambiente Node.
// Regras pragmaticas: pegam erros reais (variaveis nao usadas/indefinidas,
// imports quebrados) sem exigir um estilo rigido.
import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**', '.vercel/**', 'vnmax-os/**', 'exports/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser },
    },
  },
  {
    files: ['server/**/*.{js,mjs}', 'scripts/**/*.{js,mjs}', '*.config.js', '*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
];
