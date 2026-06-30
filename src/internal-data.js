// Acesso ao conteudo RESERVADO via Firestore.
// Este modulo importa firebase/firestore e e carregado dinamicamente (apos o
// login, junto com internal.js), entao o Firestore NAO entra no bundle publico.
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, updateDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
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

// Busca a base de documentos internos (colecao internal_docs). Mesma allowlist.
export async function getInternalDocs() {
  if (!db) throw new Error('Firebase nao configurado.');
  const snap = await getDocs(collection(db, 'internal_docs'));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  docs.sort((a, b) => (a.path || '').localeCompare(b.path || ''));
  return docs;
}

/* ---- CRM: leads (formulario de contato + chat de IA) ---- */

export async function getLeads() {
  if (!db) throw new Error('Firebase nao configurado.');
  const toMs = (ts) => (ts && ts.toDate ? ts.toDate().getTime() : ts && ts.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : 0);
  try {
    const snap = await getDocs(query(collection(db, 'leads'), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    if (e && e.code !== 'failed-precondition') throw e; // propaga erros reais (permissao, rede)
    const snap = await getDocs(collection(db, 'leads'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  }
}

export async function updateLeadStage(id, stage) {
  if (!db) throw new Error('Firebase nao configurado.');
  await updateDoc(doc(db, 'leads', id), {
    stage,
    updatedAt: serverTimestamp(),
    historico: arrayUnion({ tipo: 'stage', texto: `Movido para ${stage}`, em: Date.now() }),
  });
}

// Adiciona um evento ao historico/timeline (tipo: 'nota' | 'mensagem' | 'proposta' | ...).
export async function addLeadEvent(id, tipo, texto) {
  if (!db) throw new Error('Firebase nao configurado.');
  await updateDoc(doc(db, 'leads', id), {
    historico: arrayUnion({ tipo, texto, em: Date.now() }),
    updatedAt: serverTimestamp(),
  });
}

// Atualiza campos editaveis (segmento, observacao, contato, etc.).
export async function updateLeadFields(id, fields) {
  if (!db) throw new Error('Firebase nao configurado.');
  await updateDoc(doc(db, 'leads', id), { ...fields, updatedAt: serverTimestamp() });
}

export async function deleteLead(id) {
  if (!db) throw new Error('Firebase nao configurado.');
  await deleteDoc(doc(db, 'leads', id));
}
