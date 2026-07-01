/**
 * API de leads (formulário "Raio-X")
 *
 * Submissão pública (submitLead):
 *   - Envia POST HTTP para /api/contact (backend compartilhado com vnmax)
 *   - Mapeia os campos do formulário para o schema unificado de leads
 *   - URL base do endpoint é configurável via VITE_CONTACT_API_URL
 *
 * Leitura e gerenciamento (subscribeLeads, updateLead, deleteLead):
 *   - Usa Firestore client SDK (a escrita continua bloqueada por regras;
 *     apenas admin/isMember() pode ler/atualizar/deletar)
 */
import { leadsStore as store, type Lead } from './crm';

export type { Lead, LeadStatus } from './crm';
export { PIPELINE as LEAD_STATUSES } from './crm';

/** Dados do formulário público antes do envio ao backend. */
export interface LeadFormData {
  name: string;          // nome do contato
  company?: string;      // empresa
  email: string;         // e-mail
  phone?: string;        // telefone/WhatsApp
  segment?: string;      // segmento (ex: "Comércio / Varejo")
  revenue?: string;      // faturamento (ex: "Até R$ 20 mil/mês")
  message?: string;      // desafio / maior dificuldade
  source?: string;       // origem (padrão: "raio-x")
}

/** Payload enviado ao backend /api/contact. */
interface ContactPayload {
  nome: string;          // LeadFormData.name
  email: string;         // LeadFormData.email
  whatsapp?: string;     // LeadFormData.phone (mapeado para whatsapp)
  empresa?: string;      // LeadFormData.company
  assunto?: string;      // LeadFormData.segment
  mensagem?: string;     // mensagem combinada (revenue + message)
  origem: 'form';        // fixo para submissão pública
}

/** URL base do endpoint de contato. */
const API_BASE = (import.meta.env.VITE_CONTACT_API_URL || '').replace(/\/+$/, '');
const ENDPOINT = `${API_BASE}/api/contact`;

/** Submissão pública de lead (formulário "Raio-X Digital").
 *  Envia POST para o backend compartilhado (vnmax), que grava no Firestore
 *  e no backup local. Se a URL não estiver configurada, relança erro. */
export async function submitLead(data: LeadFormData): Promise<void> {
  if (!API_BASE || !ENDPOINT.startsWith('http')) {
    throw new Error('VITE_CONTACT_API_URL não está configurada ou é inválida');
  }

  // Combina revenue e message em uma descrição única
  const msgs = [data.revenue, data.message].filter(Boolean);
  const mensagemCompleta = msgs.join(' — ');

  const payload: ContactPayload = {
    nome: data.name,
    email: data.email,
    whatsapp: data.phone,
    empresa: data.company,
    assunto: data.segment,
    mensagem: mensagemCompleta || undefined,
    origem: 'form',
  };

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro ao enviar lead: ${response.status} ${text}`);
  }
}

/** Assina os leads em tempo real (ordenados por data, desc). */
export function subscribeLeads(cb: (leads: Lead[]) => void): () => void {
  return store.subscribe(cb);
}

/** Atualiza status do lead / outros campos. */
export function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  return store.update(id, patch);
}

export function deleteLead(id: string): Promise<void> {
  return store.remove(id);
}
