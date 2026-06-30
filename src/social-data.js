// Camada de dados da aba Social (portal interno).
// - Chamadas privilegiadas ao servidor (Ayrshare + adaptacao NVIDIA) autenticadas
//   com o ID token do Firebase do usuario logado (allowlist verificada no servidor).
// - Leitura da agenda (social_posts) direto do Firestore, sob a mesma allowlist
//   (como o CRM faz com os leads). Escrita so pelo servidor (Admin SDK).
import { getFirestore, collection, getDocs, query, orderBy, limit as qlimit } from 'firebase/firestore';
import { app, auth, isFirebaseConfigured } from './firebase.js';

const API_BASE = (import.meta.env.VITE_CHAT_API_URL || '').replace(/\/+$/, '');
const APP_TOKEN = import.meta.env.VITE_CHAT_APP_TOKEN || '';

let db = null;
if (isFirebaseConfigured && app) db = getFirestore(app);

async function authHeaders() {
  const user = auth && auth.currentUser;
  if (!user) throw new Error('Sessão expirada. Entre novamente.');
  const token = await user.getIdToken();
  const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  if (APP_TOKEN) h['X-VNMAX-Token'] = APP_TOKEN;
  return h;
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}/api/social/${path}`, {
    method, headers: await authHeaders(), body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export const socialStatus = () => api('status');
export const adaptPosts = (payload) => api('adapt', { method: 'POST', body: payload });
// Fluxo self-hosted: rascunho -> aguardando -> aprovado/agendado -> publicado.
export const saveCampaign = (payload) => api('save', { method: 'POST', body: payload });
export const submitCampaign = (id) => api('submit', { method: 'POST', body: { id } });
export const approveCampaign = (id) => api('approve', { method: 'POST', body: { id } });
export const rejectCampaign = (id, reason) => api('reject', { method: 'POST', body: { id, reason } });
export const markPosted = (id, platform, permalink, undo) => api('markposted', { method: 'POST', body: { id, platform, permalink, undo } });
export const deleteCampaign = (id) => api('delete', { method: 'POST', body: { id } });

// Agenda: le social_posts do Firestore (allowlist). Fallback sem indice composto.
export async function getSocialPosts() {
  if (!db) throw new Error('Firebase não configurado.');
  const toMs = (ts) => (ts && ts.toDate ? ts.toDate().getTime() : ts && ts.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : 0);
  try {
    const snap = await getDocs(query(collection(db, 'social_posts'), orderBy('createdAt', 'desc'), qlimit(100)));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    // Erros de permissao/sessao sobem (allowlist respeitada); qualquer problema de
    // indice degrada para o sort em memoria.
    if (e && (e.code === 'permission-denied' || e.code === 'unauthenticated')) throw e;
    const snap = await getDocs(collection(db, 'social_posts'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => toMs(b.createdAt) - toMs(a.createdAt));
  }
}
