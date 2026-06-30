// Backend da aba SOCIAL do portal interno — sistema PROPRIO self-hosted (sem SaaS
// de postagem). Fluxo: rascunho -> aguardando aprovacao -> aprovado/agendado ->
// publicado (marcado pelo operador). A publicacao final e semiautomatica: o portal
// gera tudo pronto (texto adaptado por rede + midia + links de "abrir rede com o
// texto") e o operador confirma. Inspirado no motor de conteudo/aprovacao do
// studio-ia. Endpoints PRIVILEGIADOS: exigem ID token do Firebase de um membro da
// allowlist. A NVIDIA_API_KEY (adaptacao) fica so aqui.
import { db, admin } from './firebase-admin.js';
import { adaptContent } from './social/adapt.js';
import { PLATFORMS, PLATFORM_KEYS, isPlatform, authMode, apiCapable } from './social/platforms.js';
import { connectableCatalog, listConnections, platformConnectable, getConnection } from './social/connections.js';
import { canPublish, publishTo } from './social/publishers.js';
export { requireMember } from './auth.js';

const COLLECTION = 'social_posts';

// Maquina de estados das campanhas.
const STATUSES = ['rascunho', 'aguardando', 'aprovado', 'agendado', 'publicado', 'rejeitado'];
const EDITAVEIS = new Set(['rascunho', 'rejeitado']);   // estados em que o conteudo pode ser reeditado

// So aceita http(s) (bloqueia javascript:/data:). Para permalinks colados pelo operador.
function safeUrl(u) {
  try { const url = new URL(String(u || '').trim()); return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null; }
  catch { return null; }
}

function platformsPublic() {
  return PLATFORM_KEYS.map((k) => ({ key: k, label: PLATFORMS[k].label, limit: PLATFORMS[k].limit, requiresMedia: PLATFORMS[k].requiresMedia, mediaType: PLATFORMS[k].mediaType, authMode: authMode(k), connectable: platformConnectable(k), api: apiCapable(k) }));
}

export async function handleStatus() {
  return { nvidia: Boolean(process.env.NVIDIA_API_KEY), platforms: platformsPublic(), catalog: connectableCatalog() };
}

// Lista as contas conectadas. Sem clienteId -> contas globais (VNMAX).
export async function handleConnections(body) {
  const clienteId = body && 'clienteId' in body ? (body.clienteId || null) : undefined;
  return { connections: await listConnections(clienteId) };
}

export async function handleAdapt(body, signal) {
  const { content, platforms, tone, link } = body || {};
  return adaptContent({ content, platforms, tone, link, signal });
}

// Sanitiza/normaliza o payload de uma campanha vindo do cliente.
function buildCampaign(body) {
  const content = String(body?.content || '').trim().slice(0, 6000);
  const variants = (body && typeof body.variants === 'object' && body.variants) || {};
  const wanted = (body?.platforms || []).filter(isPlatform);
  const mediaUrls = Array.isArray(body?.mediaUrls)
    ? body.mediaUrls.map((u) => String(u || '').trim()).filter((u) => /^https:\/\/\S+$/i.test(u)).slice(0, 10)
    : [];
  let scheduleAt = null;
  if (body?.scheduleAt) {
    const ms = Number(body.scheduleAt);
    if (Number.isFinite(ms) && ms > Date.now()) scheduleAt = ms;
  }
  const targets = wanted.map((platform) => ({
    platform,
    caption: String(variants[platform] || content || '').trim().slice(0, PLATFORMS[platform].limit),
    posted: false,
    permalink: null,
    postedAt: null,
  }));
  const clienteId = body?.clienteId ? String(body.clienteId).slice(0, 200) : null;
  const clienteNome = body?.clienteNome ? String(body.clienteNome).trim().slice(0, 200) : null;
  return { content, tone: body?.tone || null, mediaUrls, scheduleAt, platforms: wanted, targets, clienteId, clienteNome };
}

// Cria ou atualiza um rascunho. body.id presente -> atualiza (se editavel e do dono).
export async function handleSave(body, member) {
  const camp = buildCampaign(body);
  if (!camp.platforms.length) { const e = new Error('Selecione ao menos uma rede.'); e.status = 400; throw e; }
  if (!camp.content && !camp.mediaUrls.length) { const e = new Error('Escreva um conteúdo ou informe uma mídia.'); e.status = 400; throw e; }

  const now = admin.firestore.FieldValue.serverTimestamp();
  if (body?.id) {
    const ref = db.collection(COLLECTION).doc(String(body.id));
    const snap = await ref.get();
    if (!snap.exists) { const e = new Error('Campanha não encontrada.'); e.status = 404; throw e; }
    const data = snap.data();
    if (data.createdBy && data.createdBy !== member.uid) { const e = new Error('Sem permissão para editar esta campanha.'); e.status = 403; throw e; }
    if (!EDITAVEIS.has(data.status)) { const e = new Error(`Campanha em "${data.status}" não pode ser editada.`); e.status = 409; throw e; }
    await ref.update({ ...camp, status: 'rascunho', rejectReason: null, updatedAt: now });
    return { id: ref.id, status: 'rascunho' };
  }
  const ref = await db.collection(COLLECTION).add({
    ...camp, status: 'rascunho', rejectReason: null,
    createdBy: member.uid, createdByEmail: member.email,
    approvedBy: null, approvedByEmail: null, approvedAt: null,
    createdAt: now, updatedAt: now,
  });
  return { id: ref.id, status: 'rascunho' };
}

// Carrega a campanha e valida a transicao de estado pedida.
async function loadForTransition(id) {
  if (!id) { const e = new Error('Informe a campanha.'); e.status = 400; throw e; }
  const ref = db.collection(COLLECTION).doc(String(id));
  const snap = await ref.get();
  if (!snap.exists) { const e = new Error('Campanha não encontrada.'); e.status = 404; throw e; }
  return { ref, data: snap.data() };
}

// rascunho -> aguardando (enviar para aprovacao).
export async function handleSubmit(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (data.createdBy && data.createdBy !== member.uid) { const e = new Error('Sem permissão.'); e.status = 403; throw e; }
  if (!EDITAVEIS.has(data.status)) { const e = new Error(`Só rascunhos podem ser enviados para aprovação (atual: ${data.status}).`); e.status = 409; throw e; }
  await ref.update({ status: 'aguardando', updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { id: ref.id, status: 'aguardando' };
}

// aguardando -> aprovado (ou "agendado" se houver horario futuro). Registra o aprovador.
export async function handleApprove(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (data.status !== 'aguardando') { const e = new Error(`Só itens aguardando aprovação podem ser aprovados (atual: ${data.status}).`); e.status = 409; throw e; }
  const status = (data.scheduleAt && data.scheduleAt > Date.now()) ? 'agendado' : 'aprovado';
  await ref.update({
    status, approvedBy: member.uid, approvedByEmail: member.email,
    approvedAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id, status };
}

// aguardando -> rejeitado (com motivo). Volta a ser editavel.
export async function handleReject(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (data.status !== 'aguardando') { const e = new Error('Só itens aguardando aprovação podem ser rejeitados.'); e.status = 409; throw e; }
  const reason = String(body?.reason || '').trim().slice(0, 500) || '(sem motivo)';
  await ref.update({ status: 'rejeitado', rejectReason: reason, rejectedBy: member.uid, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { id: ref.id, status: 'rejeitado' };
}

// Operador marca uma rede como publicada (opcional: cola o permalink). Quando todas
// as redes da campanha estao publicadas, a campanha vira "publicado".
export async function handleMarkPosted(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (!['aprovado', 'agendado', 'publicado'].includes(data.status)) { const e = new Error('Aprove a campanha antes de publicar.'); e.status = 409; throw e; }
  const platform = String(body?.platform || '');
  const undo = Boolean(body?.undo);
  // Distingue "permalink ausente" (preserva o salvo) de "permalink invalido" (erro).
  const rawLink = (body?.permalink == null) ? '' : String(body.permalink).trim();
  const permalink = rawLink ? safeUrl(rawLink) : null;
  if (!undo && rawLink && !permalink) { const e = new Error('Permalink inválido: use http(s)://'); e.status = 400; throw e; }
  const targets = Array.isArray(data.targets) ? data.targets : [];
  const t = targets.find((x) => x.platform === platform);
  if (!t) { const e = new Error('Rede não faz parte desta campanha.'); e.status = 400; throw e; }
  if (undo) { t.posted = false; t.permalink = null; t.postedAt = null; }
  else { t.posted = true; if (permalink) t.permalink = permalink; t.postedAt = Date.now(); }  // so sobrescreve com link novo valido
  const allPosted = targets.length > 0 && targets.every((x) => x.posted);
  // Ao reverter de 'publicado', recompoe o estado base a partir do agendamento.
  const base = (data.scheduleAt && data.scheduleAt > Date.now()) ? 'agendado' : 'aprovado';
  const status = allPosted ? 'publicado' : (data.status === 'publicado' ? base : data.status);
  await ref.update({ targets, status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { id: ref.id, status, targets };
}

export async function handleDelete(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (data.createdBy && data.createdBy !== member.uid) { const e = new Error('Sem permissão para excluir.'); e.status = 403; throw e; }
  await ref.delete();
  return { id: ref.id, deleted: true };
}

// Publica AUTOMATICAMENTE uma rede da campanha via API (usa o token da conta
// conectada do cliente da campanha). So redes com api:true (X, LinkedIn, Telegram).
// Em caso de sucesso marca o target como publicado (igual ao markposted).
export async function handlePublish(body, member) {
  const { ref, data } = await loadForTransition(body?.id);
  if (!['aprovado', 'agendado', 'publicado'].includes(data.status)) { const e = new Error('Aprove a campanha antes de publicar.'); e.status = 409; throw e; }
  const platform = String(body?.platform || '');
  if (!isPlatform(platform)) { const e = new Error('Rede inválida.'); e.status = 400; throw e; }
  if (!canPublish(platform)) { const e = new Error('Publicação automática não disponível para esta rede — use abrir/colar.'); e.status = 400; throw e; }
  const targets = Array.isArray(data.targets) ? data.targets : [];
  const t = targets.find((x) => x.platform === platform);
  if (!t) { const e = new Error('Rede não faz parte desta campanha.'); e.status = 400; throw e; }
  if (t.posted) { const e = new Error('Esta rede já foi publicada.'); e.status = 409; throw e; }

  const conn = await getConnection(platform, data.clienteId || null);
  if (!conn || conn.status !== 'connected') { const e = new Error(`Conecte a conta de ${PLATFORMS[platform].label} (na aba Contas) para o cliente antes de publicar.`); e.status = 409; throw e; }

  // Os publishers ja retornam mensagens curadas (sem vazar token/resposta crua),
  // entao deixamos o erro chegar ao operador (ex.: "token expirou — reconecte").
  const result = await publishTo(platform, { caption: t.caption, mediaUrls: data.mediaUrls || [], conn });

  t.posted = true;
  t.permalink = result?.permalink || t.permalink || null;
  t.postedAt = Date.now();
  const allPosted = targets.length > 0 && targets.every((x) => x.posted);
  const base = (data.scheduleAt && data.scheduleAt > Date.now()) ? 'agendado' : 'aprovado';
  const status = allPosted ? 'publicado' : base;
  await ref.update({ targets, status, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { id: ref.id, status, targets, permalink: t.permalink };
}
