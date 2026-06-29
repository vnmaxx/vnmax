// Integracao com Firebase Authentication (login da area interna).
// O Firestore (conteudo interno) fica em ./internal-data.js, carregado so apos
// o login, para nao pesar no bundle publico inicial.
// As chaves vem do .env (prefixo VITE_). Veja .env.example.
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// true quando o .env esta preenchido; evita quebrar a landing publica
// caso o projeto seja servido sem credenciais.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app = null;
let auth = null;
if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

export { app, auth };

export function watchAuth(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function login(email, password) {
  if (!auth) {
    throw new Error('Firebase nao configurado. Preencha o arquivo .env.');
  }
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function logout() {
  if (auth) await fbSignOut(auth);
}

// Traduz os codigos de erro do Firebase para mensagens em portugues.
export function authErrorMessage(error) {
  const code = error && error.code ? error.code : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'E-mail invalido.';
    case 'auth/missing-password':
      return 'Informe a senha.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Credenciais incorretas.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Tente novamente em instantes.';
    case 'auth/network-request-failed':
      return 'Falha de conexao. Verifique sua internet.';
    case 'auth/user-disabled':
      return 'Este acesso foi desativado.';
    default:
      return error && error.message ? error.message : 'Nao foi possivel entrar.';
  }
}

// Mensagem amigavel para falhas ao carregar o conteudo interno.
export function contentErrorMessage(error) {
  const code = error && error.code ? error.code : '';
  if (code === 'permission-denied') {
    return 'Sua conta está autenticada, mas não tem permissão para a área interna. Solicite acesso ao administrador.';
  }
  if (code === 'not-found') {
    return 'O conteúdo interno ainda não foi publicado. Rode o seed (npm run seed).';
  }
  if (code === 'unavailable' || code === 'auth/network-request-failed') {
    return 'Falha de conexão ao carregar a área interna. Tente novamente.';
  }
  return error && error.message ? error.message : 'Não foi possível carregar a área interna.';
}
