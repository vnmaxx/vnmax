// Assistente VNMAX — backend de chat sobre o NVIDIA NIM.
// Recebe mensagens do widget do site, chama o modelo (OpenAI-compatible) com a
// ferramenta de agendamento e devolve a resposta. A chave da NVIDIA fica APENAS
// aqui (no .env do servidor), nunca no frontend.
import { createServer } from 'node:http';
import { chatCompletion } from './nvidia.js';
import { tools, runTool } from './tools.js';
import { buildSystemPrompt } from './prompt.js';
import { saveLead, validarContato } from './leads.js';

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.NVIDIA_API_KEY;
const MODEL = process.env.NVIDIA_MODEL || 'nvidia/llama-3.3-nemotron-super-49b-v1.5';
const TEMPERATURE = Number(process.env.TEMPERATURE || 0.4);
const MAX_MESSAGES = Number(process.env.MAX_MESSAGES || 12);
const MAX_CHARS = Number(process.env.MAX_CHARS || 4000);
const MAX_TOOL_ROUNDS = Number(process.env.MAX_TOOL_ROUNDS || 3);
// CORS: fail-closed. Sem ALLOWED_ORIGINS, nenhuma origem cross-site e aceita.
// Use '*' apenas para teste local.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ALLOW_ANY = ALLOWED_ORIGINS.includes('*');
// Token opcional do app (defesa em profundidade contra abuso por scripts).
const APP_TOKEN = process.env.APP_TOKEN || '';
// So confie em X-Forwarded-For atras de um proxy reverso confiavel.
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';

if (!API_KEY) {
  console.error('[fatal] NVIDIA_API_KEY não definida. Configure o .env do servidor.');
  process.exit(1);
}
if (!ALLOWED_ORIGINS.length) {
  console.warn('[aviso] ALLOWED_ORIGINS vazio — todas as requisicoes cross-origin de navegador serao bloqueadas. Defina o(s) dominio(s) do site.');
}

// ---- rate limit simples por IP (janela deslizante) ----
const RATE_MAX = Number(process.env.RATE_MAX || 20);
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS || 60_000);
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE_WINDOW_MS)) hits.delete(k);
  return arr.length > RATE_MAX;
}

function clientIp(req) {
  if (TRUST_PROXY) {
    const xff = (req.headers['x-forwarded-for'] || '').split(',').map((s) => s.trim()).filter(Boolean);
    if (xff.length) return xff[xff.length - 1]; // hop visto pelo proxy confiavel
  }
  return req.socket.remoteAddress || 'unknown';
}

function corsOrigin(reqOrigin) {
  if (ALLOW_ANY) return reqOrigin || '*';
  return reqOrigin && ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : '';
}
function setCors(res, origin) {
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-VNMAX-Token');
  res.setHeader('Access-Control-Max-Age', '86400');
}
function json(res, status, obj, origin) {
  setCors(res, origin);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req, limit = 32_768) {
  return new Promise((resolve, reject) => {
    let data = '', size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new Error('payload muito grande')); req.destroy(); } else data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const out = [];
  for (const m of raw) {
    if (!m || typeof m.content !== 'string') continue;
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const content = m.content.trim().slice(0, MAX_CHARS);
    if (content) out.push({ role, content });
  }
  return out.slice(-MAX_MESSAGES);
}

// Filtro de saida (defesa em profundidade): bloqueia respostas que pareçam vazar
// o system prompt ou a stack/modelo. Marcadores derivados do proprio prompt.
const LEAK_MARKERS = [
  /assistente virtual oficial da vnmax/i,
  /\bSOBRE A VNMAX\b/,
  /REGRAS DA FERRAMENTA/i,
  /AGENDAMENTO E CONTATO \(ferramenta\)/i,
  /ESCOPO E LIMITES/i,
  /SEGURAN[ÇC]A \(cr[íi]tico\)/i,
  /nemotron/i,
  /system prompt/i,
  /prompt do sistema/i,
  /instru[çc][õo]es de sistema/i,
];
function filtrarSaida(text) {
  for (const re of LEAK_MARKERS) {
    if (re.test(text)) {
      console.warn('[chat] saida bloqueada pelo filtro (possivel vazamento de instrucoes/stack).');
      return 'Sobre esse ponto específico, prefiro confirmar com a equipe da VNMAX para te passar a informação correta. Posso registrar seu contato (nome + WhatsApp ou e-mail) ou você pode escrever para vnmax6@gmail.com.';
    }
  }
  return text;
}

async function handleChat(req, res, origin, ip) {
  let body;
  try { body = JSON.parse(await readBody(req) || '{}'); }
  catch { return json(res, 400, { error: 'JSON inválido.' }, origin); }

  const messages = sanitizeMessages(body.messages);
  if (!messages || !messages.length) return json(res, 400, { error: 'Envie ao menos uma mensagem.' }, origin);

  const convo = [{ role: 'system', content: buildSystemPrompt() }, ...messages];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.REQUEST_TIMEOUT_MS || 60_000));

  try {
    let resp = await chatCompletion({ apiKey: API_KEY, model: MODEL, messages: convo, tools, temperature: TEMPERATURE, signal: controller.signal });
    let msg = resp.choices?.[0]?.message || {};
    let registered = false;

    // Loop de tool-calling limitado. Em cada rodada executa as ferramentas e
    // chama o modelo de novo; na ultima rodada omite as tools para forcar texto.
    for (let round = 0; round < MAX_TOOL_ROUNDS && Array.isArray(msg.tool_calls) && msg.tool_calls.length; round++) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        const result = await runTool(tc.function?.name, args, { ip, origin });
        if (result.registered) registered = true;
        convo.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      const lastRound = round === MAX_TOOL_ROUNDS - 1;
      resp = await chatCompletion({ apiKey: API_KEY, model: MODEL, messages: convo, tools: lastRound ? undefined : tools, temperature: TEMPERATURE, signal: controller.signal });
      msg = resp.choices?.[0]?.message || {};
    }

    if (resp.choices?.[0]?.finish_reason === 'length') console.warn('[chat] resposta truncada por max_tokens.');

    let reply = (msg.content || '').trim() || 'Desculpe, não consegui responder agora. Pode tentar de novo?';
    reply = filtrarSaida(reply);
    return json(res, 200, { reply, registered }, origin);
  } catch (e) {
    const aborted = e.name === 'AbortError';
    console.error('[chat] erro:', e.message);
    return json(res, aborted ? 504 : 502, { error: aborted ? 'O assistente demorou para responder. Tente novamente.' : 'Falha ao falar com o assistente. Tente novamente em instantes.' }, origin);
  } finally {
    clearTimeout(timeout);
  }
}

async function handleContact(req, res, origin, ip) {
  let body;
  try { body = JSON.parse(await readBody(req) || '{}'); }
  catch { return json(res, 400, { error: 'JSON inválido.' }, origin); }

  const nome = String(body.nome || '').trim();
  const email = String(body.email || '').trim();
  const whatsapp = String(body.whatsapp || '').trim();
  const contato = email || whatsapp;

  const erro = validarContato(nome, contato);
  if (erro) return json(res, 400, { error: erro }, origin);

  try {
    await saveLead({
      nome,
      contato,
      email: email || null,
      whatsapp: whatsapp || null,
      empresa: String(body.empresa || '').trim() || null,
      assunto: String(body.assunto || '').trim() || null,
      mensagem: String(body.mensagem || '').trim() || null,
      origem: 'form',
      ip,
    });
    return json(res, 200, { ok: true }, origin);
  } catch (e) {
    console.error('[contact] erro:', e.message);
    return json(res, 502, { error: 'Não foi possível enviar agora. Tente novamente ou escreva para vnmax6@gmail.com.' }, origin);
  }
}

const server = createServer(async (req, res) => {
  const origin = corsOrigin(req.headers.origin);
  const ip = clientIp(req);

  if (req.method === 'OPTIONS') { setCors(res, origin); res.writeHead(204); return res.end(); }

  if (req.method === 'GET' && req.url === '/api/health') return json(res, 200, { ok: true }, origin);

  if (req.method === 'POST' && (req.url === '/api/chat' || req.url === '/api/contact')) {
    // Token opcional do app (se configurado).
    if (APP_TOKEN && req.headers['x-vnmax-token'] !== APP_TOKEN) return json(res, 401, { error: 'Não autorizado.' }, origin);
    // Em modo restrito, exige Origin de navegador valido (defesa em profundidade; spoofavel por nao-browser).
    if (!ALLOW_ANY && (!req.headers.origin || !origin)) return json(res, 403, { error: 'Origem não autorizada.' }, '');
    if (rateLimited(ip)) return json(res, 429, { error: 'Muitas requisições em pouco tempo. Aguarde um momento.' }, origin);
    return req.url === '/api/contact' ? handleContact(req, res, origin, ip) : handleChat(req, res, origin, ip);
  }

  json(res, 404, { error: 'Rota não encontrada.' }, origin);
});

// Pre-aquece o modelo (reduz cold start na primeira mensagem real). Opcionalmente
// mantem quente com pings periodicos (KEEPALIVE_MS) em sites de baixo trafego.
async function warmup() {
  try {
    await chatCompletion({ apiKey: API_KEY, model: MODEL, messages: [{ role: 'user', content: 'ok' }], temperature: 0, maxTokens: 1 });
    console.log('[vnmax-assistant] modelo pré-aquecido.');
  } catch (e) {
    console.warn('[vnmax-assistant] warmup falhou (seguira tentando sob demanda):', e.message);
  }
}
const KEEPALIVE_MS = Number(process.env.KEEPALIVE_MS || 0);

server.listen(PORT, () => {
  console.log(`[vnmax-assistant] ouvindo na porta ${PORT} · modelo ${MODEL}`);
  console.log(`[vnmax-assistant] origens: ${ALLOW_ANY ? '* (teste)' : (ALLOWED_ORIGINS.join(', ') || '(nenhuma)')} · token: ${APP_TOKEN ? 'on' : 'off'} · trustProxy: ${TRUST_PROXY}`);
  warmup();
  if (KEEPALIVE_MS > 0) setInterval(warmup, KEEPALIVE_MS).unref();
});
