// Fila de jobs de edicao de video (Firestore `video_jobs`). Estados:
//   fila -> processando -> pronto | erro
// O worker (worker.js) consome a fila; o portal cria/le os jobs. Escrita so pelo
// servidor (Admin SDK). claimNext() pega um job atomicamente (transacao).
import { db, admin } from '../firebase-admin.js';

const COLLECTION = 'video_jobs';
const FV = () => admin.firestore.FieldValue.serverTimestamp();

export function videoEnabled() { return Boolean(db); }

export async function createJob(input, member) {
  if (!db) { const e = new Error('Servidor sem Firebase.'); e.status = 503; throw e; }
  const ref = await db.collection(COLLECTION).add({
    source: input.source,            // { type:'url'|'inbox', value }
    instructions: input.instructions || '',
    options: input.options || {},
    status: 'fila',
    progress: 'Na fila…',
    notes: [],
    outputUrl: null,
    error: null,
    createdBy: member.uid,
    createdByEmail: member.email,
    createdAt: FV(),
    updatedAt: FV(),
  });
  return { id: ref.id, status: 'fila' };
}

// Lista os jobs DO DONO (escopo por membro — evita vazar jobs entre membros).
export async function listJobs(member, limit = 50) {
  if (!db) return [];
  const uid = member && member.uid;
  const base = () => (uid ? db.collection(COLLECTION).where('createdBy', '==', uid) : db.collection(COLLECTION));
  try {
    const snap = await base().orderBy('createdAt', 'desc').limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const toMs = (ts) => (ts && ts.toDate ? ts.toDate().getTime() : ts && ts.seconds ? ts.seconds * 1000 : 0);
    const snap = await base().limit(limit).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  }
}

export async function getJob(id) {
  if (!db) return null;
  const snap = await db.collection(COLLECTION).doc(String(id)).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function updateJob(id, patch) {
  if (!db) return;
  await db.collection(COLLECTION).doc(String(id)).update({ ...patch, updatedAt: FV() });
}

export async function deleteJob(id, member) {
  if (!db) { const e = new Error('Servidor sem Firebase.'); e.status = 503; throw e; }
  const ref = db.collection(COLLECTION).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) { const e = new Error('Job não encontrado.'); e.status = 404; throw e; }
  const data = snap.data();
  if (data.createdBy && member && data.createdBy !== member.uid) { const e = new Error('Sem permissão.'); e.status = 403; throw e; }
  await ref.delete();
  return { id, deleted: true };
}

// Pega atomicamente o proximo job 'fila' e marca 'processando' (evita corrida).
export async function claimNext() {
  if (!db) return null;
  let snap;
  try { snap = await db.collection(COLLECTION).where('status', '==', 'fila').orderBy('createdAt', 'asc').limit(1).get(); }
  catch { snap = await db.collection(COLLECTION).where('status', '==', 'fila').limit(1).get(); }
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const ref = doc.ref;
  try {
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      if (!fresh.exists || fresh.data().status !== 'fila') return null;
      tx.update(ref, { status: 'processando', progress: 'Iniciando…', startedAt: FV(), updatedAt: FV() });
      return { id: ref.id, ...fresh.data() };
    });
    return claimed;
  } catch { return null; }
}
