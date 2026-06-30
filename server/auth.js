// Autenticacao dos endpoints privilegiados do portal interno: exige um ID token do
// Firebase de um usuario presente na allowlist (mesma do portal). Compartilhado por
// social.js e video.js.
import { db, auth } from './firebase-admin.js';

export async function requireMember(req) {
  if (!auth || !db) { const e = new Error('Servidor sem credenciais Firebase. Coloque serviceAccount.json em server/.'); e.status = 503; throw e; }
  const h = req.headers['authorization'] || '';
  const m = /^Bearer\s+(.+)$/i.exec(h);
  if (!m) { const e = new Error('Não autenticado.'); e.status = 401; throw e; }
  let decoded;
  try { decoded = await auth.verifyIdToken(m[1].trim()); }
  catch { const e = new Error('Sessão inválida ou expirada.'); e.status = 401; throw e; }
  const snap = await db.collection('allowlist').doc(decoded.uid).get();
  if (!snap.exists) { const e = new Error('Sua conta não tem acesso à área interna.'); e.status = 403; throw e; }
  return { uid: decoded.uid, email: decoded.email || null };
}
