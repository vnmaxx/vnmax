// Ferramentas (function calling) disponiveis para o assistente.
// registrar_contato: captura leads/agendamentos e grava em data/leads.jsonl.
import { appendFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
const LEADS_FILE = resolve(DATA_DIR, 'leads.jsonl');

export const tools = [
  {
    type: 'function',
    function: {
      name: 'registrar_contato',
      description:
        'Registra uma solicitação de contato/agendamento/orçamento de um visitante da VNMAX. Use quando o visitante quiser ser contatado, agendar uma conversa, pedir proposta ou falar com a equipe. Exige ao menos nome e contato.',
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

// Executa uma ferramenta pelo nome. Retorna um objeto serializavel para o modelo.
export async function runTool(name, args, meta = {}) {
  if (name === 'registrar_contato') return registrarContato(args, meta);
  return { ok: false, erro: `Ferramenta desconhecida: ${name}` };
}

async function registrarContato(args, meta) {
  const nome = String(args?.nome || '').trim().slice(0, 120);
  const contato = String(args?.contato || '').trim().slice(0, 160);
  if (!nome || !contato) return { ok: false, erro: 'Peça ao visitante o nome e um contato (WhatsApp ou e-mail) antes de registrar.' };

  // Rejeita placeholders/exemplos para evitar leads falsos.
  const blob = `${nome} ${contato}`.toLowerCase();
  if (/(seu[ _-]?nome|nome do|fulano|exemplo|example|email@|user@|teste|placeholder|\bxxx\b|asdf|qwerty)/.test(blob)) {
    return { ok: false, erro: 'Parecem dados de exemplo. Peça ao visitante o nome e o contato reais.' };
  }

  // Nome: ao menos 2 letras e nao um unico caractere repetido.
  const letras = (nome.match(/\p{L}/gu) || []).length;
  if (letras < 2 || /^(.)\1+$/.test(nome.replace(/\s/g, ''))) {
    return { ok: false, erro: 'Nome inválido. Peça o nome real do visitante.' };
  }

  // Contato: e-mail plausivel OU telefone brasileiro plausivel (10-13 digitos).
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contato);
  const fakeEmail = isEmail && (/^(.)\1{3,}@/.test(contato) || /@(example|exemplo|test|teste|mailinator|tempmail)\./i.test(contato) || /\.(test|example|invalid|local)$/i.test(contato));
  const digitos = (contato.match(/\d/g) || []).join('');
  const seqOuRepetido = /^(\d)\1+$/.test(digitos) || /0123456789|1234567890|12345678/.test(digitos);
  const ehTelefone = digitos.length >= 10 && digitos.length <= 13 && !seqOuRepetido;

  if (isEmail && fakeEmail) return { ok: false, erro: 'E-mail parece de teste. Peça um e-mail válido.' };
  if (!isEmail && !ehTelefone) return { ok: false, erro: 'Contato inválido. Peça um WhatsApp com DDD (10 a 11 dígitos) ou um e-mail válido.' };

  const lead = {
    ts: new Date().toISOString(),
    nome,
    contato,
    assunto: String(args?.assunto || '').trim().slice(0, 400) || null,
    data_preferida: String(args?.data_preferida || '').trim().slice(0, 160) || null,
    ip: meta.ip || null,
    origem: meta.origin || null,
  };

  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(LEADS_FILE, JSON.stringify(lead) + '\n', 'utf8');
  } catch (e) {
    return { ok: false, erro: 'Falha ao registrar. Tente novamente em instantes.' };
  }
  return { ok: true, registered: true, mensagem: 'Contato registrado. A equipe da VNMAX entrará em contato.' };
}

export const LEADS_PATH = LEADS_FILE;
