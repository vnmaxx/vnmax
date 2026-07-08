// /api/meeting — modo Reunião do VNMAX Copilot. Antes de responder (SSE),
// tenta registrar a solicitação como lead no CRM (coleção `leads`), igual ao
// formulário do site. O resultado é informado ao modelo para ele confirmar
// (ou não) o registro com honestidade.
import { makeStreamHandler, saveLead, validarContato } from './_copilot.js';

export const config = { supportsResponseStreaming: true };

async function registerMeetingLead(body) {
  const md = body?.context?.meetingData || {};
  const nome = String(md.name || '').trim();
  const email = String(md.email || '').trim();
  const phone = String(md.phone || '').trim();
  const contato = email || phone;

  if (validarContato(nome, contato)) {
    return 'CONTEXTO: a solicitação NÃO foi registrada no CRM porque faltam nome e/ou contato válidos. Peça esses dados ao visitante.';
  }

  const mensagem = [
    'Solicitação de reunião via VNMAX AI (modo Reunião).',
    md.objective ? `Objetivo: ${md.objective}` : null,
    md.date ? `Data preferida: ${md.date}` : null,
    md.time ? `Horário preferido: ${md.time}` : null,
    md.notes ? `Observações: ${md.notes}` : null,
  ].filter(Boolean).join('\n');

  const res = await saveLead({
    nome,
    email: email || null,
    whatsapp: email ? null : phone,
    empresa: md.company || null,
    mensagem,
  });
  return res.ok
    ? 'CONTEXTO: a solicitação de reunião FOI registrada no CRM da VNMAX com sucesso. Confirme ao visitante que a equipe entrará em contato para confirmar o horário.'
    : 'CONTEXTO: houve uma falha técnica ao registrar a solicitação no CRM. Peça desculpas e oriente o visitante a escrever para vnmax6@gmail.com para garantir o agendamento.';
}

export default makeStreamHandler('meeting', { maxTokens: 900, beforeStream: registerMeetingLead });
