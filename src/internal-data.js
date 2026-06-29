// Acesso ao conteudo RESERVADO via Firestore.
// Este modulo importa firebase/firestore e e carregado dinamicamente (apos o
// login, junto com internal.js), entao o Firestore NAO entra no bundle publico.
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { app, isFirebaseConfigured } from './firebase.js';

let db = null;
if (isFirebaseConfigured && app) db = getFirestore(app);

// Busca o documento internal/content. As regras de seguranca (firestore.rules)
// so liberam a leitura para usuarios autenticados E presentes na allowlist; quem
// nao for membro recebe 'permission-denied' e o conteudo nunca chega ao client.
export async function getInternalContent() {
  if (!db) throw new Error('Firebase nao configurado. Preencha o arquivo .env.');
  const snap = await getDoc(doc(db, 'internal', 'content'));
  if (!snap.exists()) {
    const err = new Error('Conteudo interno nao encontrado.');
    err.code = 'not-found';
    throw err;
  }
  return snap.data();
}
