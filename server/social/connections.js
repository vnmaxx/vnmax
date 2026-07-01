// Registro de CONTAS conectadas das redes sociais (por cliente) + fluxo OAuth real.
//
// Modelo: cada conta vinculada vira um doc em `social_connections`:
//   { platform, clienteId, clienteNome, accountName, accountId, status, authMode,
//     accessToken, refreshToken, expiresAt, scope, connectedBy, ... }
// Tokens NUNCA voltam ao cliente — `publicConnection()` os remove.
//
// OAuth real: cada rede precisa de um app aprovado e das credenciais no .env do
// servidor (OAUTH_<REDE>_CLIENT_ID / _CLIENT_SECRET). O redirect registrado no app
// de cada rede deve ser  ${PUBLIC_API_URL}/api/social/oauth/callback . Redes sem
// credenciais configuradas aparecem como "indisponível" e a publicação segue
// semiautomática (abrir + colar). Redes `auth:'token'` (Telegram, Bluesky) conectam
// por credencial manual; `auth:'manual'` apenas registram o @ da conta.
import { randomBytes, createHash } from 'node:crypto';
import { db, admin } from '../firebase-admin.js';
import { PLATFORMS, isPlatform, authMode, apiCapable } from './platforms.js';

const CONNECTIONS = 'social_connections';
const STATES = 'social_oauth_states';   // estados pendentes do fluxo OAuth (curta duracao)

const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || '').replace(/\/+$/, '');
const redirectUri = () => `${PUBLIC_API_URL}/api/social/oauth/callback`;

// Endpoints OAuth2 (authorization code) de cada rede. clientId/secret/scope vêm do
// .env. `usesPkce` para redes que exigem PKCE (X, TikTok). `auth` (Basic) para a
// troca de token quando a rede exige client_secret no header.
const PROVIDERS = {
  twitter: { authorize: 'https://twitter.com/i/oauth2/authorize', token: 'https://api.twitter.com/2/oauth2/token', scope: 'tweet.read tweet.write users.read offline.access', usesPkce: true, basicAuth: true,
    me: { url: 'https://api.twitter.com/2/users/me', name: (j) => j?.data?.username && '@' + j.data.username, id: (j) => j?.data?.id } },
  linkedin: { authorize: 'https://www.linkedin.com/oauth/v2/authorization', token: 'https://www.linkedin.com/oauth/v2/accessToken', scope: 'openid profile w_member_social',
    me: { url: 'https://api.linkedin.com/v2/userinfo', name: (j) => j?.name, id: (j) => j?.sub } },
  facebook: { authorize: 'https://www.facebook.com/v19.0/dialog/oauth', token: 'https://graph.facebook.com/v19.0/oauth/access_token', scope: 'public_profile,pages_manage_posts,pages_read_engagement',
    me: { url: 'https://graph.facebook.com/v19.0/me', name: (j) => j?.name, id: (j) => j?.id } },
  instagram: { authorize: 'https://www.facebook.com/v19.0/dialog/oauth', token: 'https://graph.facebook.com/v19.0/oauth/access_token', scope: 'instagram_basic,instagram_content_publish,pages_show_list',
    me: { url: 'https://graph.facebook.com/v19.0/me', name: (j) => j?.name, id: (j) => j?.id } },
  threads: { authorize: 'https://threads.net/oauth/authorize', token: 'https://graph.threads.net/oauth/access_token', scope: 'threads_basic,threads_content_publish',
    me: { url: 'https://graph.threads.net/v1.0/me?fields=username', name: (j) => j?.username && '@' + j.username, id: (j) => j?.id } },
  reddit: { authorize: 'https://www.reddit.com/api/v1/authorize', token: 'https://www.reddit.com/api/v1/access_token', scope: 'identity submit', duration: 'permanent', basicAuth: true,
    me: { url: 'https://oauth.reddit.com/api/v1/me', name: (j) => j?.name && 'u/' + j.name, id: (j) => j?.id } },
  pinterest: { authorize: 'https://www.pinterest.com/oauth/', token: 'https://api.pinterest.com/v5/oauth/token', scope: 'pins:write,boards:read,user_accounts:read', basicAuth: true,
    me: { url: 'https://api.pinterest.com/v5/user_account', name: (j) => j?.username && '@' + j.username, id: (j) => j?.username } },
  tiktok: { authorize: 'https://www.tiktok.com/v2/auth/authorize/', token: 'https://open.tiktokapis.com/v2/oauth/token/', scope: 'user.info.basic,video.publish', usesPkce: true, clientKeyParam: 'client_key',
    me: { url: 'https://open.tiktokapis.com/v2/user/info/?fields=display_name', name: (j) => j?.data?.user?.display_name, id: (j) => j?.data?.user?.open_id } },
  youtube: { authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'https://www.googleapis.com/auth/youtube.upload', extraAuth: { access_type: 'offline', prompt: 'consent' },
    me: { url: 'https://www.googleapis.com/oauth2/v2/userinfo', name: (j) => j?.email, id: (j) => j?.id } },
  gmb: { authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'https://www.googleapis.com/auth/business.manage', extraAuth: { access_type: 'offline', prompt: 'consent' },
    me: { url: 'https://www.googleapis.com/oauth2/v2/userinfo', name: (j) => j?.email, id: (j) => j?.id } },
};

const ENV = (platform) => ({
  clientId: process.env[`OAUTH_${platform.toUpperCase()}_CLIENT_ID`] || '',
  clientSecret: process.env[`OAUTH_${platform.toUpperCase()}_CLIENT_SECRET`] || '',
});

// Uma rede esta "disponivel para conectar" se: OAuth com credenciais+PUBLIC_API_URL,
// ou token/manual (sempre disponiveis).
export function platformConnectable(platform) {
  const mode = authMode(platform);
  if (mode === 'oauth') {
    const p = PROVIDERS[platform]; const { clientId, clientSecret } = ENV(platform);
    return Boolean(p && clientId && clientSecret && PUBLIC_API_URL);
  }
  return mode === 'token' || mode === 'manual';
}

// Remove segredos antes de enviar ao cliente.
function publicConnection(id, d) {
  return {
    id, platform: d.platform, clienteId: d.clienteId || null, clienteNome: d.clienteNome || null,
    accountName: d.accountName || null, accountId: d.accountId || null,
    status: d.status || 'connected', authMode: d.authMode || authMode(d.platform),
    connectedByEmail: d.connectedByEmail || null,
    expiresAt: d.expiresAt || null,
    createdAt: d.createdAt || null, updatedAt: d.updatedAt || null,
  };
}

// id deterministico por (rede, cliente): garante 1 conta por rede por cliente.
function connKey(platform, clienteId) {
  return `${platform}__${clienteId || 'vnmax'}`;
}

export async function listConnections(clienteId) {
  let q = db.collection(CONNECTIONS);
  if (clienteId !== undefined) q = q.where('clienteId', '==', clienteId || null);
  const snap = await q.get();
  return snap.docs.map((s) => publicConnection(s.id, s.data()));
}

// Catalogo de redes + se sao conectaveis (para a UI de "Contas").
export function connectableCatalog() {
  return Object.keys(PLATFORMS).map((k) => ({
    key: k, label: PLATFORMS[k].label, authMode: authMode(k), connectable: platformConnectable(k), api: apiCapable(k),
  }));
}

async function upsertConnection(platform, clienteId, clienteNome, fields, member) {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const ref = db.collection(CONNECTIONS).doc(connKey(platform, clienteId));
  const snap = await ref.get();
  const base = snap.exists ? {} : { createdAt: now, connectedBy: member.uid, connectedByEmail: member.email };
  await ref.set({
    platform, clienteId: clienteId || null, clienteNome: clienteNome || null,
    ...fields, ...base, updatedAt: now,
  }, { merge: true });
  return { id: ref.id, ...publicConnection(ref.id, { platform, clienteId, clienteNome, ...fields }) };
}

// Conexao manual/por token (Telegram bot token, Bluesky app password, ou apenas o @
// da conta para redes 'manual'). O segredo (se houver) fica no campo accessToken.
export async function handleConnectManual(body, member) {
  const platform = String(body?.platform || '');
  if (!isPlatform(platform)) { const e = new Error('Rede inválida.'); e.status = 400; throw e; }
  const accountName = String(body?.accountName || '').trim().slice(0, 120);
  if (!accountName) { const e = new Error('Informe o nome/@ da conta.'); e.status = 400; throw e; }
  const token = body?.token != null ? String(body.token).trim().slice(0, 4000) : '';
  const fields = {
    accountName, accountId: accountName,
    status: token ? 'connected' : 'manual', authMode: authMode(platform),
    accessToken: token || null,
  };
  return upsertConnection(platform, body?.clienteId || null, body?.clienteNome || null, fields, member);
}

export async function handleDisconnect(body, member) {
  const platform = String(body?.platform || '');
  if (!isPlatform(platform)) { const e = new Error('Rede inválida.'); e.status = 400; throw e; }
  await db.collection(CONNECTIONS).doc(connKey(platform, body?.clienteId || null)).delete();
  return { ok: true };
}

/* ---------------- Fluxo OAuth (authorization code) ---------------- */

function b64url(buf) { return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }

// Inicia o OAuth: gera state (+PKCE quando preciso), grava o pendente e devolve a URL
// de autorizacao para o cliente abrir num popup.
export async function handleConnectStart(body, member) {
  const platform = String(body?.platform || '');
  if (!isPlatform(platform)) { const e = new Error('Rede inválida.'); e.status = 400; throw e; }
  if (authMode(platform) !== 'oauth') { const e = new Error('Esta rede conecta por token/manual, não por OAuth.'); e.status = 400; throw e; }
  const p = PROVIDERS[platform]; const { clientId, clientSecret } = ENV(platform);
  if (!p || !clientId || !clientSecret) { const e = new Error(`OAuth de ${PLATFORMS[platform].label} não configurado no servidor (defina OAUTH_${platform.toUpperCase()}_CLIENT_ID/_SECRET).`); e.status = 503; throw e; }
  if (!PUBLIC_API_URL) { const e = new Error('PUBLIC_API_URL não definido no servidor (necessário para o redirect do OAuth).'); e.status = 503; throw e; }

  const state = b64url(randomBytes(24));
  let codeVerifier = null, codeChallenge = null;
  if (p.usesPkce) {
    codeVerifier = b64url(randomBytes(32));
    codeChallenge = b64url(createHash('sha256').update(codeVerifier).digest());
  }
  const now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection(STATES).doc(state).set({
    platform, clienteId: body?.clienteId || null, clienteNome: body?.clienteNome || null,
    codeVerifier, uid: member.uid, email: member.email, createdAt: now,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    [p.clientKeyParam || 'client_id']: clientId,
    redirect_uri: redirectUri(),
    scope: p.scope,
    state,
    ...(p.duration ? { duration: p.duration } : {}),
    ...(p.extraAuth || {}),
  });
  if (codeChallenge) { params.set('code_challenge', codeChallenge); params.set('code_challenge_method', 'S256'); }
  return { authorizeUrl: `${p.authorize}?${params.toString()}` };
}

// Callback do OAuth: troca o code por token, descobre o nome da conta e grava a conexao.
// Retorna HTML que fecha o popup e avisa a janela principal.
export async function handleOAuthCallback(query) {
  const state = String(query.state || '');
  const code = String(query.code || '');
  const err = query.error ? String(query.error) : '';
  const finish = (ok, message) => oauthClosePage(ok, message);
  if (err) return finish(false, `Autorização negada: ${err}`);
  if (!state || !code) return finish(false, 'Resposta OAuth incompleta.');

  const sref = db.collection(STATES).doc(state);
  const ssnap = await sref.get();
  if (!ssnap.exists) return finish(false, 'Sessão OAuth expirada. Tente conectar de novo.');
  const st = ssnap.data();
  await sref.delete().catch(() => {});
  const platform = st.platform;
  const p = PROVIDERS[platform]; const { clientId, clientSecret } = ENV(platform);
  if (!p) return finish(false, 'Rede não suportada.');

  try {
    const form = new URLSearchParams({
      grant_type: 'authorization_code', code, redirect_uri: redirectUri(),
      [p.clientKeyParam || 'client_id']: clientId,
    });
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' };
    if (p.basicAuth) headers.Authorization = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    else form.set('client_secret', clientSecret);
    if (st.codeVerifier) form.set('code_verifier', st.codeVerifier);
    if (platform === 'reddit') headers['User-Agent'] = 'vnmax-os/1.0';

    const tres = await fetch(p.token, { method: 'POST', headers, body: form.toString() });
    const tjson = await tres.json().catch(() => ({}));
    if (!tres.ok || !(tjson.access_token)) {
      console.error('[oauth] troca de token falhou:', platform, tjson.error || tres.status);
      return finish(false, 'Falha ao obter o token de acesso da rede.');
    }
    const accessToken = tjson.access_token;
    const refreshToken = tjson.refresh_token || null;
    const expiresAt = tjson.expires_in ? Date.now() + Number(tjson.expires_in) * 1000 : null;

    // Descobre o nome da conta (best-effort).
    let accountName = null, accountId = null;
    try {
      const mh = { Authorization: `Bearer ${accessToken}` };
      if (platform === 'reddit') mh['User-Agent'] = 'vnmax-os/1.0';
      const mres = await fetch(p.me.url, { headers: mh });
      const mjson = await mres.json().catch(() => ({}));
      accountName = p.me.name(mjson) || null;
      accountId = p.me.id(mjson) || null;
    } catch {}

    const now = admin.firestore.FieldValue.serverTimestamp();
    await db.collection(CONNECTIONS).doc(connKey(platform, st.clienteId)).set({
      platform, clienteId: st.clienteId || null, clienteNome: st.clienteNome || null,
      accountName: accountName || PLATFORMS[platform].label, accountId,
      status: 'connected', authMode: 'oauth',
      accessToken, refreshToken, expiresAt, scope: p.scope,
      connectedBy: st.uid, connectedByEmail: st.email,
      createdAt: now, updatedAt: now,
    }, { merge: true });

    return finish(true, `Conta de ${PLATFORMS[platform].label} conectada${accountName ? ' (' + accountName + ')' : ''}.`);
  } catch (e) {
    console.error('[oauth] callback erro:', platform, e.message);
    return finish(false, 'Erro ao concluir a conexão.');
  }
}

// Pagina HTML minima que fecha o popup e notifica o opener.
function oauthClosePage(ok, message) {
  const safe = String(message || '').replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>VNMAX · Conectar conta</title>
<style>body{margin:0;background:#070707;color:#eee;font:15px/1.5 system-ui,sans-serif;display:grid;place-items:center;height:100vh}
.box{max-width:420px;text-align:center;padding:24px}.ok{color:#36d399}.err{color:#ff6b6b}</style></head>
<body><div class="box"><h2 class="${ok ? 'ok' : 'err'}">${ok ? 'Conta conectada' : 'Não foi possível conectar'}</h2>
<p>${safe}</p><p style="color:#888">Você pode fechar esta janela.</p></div>
<script>try{if(window.opener){window.opener.postMessage({type:'vnmax-oauth',ok:${ok ? 'true' : 'false'}},'*');}}catch(e){}setTimeout(function(){window.close();},1500);</script>
</body></html>`;
}

// Helper para os targets: retorna a conexao (com token) de uma rede/cliente, ou null.
export async function getConnection(platform, clienteId) {
  const snap = await db.collection(CONNECTIONS).doc(connKey(platform, clienteId || null)).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}
