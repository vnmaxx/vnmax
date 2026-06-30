// Backend da aba SOCIAL do portal interno: publicacao/agendamento real via
// Ayrshare + adaptacao por rede via NVIDIA. Estes endpoints sao PRIVILEGIADOS:
// exigem um ID token do Firebase de um usuario presente na allowlist (mesma
// allowlist do portal). A AYRSHARE_API_KEY e a NVIDIA_API_KEY ficam so aqui.
import { db, auth, admin } from './firebase-admin.js';
import { ayrshareConfigured, getConnectedAccounts, postOne, deletePost, safePermalink } from './social/ayrshare.js';
import { adaptContent } from './social/adapt.js';
import { PLATFORMS, PLATFORM_KEYS, isPlatform } from './social/platforms.js';

const COLLECTION = 'social_posts';

// Validacao best-effort de tipo de midia: so rejeita quando a extensao da URL e
// reconhecida E claramente incompativel com a rede (URLs sem extensao passam — a
// Ayrshare valida no fim). Evita falsos negativos com CDNs sem extensao.
const RE_VIDEO = /\.(mp4|mov|m4v|webm)(\?|#|$)/i;
const RE_IMAGE = /\.(jpe?g|png|gif|webp|bmp)(\?|#|$)/i;
function mediaTypeError(platform, mediaUrls) {
  const want = PLATFORMS[platform].mediaType;
  if (!want || want === 'any' || !mediaUrls.length) return null;
  const known = mediaUrls.filter((u) => RE_VIDEO.test(u) || RE_IMAGE.test(u));
  if (!known.length) return null; // nenhuma extensao reconhecivel -> deixa a Ayrshare decidir
  if (want === 'video' && !known.some((u) => RE_VIDEO.test(u))) return `${PLATFORMS[platform].label} exige vídeo (MP4).`;
  if (want === 'image' && !known.some((u) => RE_IMAGE.test(u))) return `${PLATFORMS[platform].label} exige imagem.`;
  return null;
}

// ---- Autenticacao: ID token do Firebase + allowlist ----
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

function platformsPublic() {
  return PLATFORM_KEYS.map((k) => ({ key: k, label: PLATFORMS[k].label, limit: PLATFORMS[k].limit, requiresMedia: PLATFORMS[k].requiresMedia, mediaType: PLATFORMS[k].mediaType }));
}

// GET status: o que esta configurado + redes conectadas (best-effort).
export async function handleStatus() {
  const out = {
    ayrshare: ayrshareConfigured(),
    nvidia: Boolean(process.env.NVIDIA_API_KEY),
    platforms: platformsPublic(),
    connected: [],
    connectError: null,
  };
  if (ayrshareConfigured()) {
    try {
      const { active, display } = await getConnectedAccounts();
      out.connected = active;
      out.displayNames = display;
    } catch (e) {
      console.warn('[social] status Ayrshare:', e.message);
      out.connectError = e.upstream ? 'Não foi possível consultar as redes conectadas agora.' : e.message;
    }
  }
  return out;
}

export async function handleAdapt(body, signal) {
  const { content, platforms, tone, link } = body || {};
  return adaptContent({ content, platforms, tone, link, signal });
}

// Publica/agenda em cada rede selecionada e grava 1 doc de campanha no Firestore.
export async function handlePublish(body, member) {
  if (!ayrshareConfigured()) { const e = new Error('Ayrshare não configurado no servidor (defina AYRSHARE_API_KEY).'); e.status = 503; throw e; }
  const content = String(body?.content || '').trim();
  const variants = (body && typeof body.variants === 'object' && body.variants) || {};
  const wanted = (body?.platforms || []).filter(isPlatform);
  if (!wanted.length) { const e = new Error('Selecione ao menos uma rede.'); e.status = 400; throw e; }

  const mediaUrls = Array.isArray(body?.mediaUrls)
    ? body.mediaUrls.map((u) => String(u || '').trim()).filter((u) => /^https:\/\/\S+$/i.test(u)).slice(0, 10)
    : [];

  // Agendamento: scheduleAt em ms (UTC). Precisa ser ao menos ~2 min no futuro.
  let scheduleAtMs = null, scheduleDate = null;
  if (body?.scheduleAt) {
    const ms = Number(body.scheduleAt);
    if (!Number.isFinite(ms)) { const e = new Error('Data de agendamento inválida.'); e.status = 400; throw e; }
    if (ms < Date.now() + 120000) { const e = new Error('O agendamento precisa ser pelo menos 2 minutos no futuro.'); e.status = 400; throw e; }
    scheduleAtMs = ms;
    scheduleDate = new Date(ms).toISOString();
  }

  // Caption por rede + validacao de midia obrigatoria (sem inventar nada).
  const targets = [];
  for (const platform of wanted) {
    const caption = String(variants[platform] || content || '').trim().slice(0, PLATFORMS[platform].limit);
    const t = { platform, caption, status: 'pendente', ayrId: null, permalink: null, error: null };
    const typeErr = mediaTypeError(platform, mediaUrls);
    if (!caption && !mediaUrls.length) { t.status = 'erro'; t.error = 'Sem texto nem mídia.'; }
    else if (PLATFORMS[platform].requiresMedia && !mediaUrls.length) { t.status = 'erro'; t.error = `${PLATFORMS[platform].label} exige imagem/vídeo (informe uma URL pública).`; }
    else if (typeErr) { t.status = 'erro'; t.error = typeErr; }
    targets.push(t);
  }

  // Publica cada rede valida.
  for (const t of targets) {
    if (t.status === 'erro') continue;
    try {
      const r = await postOne({ platform: t.platform, caption: t.caption, mediaUrls, scheduleDate });
      t.ayrId = r.id;
      t.permalink = safePermalink(r.permalink);     // so http(s); bloqueia javascript:/data:
      if (r.error) { t.status = 'erro'; t.error = r.error; }
      else t.status = scheduleAtMs ? 'agendado' : 'publicado';
    } catch (e) {
      t.status = 'erro';
      t.error = e.upstream ? 'Falha na rede social. Tente novamente.' : e.message;
    }
  }

  const okCount = targets.filter((t) => t.status === 'agendado' || t.status === 'publicado').length;
  const status = okCount === 0 ? 'erro' : okCount === targets.length ? (scheduleAtMs ? 'agendado' : 'publicado') : 'parcial';

  const doc = {
    content,
    tone: body?.tone || null,
    mediaUrls,
    scheduleAt: scheduleAtMs,
    status,
    targets,
    platforms: wanted,
    createdBy: member.uid,
    createdByEmail: member.email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  const ref = await db.collection(COLLECTION).add(doc);
  return { id: ref.id, status, targets };
}

// Cancela um post agendado: remove no Ayrshare e marca no Firestore. O status da
// campanha e DERIVADO do resultado real (nao assume sucesso) e o cancelamento e
// auditado. Apenas o dono (createdBy) pode cancelar.
export async function handleCancel(body, member) {
  if (!ayrshareConfigured()) { const e = new Error('Ayrshare não configurado.'); e.status = 503; throw e; }
  const id = String(body?.id || '').trim();
  if (!id) { const e = new Error('Informe o id da campanha.'); e.status = 400; throw e; }
  const ref = db.collection(COLLECTION).doc(id);
  const snap = await ref.get();
  if (!snap.exists) { const e = new Error('Campanha não encontrada.'); e.status = 404; throw e; }
  const data = snap.data();
  if (data.createdBy && member && data.createdBy !== member.uid) {
    const e = new Error('Sem permissão para cancelar esta campanha.'); e.status = 403; throw e;
  }
  const targets = Array.isArray(data.targets) ? data.targets : [];

  // Cancela apenas os AGENDADOS (nao mexe em ja publicados). Status por target
  // reflete o resultado: cancelado | falha_cancelamento.
  const cancelaveis = targets.filter((t) => t.ayrId && t.status === 'agendado');
  const seen = new Set();
  for (const t of cancelaveis) {
    if (seen.has(t.ayrId)) { t.status = 'cancelado'; continue; }
    seen.add(t.ayrId);
    try { await deletePost(t.ayrId); t.status = 'cancelado'; t.error = null; }
    catch (e) { t.status = 'falha_cancelamento'; t.error = e.upstream ? 'Falha ao cancelar na rede.' : e.message; }
  }

  const okN = cancelaveis.filter((t) => t.status === 'cancelado').length;
  if (cancelaveis.length === 0) { const e = new Error('Não há postagens agendadas para cancelar.'); e.status = 400; throw e; }
  const status = okN === cancelaveis.length ? 'cancelado' : (okN > 0 ? 'parcial' : 'erro');

  await ref.update({
    targets, status,
    cancelledBy: member ? member.uid : null,
    cancelledByEmail: member ? member.email : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Se nada foi cancelado de fato, propaga falha (operador nao confia em um
  // cancelamento que nao aconteceu).
  if (status === 'erro') { const e = new Error('Não foi possível cancelar no Ayrshare. Tente novamente.'); e.status = 502; throw e; }
  return { id, status, targets };
}
