// =====================================================================
// AYRSHARE — publicacao real nas redes sociais (Instagram, X, LinkedIn,
// TikTok, YouTube, Facebook, Threads, Bluesky, Pinterest, Reddit,
// Telegram, Google Business…).
//
// Modo conta unica (padrao VNMAX): a AYRSHARE_API_KEY ja esta vinculada as
// redes conectadas no painel do Ayrshare. Opcionalmente, AYRSHARE_PROFILE_KEY
// posta em um perfil especifico (multi-conta). A chave fica SO no servidor.
// Docs: https://www.ayrshare.com/docs
// =====================================================================
const BASE = 'https://api.ayrshare.com/api';

export function ayrshareConfigured() {
  return Boolean(process.env.AYRSHARE_API_KEY);
}

// Profile-Key padrao (opcional). Em conta unica, fica indefinido.
function defaultProfileKey() {
  return process.env.AYRSHARE_PROFILE_KEY || null;
}

function headers(profileKey) {
  const h = {
    Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const key = profileKey || defaultProfileKey();
  if (key) h['Profile-Key'] = key;
  return h;
}

async function call(path, { method = 'POST', body, profileKey } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers(profileKey),
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    // Falha de rede (DNS/conexao/timeout) — distingue de erro HTTP da Ayrshare.
    const cause = e?.cause?.code || e?.cause?.message || e?.message || 'rede';
    const err = new Error(`Ayrshare indisponível (rede): ${cause}`);
    err.status = 503;
    err.upstream = true;
    throw err;
  }
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || `HTTP ${res.status}`;
    const err = new Error(`Ayrshare ${res.status}: ${String(msg).slice(0, 300)}`);
    err.status = res.status;
    err.upstream = true;     // erro do provedor externo: nao repassar verbatim ao cliente
    err.data = data;
    throw err;
  }
  return data;
}

// Redes efetivamente conectadas (activeSocialAccounts) da conta/perfil.
export async function getConnectedAccounts(profileKey) {
  const data = await call('/user', { method: 'GET', profileKey });
  const active = Array.isArray(data.activeSocialAccounts) ? data.activeSocialAccounts : [];
  // displayNames: [{ platform, displayName, userImage, ... }]
  const display = Array.isArray(data.displayNames) ? data.displayNames : [];
  return { active, display, raw: data };
}

// Publica (ou agenda) em UMA plataforma. scheduleDate em ISO 8601 (UTC) agenda;
// ausente publica imediatamente. mediaUrls precisam ser URLs publicas.
export async function postOne({ platform, caption, mediaUrls, scheduleDate, profileKey, options }) {
  const body = {
    post: caption || '',
    platforms: [platform],
  };
  if (Array.isArray(mediaUrls) && mediaUrls.length) body.mediaUrls = mediaUrls;
  if (scheduleDate) body.scheduleDate = scheduleDate; // ISO UTC
  if (options && typeof options === 'object') Object.assign(body, options);

  const data = await call('/post', { body, profileKey });
  // Resposta: { status, id, postIds: [{ platform, id, postUrl, status }], errors? }
  const arr = Array.isArray(data.postIds) ? data.postIds : [];
  const entry = arr.find((p) => p.platform === platform) || arr[0] || null;
  const errs = Array.isArray(data.errors) ? data.errors : [];
  const errForPlat = errs.find((e) => e.platform === platform) || (errs.length ? errs[0] : null);
  return {
    id: data.id || entry?.id || null,            // id da requisicao (usado p/ delete)
    platformId: entry?.id || null,
    permalink: entry?.postUrl || null,
    status: entry?.status || data.status || (errForPlat ? 'error' : 'success'),
    error: errForPlat ? (errForPlat.message || JSON.stringify(errForPlat)) : null,
    raw: data,
  };
}

// Cancela/exclui um post (agendado ou publicado) pelo id da requisicao.
export async function deletePost(id, profileKey) {
  return call('/post', { method: 'DELETE', body: { id }, profileKey });
}

// Normaliza um permalink vindo do provedor: aceita SOMENTE http(s). Qualquer
// outro esquema (javascript:, data:, …) vira null — defesa contra XSS no portal.
export function safePermalink(u) {
  try { const url = new URL(String(u || '')); return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null; }
  catch { return null; }
}
