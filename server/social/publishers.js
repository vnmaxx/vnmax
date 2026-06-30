// Publicacao AUTOMATICA via API das redes que suportam (usando o token da conta
// conectada — ver connections.js). Apenas texto (sem upload de midia) nesta versao:
// X (Twitter), LinkedIn e Telegram. As demais seguem semiautomaticas (abrir+colar).
//
// Cada publisher recebe { caption, mediaUrls, conn } onde `conn` e o doc da conexao
// (com accessToken/accountId). Retorna { permalink } em caso de sucesso ou lanca
// Error com .status. Erros de token expirado pedem reconexao.

function fail(msg, status = 502) { const e = new Error(msg); e.status = status; return e; }

// --- X (Twitter) API v2: POST /2/tweets (texto). ---
async function publishTwitter({ caption, conn }) {
  if (!conn?.accessToken) throw fail('Conta de X não conectada.');
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: (caption || '').slice(0, 280) }),
  });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw fail('Token do X expirou — reconecte a conta.', 401);
  if (!res.ok || !j?.data?.id) throw fail('Falha ao publicar no X: ' + (j?.detail || j?.title || res.status));
  const handle = (conn.accountName || '').replace(/^@/, '') || 'i';
  return { permalink: `https://twitter.com/${handle}/status/${j.data.id}` };
}

// --- LinkedIn: POST /v2/ugcPosts (share de texto do membro). ---
async function publishLinkedin({ caption, conn }) {
  if (!conn?.accessToken) throw fail('Conta de LinkedIn não conectada.');
  if (!conn?.accountId) throw fail('Conta de LinkedIn sem identificador — reconecte.');
  const author = `urn:li:person:${conn.accountId}`;
  const body = {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: (caption || '').slice(0, 3000) },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };
  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${conn.accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw fail('Token do LinkedIn expirou — reconecte a conta.', 401);
  const j = await res.json().catch(() => ({}));
  const id = j?.id || res.headers.get('x-restli-id');
  if (!res.ok || !id) throw fail('Falha ao publicar no LinkedIn: ' + (j?.message || res.status));
  return { permalink: `https://www.linkedin.com/feed/update/${id}` };
}

// --- Telegram: Bot API sendMessage. conn.accessToken = bot token; accountName =
//     @canal ou chat_id de destino. ---
async function publishTelegram({ caption, conn }) {
  if (!conn?.accessToken) throw fail('Bot do Telegram não configurado (token ausente).');
  const chatId = (conn.accountName || '').trim();
  if (!chatId) throw fail('Defina o @canal ou chat_id de destino na conexão do Telegram.');
  const res = await fetch(`https://api.telegram.org/bot${conn.accessToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: (caption || '').slice(0, 4000), disable_web_page_preview: false }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j?.ok) throw fail('Falha ao publicar no Telegram: ' + (j?.description || res.status));
  const m = j.result;
  const chat = m?.chat?.username;
  const permalink = chat && m?.message_id ? `https://t.me/${chat}/${m.message_id}` : null;
  return { permalink };
}

// --- Graph API (Facebook/Instagram) ---
const GRAPH = 'https://graph.facebook.com/v19.0';
const isVideo = (u) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(String(u || ''));

// Descobre a primeira Page do usuario e o token dela (necessario para publicar).
async function firstPage(userToken) {
  const res = await fetch(`${GRAPH}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`);
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) throw fail('Token do Facebook expirou — reconecte a conta.', 401);
  const page = j?.data?.[0];
  if (!page?.id || !page?.access_token) throw fail('Nenhuma Página do Facebook encontrada para esta conta (a publicação exige uma Página com permissões pages_manage_posts).');
  return page;
}

// --- Facebook: publica na primeira Página (texto, ou foto/video por URL). ---
async function publishFacebook({ caption, mediaUrls, conn }) {
  if (!conn?.accessToken) throw fail('Conta de Facebook não conectada.');
  const page = await firstPage(conn.accessToken);
  const media = (mediaUrls || [])[0];
  let endpoint, params;
  if (media && !isVideo(media)) {
    endpoint = `${GRAPH}/${page.id}/photos`;
    params = new URLSearchParams({ url: media, caption: caption || '', access_token: page.access_token });
  } else if (media && isVideo(media)) {
    endpoint = `${GRAPH}/${page.id}/videos`;
    params = new URLSearchParams({ file_url: media, description: caption || '', access_token: page.access_token });
  } else {
    endpoint = `${GRAPH}/${page.id}/feed`;
    params = new URLSearchParams({ message: caption || '', access_token: page.access_token });
  }
  const res = await fetch(endpoint, { method: 'POST', body: params });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !(j?.id || j?.post_id)) throw fail('Falha ao publicar no Facebook: ' + (j?.error?.message || res.status));
  const id = j.post_id || j.id;
  return { permalink: `https://www.facebook.com/${id}` };
}

// --- Instagram (conta Business via Página): cria container e publica. Exige midia. ---
async function publishInstagram({ caption, mediaUrls, conn }) {
  if (!conn?.accessToken) throw fail('Conta de Instagram não conectada.');
  const media = (mediaUrls || [])[0];
  if (!media) throw fail('Instagram exige uma imagem ou vídeo (informe a Mídia na publicação).', 400);
  const page = await firstPage(conn.accessToken);
  const igId = page.instagram_business_account?.id;
  if (!igId) throw fail('A Página não tem uma conta Instagram Business vinculada.');
  const token = page.access_token;

  // 1) cria o container de midia
  const cParams = new URLSearchParams({ caption: caption || '', access_token: token });
  if (isVideo(media)) { cParams.set('media_type', 'REELS'); cParams.set('video_url', media); }
  else cParams.set('image_url', media);
  const cRes = await fetch(`${GRAPH}/${igId}/media`, { method: 'POST', body: cParams });
  const cJson = await cRes.json().catch(() => ({}));
  if (!cRes.ok || !cJson?.id) throw fail('Falha ao preparar a mídia no Instagram: ' + (cJson?.error?.message || cRes.status));

  // 2) publica o container
  const pRes = await fetch(`${GRAPH}/${igId}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: cJson.id, access_token: token }) });
  const pJson = await pRes.json().catch(() => ({}));
  if (!pRes.ok || !pJson?.id) throw fail('Falha ao publicar no Instagram: ' + (pJson?.error?.message || pRes.status) + (isVideo(media) ? ' (vídeo pode levar alguns segundos para processar — tente de novo)' : ''));

  // 3) busca o permalink
  let permalink = null;
  try {
    const lRes = await fetch(`${GRAPH}/${pJson.id}?fields=permalink&access_token=${encodeURIComponent(token)}`);
    const lJson = await lRes.json().catch(() => ({}));
    permalink = lJson?.permalink || null;
  } catch {}
  return { permalink };
}

const PUBLISHERS = { twitter: publishTwitter, linkedin: publishLinkedin, telegram: publishTelegram, facebook: publishFacebook, instagram: publishInstagram };

export function canPublish(platform) { return Boolean(PUBLISHERS[platform]); }

export async function publishTo(platform, ctx) {
  const fn = PUBLISHERS[platform];
  if (!fn) throw fail(`Publicação automática não disponível para ${platform}.`, 400);
  return fn(ctx);
}
