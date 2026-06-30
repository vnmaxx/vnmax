// Ferramentas (function calling) disponiveis para o assistente.
// registrar_contato: captura leads/agendamentos do chat e grava via saveLead
// (Firestore -> CRM + backup local).
import { saveLead, validarContato } from './leads.js';

export const tools = [
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

export async function runTool(name, args, meta = {}) {
  if (name === 'registrar_contato') return registrarContato(args, meta);
  return { ok: false, erro: `Ferramenta desconhecida: ${name}` };
}

async function registrarContato(args, meta) {
  const nome = String(args?.nome || '').trim();
  const contato = String(args?.contato || '').trim();

  const erro = validarContato(nome, contato);
  if (erro) return { ok: false, erro };

  const isEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(contato);
  const dataPref = String(args?.data_preferida || '').trim();

  const res = await saveLead({
    nome,
    contato,
    email: isEmail ? contato : null,
    whatsapp: isEmail ? null : contato,
    assunto: String(args?.assunto || '').trim() || null,
    mensagem: dataPref ? `Horário preferido informado no chat: ${dataPref}` : null,
    conversa: meta.conversa || null,
    origem: 'chat',
    ip: meta.ip || null,
  });

  if (!res.ok) return { ok: false, erro: 'Falha ao registrar. Tente novamente em instantes.' };
  return { ok: true, registered: true, mensagem: 'Contato registrado. A equipe da VNMAX entrará em contato.' };
}
