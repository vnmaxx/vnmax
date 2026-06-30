// Adapta um conteudo base para cada rede social usando o MESMO endpoint NVIDIA
// (OpenAI-compatible) do assistente. O modelo recebe a voz da marca + as regras
// de cada rede e devolve um JSON { plataforma: texto }. O servidor ainda corta no
// limite de caracteres como rede de seguranca.
import { chatCompletion } from '../nvidia.js';
import { PLATFORMS, isPlatform } from './platforms.js';

const API_KEY = process.env.NVIDIA_API_KEY;
// Pode usar um modelo proprio p/ copy (NVIDIA_SOCIAL_MODEL); senao reusa o do chat.
const MODEL = process.env.NVIDIA_SOCIAL_MODEL || process.env.NVIDIA_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1.5';

const TONES = {
  profissional: 'profissional e confiante',
  inspirador: 'inspirador e motivacional',
  descontraido: 'descontraído e próximo',
  tecnico: 'técnico e objetivo',
  vendedor: 'persuasivo e orientado a conversão',
};

function brandContext() {
  return `Marca: VNMAX — ecossistema de tecnologia, inteligência artificial e inovação. Slogan: "Construindo o futuro através da tecnologia". Atua com IA e automação, software sob medida, sites e apps, dados e dashboards, cloud, segurança e marketing digital. Tom: claro antes de sofisticado, confiante sem exagero, humano e direto.`;
}

// Extrai o primeiro objeto JSON valido de um texto. Usa varredura de chaves
// BALANCEADA (respeitando strings/escapes), entao texto/chaves apos o objeto
// (ex.: ":}" num emoticon) nao corrompem o parse. Tenta o conteudo de ```...```
// primeiro e, em seguida, o texto cru.
function scanBalanced(s) {
  for (let i = s.indexOf('{'); i !== -1; i = s.indexOf('{', i + 1)) {
    let depth = 0, inStr = false, esc = false;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
      } else if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) { try { return JSON.parse(s.slice(i, j + 1)); } catch { break; } }
      }
    }
  }
  return null;
}
function extractJson(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fence && scanBalanced(fence[1])) || scanBalanced(text);
}

// Remove markdown residual e corta no limite da rede por CODE POINTS (nao quebra
// emojis/surrogates) reservando espaco para a reticencia, sem estourar o limite.
function clean(text, limit) {
  let s = String(text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\n)\s*#{1,6}\s+/g, '$1')
    .replace(/`{1,3}/g, '')
    .trim();
  if (limit) {
    const chars = Array.from(s);              // fatia por code points
    if (chars.length > limit) {
      let cut = chars.slice(0, limit - 1).join('');   // -1 reserva a reticencia
      const sp = cut.lastIndexOf(' ');
      if (sp > (limit - 1) * 0.6) cut = cut.slice(0, sp);
      s = cut.replace(/[\s,.;:!-]+$/u, '') + '…';
    }
  }
  return s;
}

// Valida e normaliza um link http(s); qualquer outra coisa vira ''.
function safeLink(u) {
  try { const url = new URL(String(u || '').trim()); return /^https?:$/.test(url.protocol) ? url.href : ''; }
  catch { return ''; }
}

// content: texto base; platforms: array de keys; tone: chave de TONES; link: opcional.
export async function adaptContent({ content, platforms, tone, link, signal }) {
  if (!API_KEY) { const e = new Error('NVIDIA_API_KEY não configurada no servidor.'); e.status = 503; throw e; }
  const base = String(content || '').trim();
  if (!base) { const e = new Error('Escreva o conteúdo base antes de adaptar.'); e.status = 400; throw e; }
  const wanted = (platforms || []).filter(isPlatform);
  if (!wanted.length) { const e = new Error('Selecione ao menos uma rede.'); e.status = 400; throw e; }

  const toneTxt = TONES[tone] || TONES.profissional;
  const linkOk = safeLink(link);
  const regras = wanted.map((k) => `- ${k} (${PLATFORMS[k].label}, limite ${PLATFORMS[k].limit} caracteres): ${PLATFORMS[k].style}`).join('\n');

  const sys = `Você é redator(a) sênior de social media da VNMAX. Adapta um conteúdo base para cada rede social, respeitando as regras e os limites de cada uma. ${brandContext()}
Tom desejado: ${toneTxt}.
Regras IMPORTANTES:
- Mantenha a mensagem central, mas REESCREVA de forma nativa para cada rede (não copie igual).
- Respeite RIGOROSAMENTE o limite de caracteres de cada rede.
- Não use formatação markdown (nada de **, #, crases). Texto puro, pronto para publicar.
- Não invente fatos, números, preços ou promessas que não estejam no conteúdo base.${linkOk ? `\n- Inclua o link quando fizer sentido: ${linkOk}` : ''}
- Responda SOMENTE com um objeto JSON, sem comentários, no formato: { ${wanted.map((k) => `"${k}": "texto"`).join(', ')} }`;

  const user = `Conteúdo base:\n"""${base.slice(0, 4000)}"""\n\nRedes e regras:\n${regras}\n\nGere o JSON com a versão adaptada para cada rede.`;

  const resp = await chatCompletion({
    apiKey: API_KEY, model: MODEL,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    // teto de tokens escala com o numero de redes (evita truncar o JSON).
    temperature: 0.6, maxTokens: Math.min(4000, 700 + wanted.length * 320), signal,
  });
  const raw = resp.choices?.[0]?.message?.content || '';
  const parsed = extractJson(raw);
  if (!parsed) { const e = new Error('A IA não retornou um JSON válido. Tente de novo.'); e.status = 502; throw e; }

  // Sinaliza as redes que o modelo nao adaptou (caem no conteudo base) em vez de
  // disfarcar de sucesso.
  const variants = {}; const missing = [];
  for (const k of wanted) {
    const v = parsed[k] || parsed[PLATFORMS[k].label] || '';
    if (!v) missing.push(k);
    variants[k] = clean(v || base, PLATFORMS[k].limit);
  }
  if (missing.length) console.warn('[social] adaptacao sem retorno para:', missing.join(', '));
  return { variants, model: MODEL, missing };
}
