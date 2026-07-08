// /api/chat — Assistente VNMAX no serverless da Vercel.
//
// Atende dois clientes:
// 1. VNMAX AI Copilot (web/): envia {messages, mode, context} e lê a resposta
//    em SSE (`data: {"content":...}` ... `data: [DONE]`).
// 2. Widget legado (src/chat.js): envia só {messages} e espera JSON
//    {reply, registered}.
//
// Suporta a ferramenta "registrar_contato": o modelo coleta nome+contato do
// visitante e o lead é gravado na coleção `leads` (mesmo CRM do formulário).
import {
  API_KEY, FALLBACK_MSG, rateLimited, readBody, sanitizeMessages,
  startSSE, sseText, sseDone, sseFail,
  nimChat, withTimeout, systemPrompt, filtrarSaida, validarContato, saveLead,
} from './_copilot.js';

export const config = { supportsResponseStreaming: true };

const MAX_TOOL_ROUNDS = Number(process.env.MAX_TOOL_ROUNDS || 3);

const tools = [
  {
    type: 'function',
    function: {
      name: 'registrar_contato',
      description:
        'Registra uma solicitação de contato/agendamento/orçamento de um visitante da VNMAX. Use quando o visitante quiser ser contatado, agendar uma conversa, pedir proposta ou falar com a equipe. Exige ao menos nome e contato reais.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome do visitante' },
          contato: { type: 'string', description: 'WhatsApp ou e-mail para retorno' },
          assunto: { type: 'string', description: 'Assunto ou necessidade resumida' },
          data_preferida: { type: 'string', description: 'Data/horário de preferência, se mencionado (texto livre)' },
        },
        required: ['nome', 'contato'],
      },
    },
  },
];

async function registrarContato(args, conversa) {
  const nome = String(args?.nome || '').trim();
  const contato = String(args?.contato || '').trim();
  const erro = validarContato(nome, contato);
  if (erro) return { ok: false, erro };

  const isEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(contato);
  const partes = [
    'Lead recebido pelo chat de IA (VNMAX AI).',
    args?.assunto ? `Assunto: ${String(args.assunto).trim()}` : null,
    args?.data_preferida ? `Horário preferido informado no chat: ${String(args.data_preferida).trim()}` : null,
    conversa ? `Conversa:\n${conversa}` : null,
  ].filter(Boolean);

  const res = await saveLead({
    nome,
    email: isEmail ? contato : null,
    whatsapp: isEmail ? null : contato,
    mensagem: partes.join('\n'),
  });
  if (!res.ok) return { ok: false, erro: 'Falha ao registrar. Tente novamente em instantes.' };
  return { ok: true, registered: true, mensagem: 'Contato registrado. A equipe da VNMAX entrará em contato.' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'método não permitido' });
  if (rateLimited(req)) return res.status(429).json({ error: 'Muitas requisições em pouco tempo. Aguarde um momento.' });

  const body = await readBody(req);
  const messages = sanitizeMessages(body.messages);
  if (!messages.length) return res.status(400).json({ error: 'Envie ao menos uma mensagem.' });

  // O copilot novo manda `mode`; o widget legado manda só {messages} e espera JSON.
  const wantsSSE = body.mode !== undefined ||
    String(req.headers.accept || '').includes('text/event-stream');

  const answer = (reply, registered) => {
    if (wantsSSE) { startSSE(res); sseText(res, reply); sseDone(res); }
    else res.status(200).json({ reply, registered });
  };

  if (!API_KEY) {
    console.error('[chat] NVIDIA_API_KEY ausente no env da Vercel.');
    return answer(FALLBACK_MSG, false);
  }

  const convo = [{ role: 'system', content: systemPrompt('chat') }, ...messages];
  const conversa = messages
    .map((m) => `${m.role === 'user' ? 'Visitante' : 'Assistente'}: ${m.content}`)
    .join('\n').slice(0, 3500);

  const { signal, clear } = withTimeout();
  try {
    let resp = await nimChat({ messages: convo, tools, signal });
    let msg = resp.choices?.[0]?.message || {};
    let registered = false;

    // Loop de tool-calling limitado; na última rodada omite as tools para forçar texto.
    for (let round = 0; round < MAX_TOOL_ROUNDS && Array.isArray(msg.tool_calls) && msg.tool_calls.length; round++) {
      convo.push(msg);
      for (const tc of msg.tool_calls) {
        let args = {};
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        let result;
        try { result = await registrarContato(args, conversa); }
        catch (e) {
          console.error('[chat] tool erro:', e.message);
          result = { ok: false, erro: 'Falha ao registrar. Tente novamente em instantes.' };
        }
        if (result.registered) registered = true;
        convo.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
      }
      const lastRound = round === MAX_TOOL_ROUNDS - 1;
      resp = await nimChat({ messages: convo, tools: lastRound ? undefined : tools, signal });
      msg = resp.choices?.[0]?.message || {};
    }

    let reply = (msg.content || '').trim() || 'Desculpe, não consegui responder agora. Pode tentar de novo?';
    reply = filtrarSaida(reply);
    if (registered && wantsSSE) reply += '\n\n✓ Contato registrado — a equipe entrará em contato.';
    return answer(reply, registered);
  } catch (e) {
    console.error('[chat] erro:', e.message);
    if (wantsSSE) return sseFail(res);
    return res.status(502).json({ error: 'Falha ao falar com o assistente. Tente novamente em instantes.' });
  } finally {
    clear();
  }
}
