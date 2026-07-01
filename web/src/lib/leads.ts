/**
 * API de leads (formulário "Raio-X")
 *
 * Submissão pública (submitLead):
 *   - Grava direto na coleção `leads` do Firestore (vnmax-6a660) via client SDK.
 *   - A regra de segurança (`validNewLead()` em firestore.rules) valida o formato:
 *     shape fechado, `stage` fixo em 'NOVO', `origem` fixo em 'form', tamanhos
 *     máximos e ao menos um contato (email ou whatsapp). Escrita pública COM
 *     validação — não precisa de backend próprio.
 *   - `noLocalFallback: true`: se a escrita na nuvem falhar, relança o erro em vez
 *     de salvar só no navegador do visitante (que o admin nunca veria).
 *
 * Leitura e gerenciamento (subscribeLeads, updateLead, deleteLead):
 *   - Usa Firestore client SDK; update/delete exigem isMember() pelas regras.
 *   - Os mesmos documentos aparecem no CRM (dashboard React) e no portal /interno,
 *     pois ambos leem esta mesma coleção `leads`.
 */
import { leadsStore as store, type Lead } from './crm';

export type { Lead, LeadStatus } from './crm';
export { PIPELINE as LEAD_STATUSES } from './crm';

/** Dados do formulário público antes da gravação. */
export interface LeadFormData {
  name: string;          // nome do contato
  company?: string;      // empresa
  email: string;         // e-mail
  phone?: string;        // telefone/WhatsApp
  segment?: string;      // segmento (ex: "Comércio / Varejo")
  revenue?: string;      // faturamento (ex: "Até R$ 20 mil/mês")
  message?: string;      // desafio / maior dificuldade
  source?: string;       // origem (não usado na gravação pública)
}

/** Submissão pública de lead (formulário "Raio-X Digital").
 *  Grava direto na coleção `leads` (schema unificado com o portal /interno).
 *  Campos vazios são descartados pelo Firestore (ignoreUndefinedProperties). */
export async function submitLead(data: LeadFormData): Promise<void> {
  // Combina faturamento + mensagem numa descrição única.
  const mensagem = [data.revenue, data.message].filter(Boolean).join(' — ');
  const canal: 'email' | 'whatsapp' = data.phone ? 'whatsapp' : 'email';

  await store.create(
    {
      nome: data.name,
      email: data.email,
      whatsapp: data.phone || undefined,
      empresa: data.company || undefined,
      segmento: data.segment || undefined,
      mensagem: mensagem || undefined,
      canal,
      origem: 'form',
      stage: 'NOVO',
    } as Omit<Lead, 'id' | 'createdAt'>,
    { noLocalFallback: true },
  );
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
