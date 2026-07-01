/**
 * ============================================================
 *  Sincronização CRM VNMAX  <->  Studio-IA Backend
 * ============================================================
 *  O CRM é o único lado com acesso aos dois mundos (Firestore +
 *  Studio Bridge), então ele orquestra a sincronização
 *  unidirecional Mídia -> CRM:
 *
 *   • Studio-IA -> CRM : puxa os leads/prospects do Studio-IA
 *                        e cria/atualiza em `clientes` do CRM
 *                        (casando por studioId).
 *
 *  É idempotente: rodar várias vezes não duplica. A ligação é o
 *  campo Cliente.studioId <-> StudioLead.id, e converge.
 *
 *  NOTA: Não criamos automaticamente leads no /leads do CRM a partir
 *  do Studio-IA. O Studio-IA mantém seu próprio pipeline de
 *  prospeccão em paralelo, então duplicar aqui causaria inconsistência.
 * ============================================================
 */
import {
  clientesStore,
  type Cliente,
  type BaseRecord,
  type Store,
} from './crm';
import {
  listStudioLeads,
  type StudioLead,
} from './studioBridge';

/** Lê o estado atual de uma coleção uma única vez (subscribe + unsubscribe). */
function readOnce<T extends BaseRecord>(store: Store<T>): Promise<T[]> {
  return new Promise((resolve) => {
    let unsub: (() => void) | null = null;
    let done = false;
    const finish = (items: T[]) => {
      if (done) return;
      done = true;
      // o unsub pode ainda não ter sido atribuído (emissão síncrona): adia.
      queueMicrotask(() => unsub?.());
      resolve(items);
    };
    unsub = store.subscribe(finish);
  });
}

/** Normaliza um nome para casamento (sem acentos, só letras/números). */
function norm(s?: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '');
}

/**
 * Dados cadastrais vindos do Studio-IA.
 * Só preenche o que ainda está VAZIO no CRM — nunca sobrescreve uma edição
 * manual. Não inclui chaves `undefined` (o Firestore as rejeita).
 */
function cadastroStudio(existing: Partial<Cliente> | undefined, d: StudioLead): Partial<Cliente> {
  const out: Partial<Cliente> = {};
  if (!existing?.email?.trim() && d.contato?.includes('@')) out.email = d.contato;
  if (!existing?.phone?.trim() && d.contato?.includes('9')) out.phone = d.contato;
  return out;
}

/**
 * Status/snapshot do Studio-IA projetados nos campos do Cliente.
 * NÃO inclui chaves `undefined` — o Firestore as rejeita e isso derrubaria
 * o store para o modo local (fazendo registros "sumirem" da nuvem).
 */
function studioSnapshot(d: StudioLead): Partial<Cliente> {
  const snap: Partial<Cliente> = {
    studioId: d.id,
    studioStage: d.stage,
    studioSyncedAt: Date.now(),
  };
  return snap;
}

export interface SyncResult {
  pulledCriados: number; // clientes do Studio-IA criados no CRM
  pulledAtualizados: number; // clientes vinculados/atualizados no CRM
  total: number; // total de clientes no Studio-IA após o sync
  error?: string;
}

/**
 * Executa a sincronização unidirecional (Studio-IA -> CRM).
 * Seguro chamar de tempos em tempos / em todo carregamento.
 */
export async function syncStudio(): Promise<SyncResult> {
  const res: SyncResult = { pulledCriados: 0, pulledAtualizados: 0, total: 0 };
  try {
    const [studio, crm] = await Promise.all([
      listStudioLeads(),
      readOnce(clientesStore),
    ]);
    res.total = studio.length;

    // índices para casar os dois lados
    const crmByStudio = new Map(crm.filter((c) => c.studioId).map((c) => [c.studioId as string, c]));
    const crmByNome = new Map(crm.filter((c) => c.name?.trim()).map((c) => [norm(c.name), c]));

    /* ---------- Studio-IA -> CRM ---------- */
    for (const d of studio) {
      const snap = studioSnapshot(d);

      // 1) já vinculado por studioId
      const byStudio = crmByStudio.get(d.id);
      if (byStudio) {
        await clientesStore.update(byStudio.id, { ...snap, ...cadastroStudio(byStudio, d) });
        res.pulledAtualizados++;
        continue;
      }

      // 2) já existe um cliente no CRM com o mesmo nome -> vincula (não duplica)
      const byNome = crmByNome.get(norm(d.nome));
      if (byNome) {
        await clientesStore.update(byNome.id, { ...snap, ...cadastroStudio(byNome, d) });
        res.pulledAtualizados++;
        continue;
      }

      // 3) cliente que só existe no Studio-IA -> cria no CRM
      await clientesStore.create({
        name: d.nome,
        segment: d.segmento || undefined,
        email: d.contato?.includes('@') ? d.contato : undefined,
        phone: d.contato?.includes('9') ? d.contato : undefined,
        origin: 'studio',
        ...snap,
        ...cadastroStudio(undefined, d),
      } as Omit<Cliente, 'id' | 'createdAt'>);
      res.pulledCriados++;
    }
  } catch (e: any) {
    res.error = e?.message || String(e);
  }
  return res;
}
