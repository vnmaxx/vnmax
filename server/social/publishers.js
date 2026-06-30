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

const PUBLISHERS = { twitter: publishTwitter, linkedin: publishLinkedin, telegram: publishTelegram };

export function canPublish(platform) { return Boolean(PUBLISHERS[platform]); }

export async function publishTo(platform, ctx) {
  const fn = PUBLISHERS[platform];
  if (!fn) throw fail(`Publicação automática não disponível para ${platform}.`, 400);
  return fn(ctx);
}
