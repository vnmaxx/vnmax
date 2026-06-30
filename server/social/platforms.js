// Catalogo das redes suportadas. `key` e o nome interno usado em todo o sistema
// (ex.: X = "twitter", Google Business = "gmb").
// limit: maximo de caracteres por post (limite pratico/seguro).
// requiresMedia: a rede exige imagem/video para publicar.
// style: orientacao de copy passada ao modelo na adaptacao por rede.
// auth: como se "conecta" a conta da rede:
//   'oauth'   -> fluxo OAuth real (precisa de credenciais no .env; ver connections.js)
//   'token'   -> conexao por token/credencial manual (ex.: Telegram bot, Bluesky app password)
//   'manual'  -> sem API publica viavel; publicacao continua semiautomatica (abrir+colar)
export const PLATFORMS = {
  instagram: { label: 'Instagram', limit: 2200, requiresMedia: true, mediaType: 'image|video', auth: 'oauth', api: true,
    style: 'Legenda envolvente e visual, com quebras de linha e poucos emojis. Bloco de 8 a 15 hashtags relevantes no final.' },
  twitter: { label: 'X (Twitter)', limit: 280, requiresMedia: false, mediaType: 'any', auth: 'oauth', api: true,
    style: 'Curtíssimo e direto, no máximo 280 caracteres. Um gancho forte, 1 a 2 hashtags. Sem enrolação.' },
  linkedin: { label: 'LinkedIn', limit: 3000, requiresMedia: false, mediaType: 'any', auth: 'oauth', api: true,
    style: 'Tom profissional e orientado a valor de negócio. Primeira linha é um gancho. Parágrafos curtos. 3 a 5 hashtags ao final.' },
  facebook: { label: 'Facebook', limit: 5000, requiresMedia: false, mediaType: 'any', auth: 'oauth', api: true,
    style: 'Conversacional e acessível, com uma chamada para ação clara. Poucas hashtags.' },
  tiktok: { label: 'TikTok', limit: 2000, requiresMedia: true, mediaType: 'video', auth: 'oauth',
    style: 'Legenda curta e com energia, linguagem de tendência. Gancho de 1 linha + 3 a 6 hashtags virais.' },
  youtube: { label: 'YouTube', limit: 4900, requiresMedia: true, mediaType: 'video', auth: 'oauth',
    style: 'Descrição para Shorts: primeira linha forte como título, depois contexto. Inclua palavras-chave e #Shorts.' },
  threads: { label: 'Threads', limit: 500, requiresMedia: false, mediaType: 'any', auth: 'oauth',
    style: 'Casual e direto, no máximo 500 caracteres. Tom de conversa, no máximo 1 a 2 hashtags.' },
  bluesky: { label: 'Bluesky', limit: 300, requiresMedia: false, mediaType: 'any', auth: 'token',
    style: 'Muito curto, no máximo 300 caracteres. Direto e autêntico, evite hashtags em excesso.' },
  pinterest: { label: 'Pinterest', limit: 500, requiresMedia: true, mediaType: 'image', auth: 'oauth',
    style: 'Descrição rica em palavras-chave de busca, inspiradora e útil. Frase de valor + termos pesquisáveis.' },
  reddit: { label: 'Reddit', limit: 4000, requiresMedia: false, mediaType: 'any', auth: 'oauth',
    style: 'Autêntico e sem cara de propaganda. Texto que agrega valor à comunidade. Nada de hashtags.' },
  telegram: { label: 'Telegram', limit: 4000, requiresMedia: false, mediaType: 'any', auth: 'token', api: true,
    style: 'Mensagem clara e bem formatada, pode ser um pouco mais longa. Chamada para ação ao final.' },
  gmb: { label: 'Google Business', limit: 1500, requiresMedia: false, mediaType: 'any', auth: 'oauth',
    style: 'Tom informativo e local, foco no que o cliente ganha. Inclua uma chamada para ação objetiva.' },
};

export const PLATFORM_KEYS = Object.keys(PLATFORMS);

export const authMode = (k) => (PLATFORMS[k] && PLATFORMS[k].auth) || 'manual';

// Rede tem publicacao automatica via API (usando o token conectado).
export const apiCapable = (k) => Boolean(PLATFORMS[k] && PLATFORMS[k].api);

export function isPlatform(k) {
  return Object.prototype.hasOwnProperty.call(PLATFORMS, k);
}
