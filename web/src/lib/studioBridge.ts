/**
 * ============================================================
 *  Ponte segura: CRM Nexus Holding  ->  Studio-IA Backend
 * ============================================================
 *  Conecta o CRM (postflow) ao sistema Studio-IA via API
 *  protegida por secret de bridge.
 *
 *  Configure em .env (NAO versionar):
 *    VITE_STUDIO_API=https://studio-ia-api.onrender.com   (ou http://localhost:3002 em dev)
 *    VITE_STUDIO_KEY=<BRIDGE_SECRET>                        (a mesma BRIDGE_SECRET do Studio-IA)
 *
 *  A API expoe operacoes seguras e dados escopados
 *  (sem conteudo sensivel, sem exclusao), entao mesmo um
 *  vazamento da chave tem impacto limitado. Para seguranca maxima,
 *  use um proxy serverless guardando a chave no servidor.
 * ============================================================
 */
import { getIdToken } from './firebase';

const API = (import.meta as any).env?.VITE_STUDIO_API || "";
const KEY = (import.meta as any).env?.VITE_STUDIO_KEY || "";
// Em produção: usa o proxy serverless /api/studio (chave só no servidor).
// Em dev: se VITE_STUDIO_API + VITE_STUDIO_KEY existirem, chama o Studio-IA direto.
const DIRECT = !!(API && KEY);

async function j(r: Response) {
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((d as any).error || r.statusText);
  return d;
}

/** Roteia para o Studio-IA direto (dev) ou para o proxy serverless (prod). */
async function call(path: string, init: RequestInit = {}) {
  const url = DIRECT
    ? `${API}/${path}`
    : `/api/studio?path=${encodeURIComponent(path)}`;
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init.headers as any) || {}) };
  if (DIRECT) {
    headers["x-bridge-secret"] = KEY;
  } else {
    // proxy: autentica o chamador com o ID token do admin (Firebase)
    const token = await getIdToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return j(await fetch(url, { ...init, headers }));
}

export interface StudioHistorico {
  tipo: string;           // tipo de evento
  canal?: string;         // canal de contato
  etapa?: string;         // etapa alcançada
  texto: string;          // descrição/notas
  em: number;             // timestamp
}

export interface StudioLead {
  id: string;
  nome: string;
  segmento?: string;
  contato: string;        // email ou telefone
  canal?: 'email' | 'whatsapp' | 'instagram';
  stage?: 'NOVO' | 'CONTATADO' | 'RESPONDEU' | 'QUALIFICADO' | 'PROPOSTA' | 'FECHADO' | 'PERDIDO';
  observacao?: string;
  origem?: string;
  criadoEm: number;
  atualizadoEm: number;
  historico?: StudioHistorico[];
  rascunho?: boolean;
}

export interface StudioProduto {
  id: string;
  clienteId: string;
  tipo: 'landing' | 'app' | 'crm' | 'ebook' | string;
  formato: 'html' | 'md' | 'json';
  conteudo: string;
  tema?: string;
  criadoEm: number;
}

export interface StudioPendente {
  id: string;
  clienteId: string;
  tipo: string;
  descricao: string;
  criadoEm: number;
}

/** Sempre disponível: usa proxy em prod, modo direto em dev. */
export const studioEnabled = (): boolean => true;

export async function studioHealth() {
  return call("health");
}

export async function listStudioLeads(): Promise<StudioLead[]> {
  const r = await call("crm");
  return (r as { leads?: StudioLead[] }).leads || (Array.isArray(r) ? r : []);
}

export async function upsertStudioLead(input: {
  nome: string;
  segmento?: string;
  contato: string;
  canal?: 'email' | 'whatsapp' | 'instagram';
  observacao?: string;
  stage?: 'NOVO' | 'CONTATADO' | 'RESPONDEU' | 'QUALIFICADO' | 'PROPOSTA' | 'FECHADO' | 'PERDIDO';
}): Promise<StudioLead> {
  return call("crm/lead", { method: "POST", body: JSON.stringify(input) });
}

/**
 * Lista produtos (entregaveis) gerados para um cliente.
 * Equivalente aproximado de "materiais" do sistema antigo.
 */
export async function getStudioProdutos(clienteId: string): Promise<StudioProduto[]> {
  const r = await call(`conteudo/produtos?clienteId=${encodeURIComponent(clienteId)}`);
  return (r as { produtos?: StudioProduto[] }).produtos || (Array.isArray(r) ? r : []);
}

/**
 * Lista itens pendentes de aprovação para um cliente.
 * Equivalente aproximado de "aguardandoAprovacao" do sistema antigo.
 */
export async function getStudioPendentes(clienteId: string): Promise<StudioPendente[]> {
  const r = await call(`pendentes?clienteId=${encodeURIComponent(clienteId)}`);
  return (r as { pendentes?: StudioPendente[] }).pendentes || (Array.isArray(r) ? r : []);
}

/**
 * NOTA: Os URLs de download de materiais (entregaRawUrl, entregaDocHtmlUrl,
 * entregaBundleUrl) NÃO têm equivalente direto no Studio-IA no schema atual.
 * O Studio-IA armazena conteúdo em getStudioProdutos() mas não expõe estrutura
 * de pastas/arquivos como o sistema antigo (Nexus Digital 90).
 *
 * Se no futuro for necessário, pode-se:
 * 1) Usar o campo `conteudo` do produto (que é a string renderizável)
 * 2) Implementar um endpoint `/conteudo/download/:produtoId` no Studio-IA
 * 3) Por enquanto, manter apenas os 4 endpoints acima (crm, crm/lead, conteudo/produtos, pendentes)
 *
 * O ClientesPanel.tsx que usa essas funções de download será removida pelo
 * próximo agente ao atualizar a UI.
 */
