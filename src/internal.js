// Portal interno/institucional (renderizado apos login bem-sucedido).
// O conteudo (`content`) vem do Firestore (internal/content), buscado por main.js.
// Os documentos da base (internal_docs) sao carregados sob demanda.
import logoUrl from '../logo-wordmark.png';
import { brand } from './data.js';
import { icon } from './icons.js';
import { logout } from './firebase.js';

export { getInternalContent } from './internal-data.js';
import { getInternalDocs, getLeads, updateLeadStage, addLeadEvent, updateLeadFields, deleteLead } from './internal-data.js';
import { socialStatus, adaptPosts, saveCampaign, submitCampaign, approveCampaign, rejectCampaign, markPosted, deleteCampaign, getSocialPosts } from './social-data.js';
import { videoTools, createVideoJob, deleteVideoJob, getVideoJobs } from './social-data.js';

// Estagios do funil do CRM (NOVO -> ... -> FECHADO / PERDIDO).
const STAGES = [
  { key: 'NOVO', label: 'Novo', color: '#9b5cff' },
  { key: 'CONTATADO', label: 'Contatado', color: '#2f7bff' },
  { key: 'RESPONDEU', label: 'Respondeu', color: '#22d3ee' },
  { key: 'QUALIFICADO', label: 'Qualificado', color: '#f5b73c' },
  { key: 'PROPOSTA', label: 'Proposta', color: '#ff8a3d' },
  { key: 'FECHADO', label: 'Fechado', color: '#36d399' },
  { key: 'PERDIDO', label: 'Perdido', color: '#ff4d4f' },
];
const STAGE_KEYS = STAGES.map((s) => s.key);
const stageOf = (k) => STAGES.find((s) => s.key === k) || STAGES[0];
const leadStage = (l) => (l && STAGE_KEYS.includes(l.stage) ? l.stage : 'NOVO');
const CANAIS = {
  whatsapp: { label: 'WhatsApp', icon: 'whatsapp', color: '#36d399' },
  email: { label: 'E-mail', icon: 'mail', color: '#2f7bff' },
  instagram: { label: 'Instagram', icon: 'megaphone', color: '#ff5da2' },
};
const EVENT_ICON = { origem: 'spark', mensagem: 'mail', conversa: 'doc', nota: 'pencil', stage: 'arrow', proposta: 'tag', resposta: 'mail' };

function soft(hex) {
  const h = (hex || '#9b5cff').replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.14)`;
}
const dvName = (name) => `<span>VNMAX</span> <span class="dv">${(name || '').replace(/^VNMAX\s*/, '')}</span>`;

function header(who, badge) {
  return `
    <header class="portal-header">
      <div class="wrap nav">
        <a class="brand-mark" href="#"><img src="${logoUrl}" alt="VNMAX" width="69" height="46">${badge ? '<span class="portal-badge">Interno</span>' : ''}</a>
        <div class="user-box">
          <span>${who}</span>
          <button class="btn btn-ghost" id="logoutBtn">${icon('logout')} Sair</button>
        </div>
      </div>
    </header>`;
}

export function renderLoading() {
  return `<div class="portal"><section class="portal-hero"><div class="wrap" style="display:flex;align-items:center;gap:14px;padding:90px 0">
    <span class="spinner"></span><span style="color:var(--text-dim)">Carregando central interna…</span></div></section></div>`;
}

export function renderDenied(user, message) {
  const who = user && (user.email || user.displayName) ? (user.displayName || user.email) : 'Usuário';
  return `<div class="portal">${header(who, false)}
    <section class="denied"><div class="wrap" style="max-width:620px">
      <div class="modal-lock">${icon('lock')}</div>
      <h1 class="portal-hero" style="padding:0">Acesso restrito</h1>
      <p style="margin-top:12px;color:var(--text-dim)">${message}</p>
      <p style="margin-top:10px;color:var(--text-muted);font-size:14px">Use o botão <b>Sair</b> no topo para entrar com outra conta.</p>
    </div></section></div>`;
}

export function renderInternal(user, content) {
  const d = content || {};
  const who = user && (user.email || user.displayName) ? (user.displayName || user.email) : 'Equipe VNMAX';
  const divisions = d.divisions || [];

  return `
  <div class="portal">
    ${header(who, true)}

    <section class="portal-hero">
      <div class="wrap">
        <h1>VNMAX OS — Central interna</h1>
        <p>Base operacional e institucional reservada: ecossistema, roadmap, modelo de negócio, arquitetura, engenharia de IA e a base de conhecimento. Conteúdo confidencial — não exibir em materiais públicos.</p>
        <div class="tabs" id="tabs">
          <button class="tab active" data-tab="inst">Institucional</button>
          <button class="tab" data-tab="crm">CRM</button>
          <button class="tab" data-tab="social">Social</button>
          <button class="tab" data-tab="video">Vídeo</button>
          <button class="tab" data-tab="eco">Ecossistema</button>
          <button class="tab" data-tab="road">Roadmap</button>
          <button class="tab" data-tab="estr">Estratégia</button>
          <button class="tab" data-tab="eng">Arquitetura &amp; IA</button>
          <button class="tab" data-tab="gov">Governança</button>
          <button class="tab" data-tab="docs">Documentos</button>
        </div>
      </div>
    </section>

    <!-- INSTITUCIONAL -->
    <section class="panel" data-panel="inst">
      <div class="wrap">
        <span class="eyebrow">Institucional</span>
        <h2 class="section-title">Missão, visão e indicadores</h2>
        <div class="mv-grid">
          <div class="mv"><h3>Missão</h3><p>${d.mission || ''}</p></div>
          <div class="mv"><h3>Visão</h3><p>${d.vision || ''}</p></div>
        </div>
        <h3 style="margin:48px 0 0;font-size:20px">Indicadores de crescimento</h3>
        <div class="grid grid-4">
          ${(d.metrics || []).map((m) => `<div class="card"><div class="num">${m.value}</div><h3 style="margin-top:6px">${m.label}</h3><p>${m.text}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- CRM -->
    <section class="panel hidden" data-panel="crm">
      <div class="wrap" style="max-width:none">
        <span class="eyebrow">CRM · Funil de vendas</span>
        <h2 class="section-title">Leads e oportunidades</h2>
        <p class="lead">Contatos do formulário do site e do assistente de IA, organizados por estágio. Arraste os cards entre as colunas para mover no funil.</p>
        <div id="crmMount">
          <div style="display:flex;align-items:center;gap:12px;color:var(--text-dim);padding:30px 0"><span class="spinner"></span> Carregando leads…</div>
        </div>
      </div>
    </section>

    <!-- SOCIAL -->
    <section class="panel hidden" data-panel="social">
      <div class="wrap" style="max-width:none">
        <span class="eyebrow">Social · Publicação multi-rede</span>
        <h2 class="section-title">Publicar e agendar nas redes</h2>
        <p class="lead">Escreva uma vez, adapte para cada rede com IA e publique ou agende em todas as redes do Ayrshare. A agenda mostra o que está programado e o que já foi publicado.</p>
        <div id="socialMount">
          <div style="display:flex;align-items:center;gap:12px;color:var(--text-dim);padding:30px 0"><span class="spinner"></span> Carregando central de publicação…</div>
        </div>
      </div>
    </section>

    <!-- VÍDEO -->
    <section class="panel hidden" data-panel="video">
      <div class="wrap" style="max-width:none">
        <span class="eyebrow">Vídeo · Edição automatizada</span>
        <h2 class="section-title">Editor de vídeo (worker)</h2>
        <p class="lead">Envie um vídeo (URL ou arquivo no inbox do servidor) com instruções. O worker corta, aplica color grade, legendas e intro de marca (hyperframes), e a edição inteligente (video-use) quando disponível. O resultado vira mídia pronta para a aba Social.</p>
        <div id="videoMount">
          <div style="display:flex;align-items:center;gap:12px;color:var(--text-dim);padding:30px 0"><span class="spinner"></span> Carregando editor…</div>
        </div>
      </div>
    </section>

    <!-- ECOSSISTEMA -->
    <section class="panel hidden" data-panel="eco">
      <div class="wrap">
        <span class="eyebrow">${divisions.length} divisões</span>
        <h2 class="section-title">Plataformas e produtos do ecossistema</h2>
        <p class="lead">Cada unidade opera com uma plataforma proprietária e um portfólio de produtos especializado.</p>
        <div class="div-grid">
          ${divisions.map((v) => `
            <div class="div-card" style="--c:${v.color};--c-soft:${soft(v.color)}">
              <div class="dhead">
                <div class="dico">${icon(v.icon)}</div>
                <div><h3>${dvName(v.name)}</h3></div>
              </div>
              <div class="slogan">${v.slogan || ''}</div>
              <div class="meta"><b>Área:</b> ${v.area || ''}</div>
              <div class="meta" style="margin-top:4px"><b>Plataforma:</b> ${v.platform ? 'VNMAX ' + v.platform : '<span style="color:var(--c)">em definição</span>'}</div>
              <div class="meta" style="margin-top:4px">${v.objective || ''}</div>
              <div class="tag-row">
                ${(v.products && v.products.length) ? v.products.map((p) => `<span class="tag">${p}</span>`).join('') : '<span class="tag soon">Portfólio em definição</span>'}
              </div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ROADMAP -->
    <section class="panel hidden" data-panel="road">
      <div class="wrap" style="max-width:840px">
        <span class="eyebrow">Plano estratégico</span>
        <h2 class="section-title">Roadmap 2026–2031</h2>
        <p class="lead">Abordagem progressiva e disciplinada: cada fase consolida a anterior antes de avançar.</p>
        <div class="timeline">
          ${(d.roadmap || []).map((r) => `
            <div class="tl-item">
              <div class="tl-phase">${r.phase}</div>
              <div class="tl-year">${r.year}</div>
              <div class="tl-goal">${r.goal}</div>
              <ul class="tl-items">${(r.items || []).map((i) => `<li>${i}</li>`).join('')}</ul>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ESTRATEGIA -->
    <section class="panel hidden" data-panel="estr">
      <div class="wrap">
        <span class="eyebrow">Modelo de negócio</span>
        <h2 class="section-title">Crescimento sustentável e progressivo</h2>
        <p class="lead">Começa com serviços que geram caixa, avança para produtos e culmina em assinaturas recorrentes e marketplace.</p>

        <h3 style="margin:36px 0 0;font-size:18px">Fases comerciais</h3>
        <div class="evo">
          ${(d.businessPhases || []).map((p) => `<div class="evo-step"><div class="n">${p.n}</div><h4>${p.title}</h4><p>${p.text}</p></div>`).join('')}
        </div>

        <h3 style="margin:48px 0 0;font-size:18px">Estratégia piramidal</h3>
        ${d.pyramid ? `<div class="pyramid">
          <div class="pyr base"><span>${d.pyramid.base}</span></div>
          <div class="pyr mid"><span>${d.pyramid.mid}</span></div>
          <div class="pyr top"><span>${d.pyramid.top}</span></div>
        </div>` : ''}

        <h3 style="margin:48px 0 0;font-size:18px">Evolução estratégica</h3>
        <div class="evo">
          ${(d.revenueEvolution || []).map((e) => `<div class="evo-step"><div class="n">${e.n}</div><h4>${e.stage}</h4><p>${e.period}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ARQUITETURA & IA -->
    <section class="panel hidden" data-panel="eng">
      <div class="wrap">
        <span class="eyebrow">Engenharia</span>
        <h2 class="section-title">Arquitetura de software</h2>
        <div class="grid grid-3">
          ${(d.architecture || []).map((a) => `<div class="card"><h3>${a.title}</h3><p>${a.text}</p></div>`).join('')}
        </div>
        <h3 style="margin:54px 0 0;font-size:20px">Engenharia de IA</h3>
        <div class="grid grid-3" style="margin-top:24px">
          ${(d.ai || []).map((a) => `<div class="card"><div class="ico">${icon('brain')}</div><h3>${a.title}</h3><p>${a.text}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- GOVERNANCA -->
    <section class="panel hidden" data-panel="gov">
      <div class="wrap" style="max-width:840px">
        <span class="eyebrow">Governança</span>
        <h2 class="section-title">Regras de confidencialidade e segurança</h2>
        <ul class="notice">${(d.governance || []).map((g) => `<li>${g}</li>`).join('')}</ul>
      </div>
    </section>

    <!-- DOCUMENTOS -->
    <section class="panel hidden" data-panel="docs">
      <div class="wrap">
        <span class="eyebrow">Base de conhecimento</span>
        <h2 class="section-title">Documentos internos (VNMAX OS)</h2>
        <p class="lead">Marca, design, arquitetura, IA, roadmap e templates — servidos do Firestore, sob a mesma allowlist.</p>
        <div id="docsMount" style="margin-top:8px">
          <div style="display:flex;align-items:center;gap:12px;color:var(--text-dim);padding:30px 0"><span class="spinner"></span> Carregando documentos…</div>
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <div class="wrap footer-bottom" style="border:none;margin:0;padding:0">
        <span>© ${brand.founded} VNMAX · Central interna</span>
        <span>Confidencial</span>
      </div>
    </footer>
  </div>`;
}

// Interacoes do portal: abas, logout e carregamento sob demanda dos documentos.
export function bindInternal(root, onLogout) {
  const tabs = root.querySelectorAll('.tab');
  const panels = root.querySelectorAll('.panel');
  let docsLoaded = false;
  let crmLoaded = false;
  let socialLoaded = false;
  let videoLoaded = false;

  const activate = (target) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (target === 'docs' && !docsLoaded) { docsLoaded = true; loadDocs(root); }
    if (target === 'crm' && !crmLoaded) { crmLoaded = true; loadCrm(root); }
    if (target === 'social' && !socialLoaded) { socialLoaded = true; loadSocial(root); }
    if (target === 'video' && !videoLoaded) { videoLoaded = true; loadVideo(root); }
  };
  tabs.forEach((tab) => tab.addEventListener('click', () => activate(tab.dataset.tab)));

  const btn = root.querySelector('#logoutBtn');
  if (btn) btn.addEventListener('click', async () => { btn.disabled = true; await logout(); if (onLogout) onLogout(); });

  return () => {};
}

async function loadDocs(root) {
  const mount = root.querySelector('#docsMount');
  if (!mount) return;
  try {
    const docs = await getInternalDocs();
    if (!docs.length) { mount.innerHTML = '<p style="color:var(--text-dim)">Nenhum documento publicado. Rode <code>npm run seed:docs</code>.</p>'; return; }
    mount.innerHTML = `
      <div class="docs-layout">
        <div class="docs-list">
          ${docs.map((doc, i) => `<button class="doc-link${i === 0 ? ' active' : ''}" data-i="${i}">${icon('doc')} ${(doc.path || doc.id)}</button>`).join('')}
        </div>
        <div class="doc-view" id="docView"></div>
      </div>`;
    const view = mount.querySelector('#docView');
    const show = (i) => {
      const docu = docs[i];
      view.innerHTML = `<div class="doc-path">${docu.path || docu.id}</div><pre>${escapeHtml(docu.content || '')}</pre>`;
    };
    mount.querySelectorAll('.doc-link').forEach((b) => b.addEventListener('click', () => {
      mount.querySelectorAll('.doc-link').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      show(Number(b.dataset.i));
      view.scrollIntoView({ block: 'nearest' });
    }));
    show(0);
  } catch (err) {
    mount.innerHTML = `<p style="color:#ff6b6b;margin-bottom:12px">Falha ao carregar documentos: ${escapeHtml(err.message || '')}</p><button class="btn btn-ghost" id="docsRetry">Tentar de novo</button>`;
    mount.querySelector('#docsRetry').addEventListener('click', () => loadDocs(root));
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// So aceita http(s) em href (bloqueia javascript:/data:/vbscript:). Retorna a URL
// segura ou null.
function safeUrl(u) {
  try { const url = new URL(String(u || '')); return (url.protocol === 'http:' || url.protocol === 'https:') ? url.href : null; }
  catch { return null; }
}

function fmtDate(ts) {
  let d;
  if (ts && typeof ts.toDate === 'function') d = ts.toDate();
  else if (ts && ts.seconds) d = new Date(ts.seconds * 1000);
  else if (typeof ts === 'number') d = new Date(ts);
  else return '';
  try {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
      ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

const tsMs = (ts) => (ts && typeof ts.toDate === 'function' ? ts.toDate().getTime() : ts && ts.seconds ? ts.seconds * 1000 : typeof ts === 'number' ? ts : 0);

// CRM premium: metricas de funil + Kanban (drag-and-drop) + drawer com timeline.
async function loadCrm(root) {
  const mount = root.querySelector('#crmMount');
  if (!mount) return;

  let leads = [];
  try { leads = await getLeads(); }
  catch (err) {
    mount.innerHTML = `<p style="color:#ff6b6b;margin-bottom:12px">Falha ao carregar leads: ${escapeHtml(err.message || '')}</p><button class="btn btn-ghost" id="crmRetry">Tentar de novo</button>`;
    mount.querySelector('#crmRetry').addEventListener('click', () => loadCrm(root));
    return;
  }

  let busca = '', fOrigem = 'todos', fCanal = 'todos', dragId = null, openLeadId = null;

  const canalBadge = (l) => { const c = CANAIS[l.canal]; return c ? `<span class="crm-canal" style="--cc:${c.color}" title="${c.label}">${icon(c.icon)}</span>` : ''; };

  mount.innerHTML = `
    <div class="crm">
      <div class="crm-metrics" id="crmMetrics"></div>
      <div class="crm-bar">
        <div class="crm-tools">
          <input class="crm-search" id="crmSearch" type="search" placeholder="Buscar nome, contato, empresa, assunto…">
          <select class="crm-filter" id="crmOrigem">
            <option value="todos">Todas as origens</option>
            <option value="form">Formulário</option>
            <option value="chat">Chat IA</option>
          </select>
          <select class="crm-filter" id="crmCanal">
            <option value="todos">Todos os canais</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">E-mail</option>
            <option value="instagram">Instagram</option>
          </select>
          <button class="btn btn-ghost" id="crmRefresh">${icon('spark')} Atualizar</button>
        </div>
      </div>
      ${leads.length ? '' : '<p style="color:var(--text-dim);margin:0 0 14px">Nenhum lead ainda. Eles aparecem aqui quando alguém usa o formulário “Fale com a VNMAX” ou pede contato no chat.</p>'}
      <div class="crm-board" id="crmBoard">
        ${STAGES.map((s) => `
          <div class="crm-col" data-stage="${s.key}" style="--sc:${s.color}">
            <div class="crm-col-head"><span class="crm-dot" style="background:${s.color}"></span>${s.label}<span class="crm-count" data-count="${s.key}">0</span></div>
            <div class="crm-col-body" data-stage="${s.key}"></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="crm-drawer" id="crmDrawer" hidden></div>`;

  const board = mount.querySelector('#crmBoard');
  const metricsEl = mount.querySelector('#crmMetrics');
  const drawer = mount.querySelector('#crmDrawer');

  const visiveis = () => {
    const q = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (fOrigem !== 'todos' && (l.origem || 'chat') !== fOrigem) return false;
      if (fCanal !== 'todos' && (l.canal || '') !== fCanal) return false;
      if (!q) return true;
      return [l.nome, l.contato, l.email, l.whatsapp, l.empresa, l.assunto, l.segmento, l.mensagem].some((v) => (v || '').toLowerCase().includes(q));
    });
  };

  const cardHtml = (l) => {
    const origem = l.origem === 'form' ? 'form' : 'chat';
    return `<div class="crm-card" draggable="true" data-id="${l.id}">
      <div class="crm-card-top"><strong>${escapeHtml(l.nome || '—')}</strong>${canalBadge(l)}</div>
      <div class="crm-card-meta"><span class="crm-origem ${origem}">${origem === 'form' ? 'Formulário' : 'Chat IA'}</span>${l.segmento ? `<span class="crm-seg">${escapeHtml(l.segmento)}</span>` : ''}</div>
      <div class="crm-card-contato">${escapeHtml(l.contato || l.email || l.whatsapp || '')}</div>
      ${l.assunto ? `<div class="crm-card-assunto">${escapeHtml(l.assunto)}</div>` : ''}
      <div class="crm-card-date">${icon('clock')} ${fmtDate(l.updatedAt || l.createdAt)}</div>
    </div>`;
  };

  function metricas() {
    const total = leads.length;
    const fechados = leads.filter((l) => leadStage(l) === 'FECHADO').length;
    const perdidos = leads.filter((l) => leadStage(l) === 'PERDIDO').length;
    const abertos = total - fechados - perdidos;
    const conv = total ? Math.round((fechados / total) * 100) : 0;
    const semana = Date.now() - 7 * 86400000;
    const novos = leads.filter((l) => tsMs(l.createdAt) >= semana).length;
    return [
      { v: total, l: 'Total de leads' },
      { v: abertos, l: 'Em aberto' },
      { v: fechados, l: 'Fechados' },
      { v: conv + '%', l: 'Conversão' },
      { v: novos, l: 'Novos (7 dias)' },
    ];
  }

  function render() {
    metricsEl.innerHTML = metricas().map((m) => `<div class="crm-metric"><div class="v">${m.v}</div><div class="l">${m.l}</div></div>`).join('');
    const vis = visiveis();
    STAGES.forEach((s) => {
      const body = board.querySelector(`.crm-col-body[data-stage="${s.key}"]`);
      const items = vis.filter((l) => leadStage(l) === s.key).sort((a, b) => tsMs(b.updatedAt || b.createdAt) - tsMs(a.updatedAt || a.createdAt));
      body.innerHTML = items.map(cardHtml).join('');
      board.querySelector(`[data-count="${s.key}"]`).textContent = items.length;
    });
    board.querySelectorAll('.crm-card').forEach((card) => {
      card.addEventListener('dragstart', (e) => { dragId = card.dataset.id; card.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      card.addEventListener('dragend', () => { dragId = null; card.classList.remove('dragging'); });
      card.addEventListener('click', () => openDrawer(card.dataset.id));
    });
  }

  board.querySelectorAll('.crm-col-body').forEach((body) => {
    body.addEventListener('dragover', (e) => { e.preventDefault(); body.classList.add('drop'); });
    body.addEventListener('dragleave', () => body.classList.remove('drop'));
    body.addEventListener('drop', (e) => { e.preventDefault(); body.classList.remove('drop'); if (dragId) move(dragId, body.dataset.stage); });
  });

  async function move(id, stage) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || leadStage(lead) === stage) return;
    const prevStage = lead.stage, prevHist = lead.historico;
    lead.stage = stage;
    lead.historico = [...(lead.historico || []), { tipo: 'stage', texto: `Movido para ${stageOf(stage).label}`, em: Date.now() }];
    render();
    if (openLeadId === id) openDrawer(id);
    try { await updateLeadStage(id, stage); }
    catch (e) { lead.stage = prevStage; lead.historico = prevHist; render(); if (openLeadId === id) openDrawer(id); alert('Não foi possível mover o lead: ' + e.message); }
  }

  function openDrawer(id) {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    openLeadId = id;
    const origemLabel = l.origem === 'form' ? 'Formulário' : 'Chat IA';
    const eventos = [...(l.historico || [])].sort((a, b) => (b.em || 0) - (a.em || 0));
    drawer.innerHTML = `
      <div class="crm-drawer-inner">
        <button class="crm-drawer-x" id="cdX" aria-label="Fechar">&times;</button>
        <div class="crm-drawer-head"><h3>${escapeHtml(l.nome || '—')}</h3><span class="crm-origem ${l.origem === 'form' ? 'form' : 'chat'}">${origemLabel}</span>${canalBadge(l)}</div>

        <div class="crm-chips">${STAGES.map((s) => `<button class="crm-chip${leadStage(l) === s.key ? ' on' : ''}" data-stage="${s.key}" style="--cc:${s.color}">${s.label}</button>`).join('')}</div>

        <dl class="crm-fields">
          ${l.contato ? `<dt>Contato</dt><dd>${escapeHtml(l.contato)}</dd>` : ''}
          ${l.email ? `<dt>E-mail</dt><dd><a href="mailto:${encodeURIComponent(l.email)}">${escapeHtml(l.email)}</a></dd>` : ''}
          ${l.whatsapp ? `<dt>WhatsApp</dt><dd>${escapeHtml(l.whatsapp)}</dd>` : ''}
          ${l.empresa ? `<dt>Empresa</dt><dd>${escapeHtml(l.empresa)}</dd>` : ''}
          ${l.assunto ? `<dt>Assunto</dt><dd>${escapeHtml(l.assunto)}</dd>` : ''}
          <dt>Criado</dt><dd>${fmtDate(l.createdAt) || '—'}</dd>
        </dl>

        <div class="crm-edit">
          <label>Segmento / nicho<input id="cdSeg" type="text" maxlength="120" value="${escapeHtml(l.segmento || '')}" placeholder="Ex.: varejo, saúde, indústria…"></label>
          <label>Observação interna<textarea id="cdObs" rows="2" maxlength="2000" placeholder="Anotação da equipe…">${escapeHtml(l.observacao || '')}</textarea></label>
          <button class="btn btn-ghost" id="cdSave">Salvar dados</button>
        </div>

        <div class="crm-notes">
          <h4>Atividade</h4>
          <div class="crm-timeline">${eventos.length ? eventos.map((ev) => `
            <div class="crm-tl-item"><span class="crm-tl-ico">${icon(EVENT_ICON[ev.tipo] || 'spark')}</span><div><p>${escapeHtml(ev.texto || '')}</p><span>${fmtDate(ev.em)}</span></div></div>`).join('') : '<div class="crm-note-empty">Sem atividade ainda.</div>'}</div>
          <div class="crm-note-add"><textarea id="cdNoteText" rows="2" placeholder="Registrar nota / atividade…"></textarea><button class="btn btn-ghost" id="cdNoteBtn">Adicionar nota</button></div>
        </div>

        <div class="crm-drawer-actions"><button class="btn crm-del" id="cdDel">Excluir lead</button></div>
      </div>`;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('show'));

    const close = () => { openLeadId = null; drawer.classList.remove('show'); setTimeout(() => { drawer.hidden = true; }, 180); };
    drawer.querySelector('#cdX').addEventListener('click', close);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) close(); });
    drawer.querySelectorAll('.crm-chip').forEach((ch) => ch.addEventListener('click', () => move(id, ch.dataset.stage)));

    drawer.querySelector('#cdSave').addEventListener('click', async (e) => {
      const seg = drawer.querySelector('#cdSeg').value.trim();
      const obs = drawer.querySelector('#cdObs').value.trim();
      const b = e.currentTarget; b.disabled = true;
      try { await updateLeadFields(id, { segmento: seg, observacao: obs }); l.segmento = seg; l.observacao = obs; render(); b.textContent = 'Salvo ✓'; setTimeout(() => { const x = drawer.querySelector('#cdSave'); if (x) { x.textContent = 'Salvar dados'; x.disabled = false; } }, 1400); }
      catch (err) { b.disabled = false; alert('Falha ao salvar: ' + err.message); }
    });

    drawer.querySelector('#cdNoteBtn').addEventListener('click', async () => {
      const ta = drawer.querySelector('#cdNoteText');
      const texto = ta.value.trim();
      if (!texto) return;
      ta.disabled = true;
      try { await addLeadEvent(id, 'nota', texto); l.historico = [...(l.historico || []), { tipo: 'nota', texto, em: Date.now() }]; openDrawer(id); }
      catch (e) { ta.disabled = false; alert('Falha ao salvar nota: ' + e.message); }
    });

    drawer.querySelector('#cdDel').addEventListener('click', async () => {
      if (!confirm('Excluir este lead definitivamente?')) return;
      try { await deleteLead(id); leads = leads.filter((x) => x.id !== id); close(); render(); }
      catch (e) { alert('Falha ao excluir: ' + e.message); }
    });
  }

  mount.querySelector('#crmSearch').addEventListener('input', (e) => { busca = e.target.value; render(); });
  mount.querySelector('#crmOrigem').addEventListener('change', (e) => { fOrigem = e.target.value; render(); });
  mount.querySelector('#crmCanal').addEventListener('change', (e) => { fCanal = e.target.value; render(); });
  mount.querySelector('#crmRefresh').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try { leads = await getLeads(); render(); } catch (err) { alert('Falha ao atualizar: ' + err.message); } finally { b.disabled = false; }
  });

  render();
}

/* ---------------- SOCIAL: composer multi-rede + adaptacao IA + agenda --------------- */
const SOCIAL_ICON = { instagram: 'instagram', twitter: 'spark', linkedin: 'linkedin', facebook: 'megaphone', tiktok: 'tiktok', youtube: 'youtube', threads: 'spark', bluesky: 'bluesky', pinterest: 'tag', reddit: 'spark', telegram: 'send', gmb: 'tag' };
const SOCIAL_STATUS = {
  rascunho: { l: 'Rascunho', c: '#8a8a93', ord: 2 }, aguardando: { l: 'Aguardando aprovação', c: '#f5b73c', ord: 0 },
  aprovado: { l: 'Aprovado · publicar', c: '#22d3ee', ord: 1 }, agendado: { l: 'Agendado', c: '#2f7bff', ord: 1 },
  publicado: { l: 'Publicado', c: '#36d399', ord: 3 }, rejeitado: { l: 'Rejeitado', c: '#ff4d4f', ord: 2 },
};
const tomos = [['profissional', 'Profissional'], ['inspirador', 'Inspirador'], ['descontraido', 'Descontraído'], ['tecnico', 'Técnico'], ['vendedor', 'Persuasivo']];

// "Abrir a rede com o texto pronto" (publicacao semiautomatica). Onde a rede tem
// URL de intent/compose, prefil o texto; senao, abre o site para colar.
function socialIntent(platform, caption, media) {
  const t = encodeURIComponent(caption || '');
  const u = (media && media[0]) ? encodeURIComponent(media[0]) : '';
  switch (platform) {
    case 'twitter': return `https://twitter.com/intent/tweet?text=${t}`;
    case 'threads': return `https://www.threads.net/intent/post?text=${t}`;
    case 'bluesky': return `https://bsky.app/intent/compose?text=${t}`;
    case 'linkedin': return `https://www.linkedin.com/feed/?shareActive=true&text=${t}`;
    case 'reddit': return `https://www.reddit.com/submit?title=${encodeURIComponent((caption || '').slice(0, 290))}`;
    case 'telegram': return u ? `https://t.me/share/url?url=${u}&text=${t}` : 'https://web.telegram.org/';
    case 'facebook': return u ? `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}` : 'https://www.facebook.com/';
    default: return null;
  }
}
const SOCIAL_SITE = { instagram: 'https://www.instagram.com/', tiktok: 'https://www.tiktok.com/upload', youtube: 'https://studio.youtube.com/', pinterest: 'https://www.pinterest.com/pin-builder/', gmb: 'https://business.google.com/posts', facebook: 'https://www.facebook.com/', telegram: 'https://web.telegram.org/', whatsapp: 'https://web.whatsapp.com/' };

async function loadSocial(root) {
  const mount = root.querySelector('#socialMount');
  if (!mount) return;

  let status, posts = [];
  try { status = await socialStatus(); }
  catch (err) {
    mount.innerHTML = `<p style="color:#ff6b6b;margin-bottom:12px">Não foi possível conectar ao servidor de publicação: ${escapeHtml(err.message || '')}</p><button class="btn btn-ghost" id="soRetry">Tentar de novo</button>`;
    mount.querySelector('#soRetry').addEventListener('click', () => loadSocial(root));
    return;
  }
  let agendaError = '';
  try { posts = await getSocialPosts(); } catch (e) { agendaError = e.message || 'Falha ao carregar a agenda.'; }

  const platforms = status.platforms || [];
  const byKey = Object.fromEntries(platforms.map((p) => [p.key, p]));
  const selected = new Set();
  let variants = {};
  let busy = false;
  let editId = null;     // id do rascunho em edicao (null = novo)

  const netChip = (p) => `<button class="so-net" data-net="${p.key}" title="${p.requiresMedia ? 'Exige imagem/vídeo' : ''}">
      <span class="so-net-ico">${icon(SOCIAL_ICON[p.key] || 'spark')}</span>${escapeHtml(p.label)}
    </button>`;

  mount.innerHTML = `
    <div class="social">
      <div class="so-status">
        <span class="so-badge ${status.nvidia ? 'ok' : 'off'}">IA ${status.nvidia ? 'ativa' : 'inativa'}</span>
        <span class="so-conn">${icon('layers') || ''}${platforms.length} redes</span>
        <span class="so-hint">Fluxo: rascunho → aprovação → publicar (você confirma a postagem).</span>
      </div>

      <div class="so-grid">
        <div class="so-compose">
          <div class="so-compose-head"><strong id="soMode">Nova publicação</strong><button class="btn btn-ghost so-mini" id="soNew" hidden>+ Nova</button></div>
          <label class="so-label">Conteúdo base</label>
          <textarea id="soContent" rows="5" placeholder="Escreva a ideia central do post. A IA adapta para cada rede respeitando os limites."></textarea>

          <label class="so-label">Mídia (URLs públicas https, separadas por espaço ou vírgula) — opcional</label>
          <input id="soMedia" type="text" placeholder="https://… .jpg / .mp4">

          <label class="so-label">Redes</label>
          <div class="so-nets">${platforms.map(netChip).join('')}</div>

          <div class="so-row">
            <label class="so-label" style="margin:0">Tom</label>
            <select id="soTone" class="crm-filter">${tomos.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
            <button class="btn btn-ghost" id="soAdapt">${icon('brain')} Adaptar por rede (IA)</button>
          </div>

          <div id="soVariants" class="so-variants"></div>

          <label class="so-label">Agendar (opcional) — define a data para publicar depois de aprovado</label>
          <div class="so-publish">
            <input id="soWhen" type="datetime-local" class="crm-filter">
            <button class="btn btn-ghost" id="soDraft">${icon('doc')} Salvar rascunho</button>
            <button class="btn btn-primary" id="soSubmit">${icon('send')} Enviar p/ aprovação</button>
          </div>
          <div id="soMsg" class="so-msg"></div>
        </div>

        <div class="so-agenda">
          <div class="so-agenda-head"><h3>Fluxo de publicação</h3><button class="btn btn-ghost so-mini" id="soRefresh">${icon('spark')} Atualizar</button></div>
          <div id="soList"></div>
        </div>
      </div>
    </div>`;

  const $ = (s) => mount.querySelector(s);
  const msg = (text, kind) => { const el = $('#soMsg'); el.textContent = text || ''; el.className = 'so-msg' + (kind ? ' ' + kind : ''); };

  // -- selecao de redes --
  function syncNetUI() { mount.querySelectorAll('.so-net').forEach((b) => b.classList.toggle('on', selected.has(b.dataset.net))); }
  mount.querySelectorAll('.so-net').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.net;
    if (selected.has(k)) selected.delete(k); else selected.add(k);
    b.classList.toggle('on', selected.has(k));
  }));

  // Carrega um rascunho/rejeitado no composer para edicao.
  function editDraft(p) {
    editId = p.id;
    $('#soContent').value = p.content || '';
    $('#soMedia').value = (p.mediaUrls || []).join(' ');
    selected.clear(); (p.platforms || []).forEach((k) => selected.add(k)); syncNetUI();
    variants = {}; (p.targets || []).forEach((t) => { variants[t.platform] = t.caption || ''; }); renderVariants();
    $('#soWhen').value = p.scheduleAt ? new Date(p.scheduleAt - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    $('#soMode').textContent = 'Editando rascunho'; $('#soNew').hidden = false;
    msg(''); mount.querySelector('.so-compose').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function clearComposer() {
    editId = null; $('#soContent').value = ''; $('#soMedia').value = ''; $('#soWhen').value = '';
    selected.clear(); syncNetUI(); variants = {}; renderVariants();
    $('#soMode').textContent = 'Nova publicação'; $('#soNew').hidden = true; msg('');
  }
  $('#soNew').addEventListener('click', clearComposer);

  // -- editores de variantes (apos adaptar) --
  function renderVariants() {
    const cont = $('#soVariants');
    const keys = Object.keys(variants);
    if (!keys.length) { cont.innerHTML = ''; return; }
    cont.innerHTML = `<div class="so-vhead">Versões por rede (edite à vontade)</div>` + keys.map((k) => {
      const p = byKey[k] || { label: k, limit: 0 };
      const v = variants[k] || '';
      return `<div class="so-var" data-net="${k}">
        <div class="so-var-top"><span class="so-var-name">${icon(SOCIAL_ICON[k] || 'spark')} ${escapeHtml(p.label)}</span><span class="so-count" data-for="${k}">${v.length}/${p.limit}</span></div>
        <textarea class="so-var-text" data-net="${k}" rows="3">${escapeHtml(v)}</textarea>
      </div>`;
    }).join('');
    cont.querySelectorAll('.so-var-text').forEach((ta) => ta.addEventListener('input', () => {
      const k = ta.dataset.net; variants[k] = ta.value;
      const c = cont.querySelector(`.so-count[data-for="${k}"]`); const lim = (byKey[k] || {}).limit || 0;
      if (c) { c.textContent = `${ta.value.length}/${lim}`; c.classList.toggle('over', lim && ta.value.length > lim); }
    }));
  }

  function collectMedia() {
    return ($('#soMedia').value || '').split(/[\s,]+/).map((u) => u.trim()).filter((u) => /^https:\/\/\S+$/i.test(u));
  }

  // -- adaptar por IA --
  $('#soAdapt').addEventListener('click', async () => {
    const content = $('#soContent').value.trim();
    const chosen = [...selected];
    if (!content) return msg('Escreva o conteúdo base primeiro.', 'err');
    if (!chosen.length) return msg('Selecione ao menos uma rede.', 'err');
    if (busy) return; busy = true;
    const b = $('#soAdapt'); b.disabled = true; b.textContent = 'Adaptando…'; msg('');
    try {
      const r = await adaptPosts({ content, platforms: chosen, tone: $('#soTone').value });
      variants = r.variants || {};
      renderVariants();
      const miss = (r.missing || []).map((k) => (byKey[k] || {}).label || k);
      msg(miss.length ? `Adaptado. Atenção: ${miss.join(', ')} não foi adaptado — revise manualmente.` : 'Textos adaptados. Revise e publique ou agende.', miss.length ? 'err' : 'ok');
    } catch (e) { msg('Falha ao adaptar: ' + e.message, 'err'); }
    finally { busy = false; b.disabled = false; b.innerHTML = `${icon('brain')} Adaptar por rede (IA)`; }
  });

  // -- salvar rascunho / enviar para aprovacao --
  async function refresh() { posts = await getSocialPosts().catch(() => posts); agendaError = ''; renderList(); }

  async function saveDraft(submit) {
    const content = $('#soContent').value.trim();
    const chosen = [...selected];
    const mediaUrls = collectMedia();
    if (!chosen.length) return msg('Selecione ao menos uma rede.', 'err');
    if (!content && !mediaUrls.length) return msg('Escreva um conteúdo ou informe uma mídia.', 'err');
    let scheduleAt = null;
    const v = $('#soWhen').value;
    if (v) { const ms = new Date(v).getTime(); if (!Number.isFinite(ms) || ms < Date.now() + 120000) return msg('O agendamento precisa ser ao menos 2 min no futuro.', 'err'); scheduleAt = ms; }
    if (busy) return; busy = true;
    const dBtn = $('#soDraft'), sBtn = $('#soSubmit'); dBtn.disabled = sBtn.disabled = true; msg('Salvando…');
    try {
      const payload = { content, platforms: chosen, variants, tone: $('#soTone').value, mediaUrls };
      if (scheduleAt) payload.scheduleAt = scheduleAt;
      if (editId) payload.id = editId;
      const r = await saveCampaign(payload);
      if (submit) await submitCampaign(r.id);
      msg(submit ? 'Enviado para aprovação.' : 'Rascunho salvo.', 'ok');
      clearComposer();
      await refresh();
    } catch (e) { msg('Falha ao salvar: ' + e.message, 'err'); }
    finally { busy = false; dBtn.disabled = sBtn.disabled = false; }
  }
  $('#soDraft').addEventListener('click', () => saveDraft(false));
  $('#soSubmit').addEventListener('click', () => saveDraft(true));

  $('#soRefresh').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try { await refresh(); } catch (err) { msg('Falha ao atualizar: ' + err.message, 'err'); }
    finally { b.disabled = false; }
  });

  // -- fluxo de publicacao (lista de campanhas por estado) --
  const lbl = (k) => (byKey[k] || {}).label || k;
  const findTarget = (id, net) => { const p = posts.find((x) => x.id === id); return p && (p.targets || []).find((t) => t.platform === net); };

  function renderList() {
    const list = $('#soList');
    if (agendaError && !posts.length) { list.innerHTML = `<div class="so-empty" style="color:#ff6b6b">Não foi possível carregar: ${escapeHtml(agendaError)}</div>`; return; }
    if (!posts.length) { list.innerHTML = '<div class="so-empty">Nada ainda. Crie a primeira publicação ao lado.</div>'; return; }
    const ordered = [...posts].sort((a, b) => {
      const oa = (SOCIAL_STATUS[a.status] || {}).ord ?? 9, ob = (SOCIAL_STATUS[b.status] || {}).ord ?? 9;
      return oa - ob || tsMs(b.updatedAt || b.createdAt) - tsMs(a.updatedAt || a.createdAt);
    });
    list.innerHTML = ordered.map((p) => {
      const st = SOCIAL_STATUS[p.status] || { l: p.status, c: '#8a8a93' };
      const targets = Array.isArray(p.targets) ? p.targets : [];
      const when = p.scheduleAt ? `${p.scheduleAt > Date.now() ? 'Publicar em' : 'Era para'} ${fmtDate(p.scheduleAt)}` : fmtDate(p.createdAt);
      const ready = p.status === 'aprovado' || p.status === 'agendado' || p.status === 'publicado';

      const chips = targets.map((t) => {
        const ok = t.posted ? ' done' : '';
        const link = safeUrl(t.permalink);
        const ic = `${icon(SOCIAL_ICON[t.platform] || 'spark')} ${escapeHtml(lbl(t.platform))}`;
        return `<span class="so-target${ok}">${link ? `<a href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer">${ic}</a>` : ic}${t.posted ? ' ✓' : ''}</span>`;
      }).join('');

      // Painel de publicacao semiautomatica (apenas quando aprovado/agendado).
      const pub = ready ? `<div class="so-pub">${targets.map((t) => {
        const intent = socialIntent(t.platform, t.caption, p.mediaUrls) || SOCIAL_SITE[t.platform] || null;
        const openBtn = intent ? `<a class="btn btn-ghost so-mini" href="${escapeHtml(intent)}" target="_blank" rel="noopener noreferrer">Abrir ${escapeHtml(lbl(t.platform))}</a>` : '';
        return `<div class="so-pub-row">
          <span class="so-pub-net">${icon(SOCIAL_ICON[t.platform] || 'spark')} ${escapeHtml(lbl(t.platform))}</span>
          <button class="btn btn-ghost so-mini so-copy" data-id="${p.id}" data-net="${t.platform}">Copiar texto</button>
          ${openBtn}
          ${t.posted
            ? `<button class="btn btn-ghost so-mini so-unpost" data-id="${p.id}" data-net="${t.platform}">Reabrir</button>`
            : `<button class="btn btn-ghost so-mini so-mark" data-id="${p.id}" data-net="${t.platform}">Marcar publicado</button>`}
        </div>`;
      }).join('')}</div>` : '';

      // Acoes por estado.
      let actions = '';
      if (p.status === 'rascunho' || p.status === 'rejeitado') {
        actions = `<button class="btn btn-ghost so-mini so-edit" data-id="${p.id}">Editar</button>
          <button class="btn btn-ghost so-mini so-do-submit" data-id="${p.id}">Enviar p/ aprovação</button>
          <button class="btn btn-ghost so-mini so-del" data-id="${p.id}">Excluir</button>`;
      } else if (p.status === 'aguardando') {
        actions = `<button class="btn btn-primary so-mini so-approve" data-id="${p.id}">Aprovar</button>
          <button class="btn btn-ghost so-mini so-reject" data-id="${p.id}">Rejeitar</button>`;
      } else {
        actions = `<button class="btn btn-ghost so-mini so-del" data-id="${p.id}">Excluir</button>`;
      }

      return `<div class="so-item">
        <div class="so-item-top"><span class="so-tag" style="--tc:${st.c}">${escapeHtml(st.l)}</span><span class="so-when">${icon('clock')} ${escapeHtml(when)}</span></div>
        <div class="so-item-body">${escapeHtml((p.content || '').slice(0, 200)) || '<i>(sem texto)</i>'}</div>
        <div class="so-targets">${chips}</div>
        ${p.status === 'rejeitado' && p.rejectReason ? `<div class="so-reject">Rejeitado: ${escapeHtml(p.rejectReason)}</div>` : ''}
        ${p.approvedByEmail ? `<div class="so-meta">Aprovado por ${escapeHtml(p.approvedByEmail)}</div>` : ''}
        ${pub}
        <div class="so-item-actions">${actions}</div>
      </div>`;
    }).join('');

    // wiring
    const act = async (el, fn, confirmMsg) => {
      if (confirmMsg && !confirm(confirmMsg)) return;
      el.disabled = true;
      try { await fn(); await refresh(); } catch (e) { el.disabled = false; alert(e.message); }
    };
    list.querySelectorAll('.so-edit').forEach((b) => b.addEventListener('click', () => { const p = posts.find((x) => x.id === b.dataset.id); if (p) editDraft(p); }));
    list.querySelectorAll('.so-do-submit').forEach((b) => b.addEventListener('click', () => act(b, () => submitCampaign(b.dataset.id))));
    list.querySelectorAll('.so-approve').forEach((b) => b.addEventListener('click', () => act(b, () => approveCampaign(b.dataset.id))));
    list.querySelectorAll('.so-reject').forEach((b) => b.addEventListener('click', () => { const r = prompt('Motivo da rejeição:'); if (r === null) return; act(b, () => rejectCampaign(b.dataset.id, r)); }));
    list.querySelectorAll('.so-del').forEach((b) => b.addEventListener('click', () => act(b, () => deleteCampaign(b.dataset.id), 'Excluir esta campanha?')));
    list.querySelectorAll('.so-mark').forEach((b) => b.addEventListener('click', () => { const url = prompt('Link do post publicado (opcional):') || ''; act(b, () => markPosted(b.dataset.id, b.dataset.net, url.trim() || null, false)); }));
    list.querySelectorAll('.so-unpost').forEach((b) => b.addEventListener('click', () => act(b, () => markPosted(b.dataset.id, b.dataset.net, null, true))));
    list.querySelectorAll('.so-copy').forEach((b) => b.addEventListener('click', async () => {
      const t = findTarget(b.dataset.id, b.dataset.net); if (!t) return;
      try { await navigator.clipboard.writeText(t.caption || ''); b.textContent = 'Copiado ✓'; setTimeout(() => { b.textContent = 'Copiar texto'; }, 1400); }
      catch { alert('Não foi possível copiar. Selecione o texto manualmente.'); }
    }));
  }

  renderList();
}

/* ---------------- VÍDEO: worker de edição (video-use + hyperframes) --------------- */
const VIDEO_STATUS = {
  fila: { l: 'Na fila', c: '#f5b73c' }, processando: { l: 'Processando', c: '#2f7bff' },
  pronto: { l: 'Pronto', c: '#36d399' }, erro: { l: 'Erro', c: '#ff4d4f' },
};

async function loadVideo(root) {
  const mount = root.querySelector('#videoMount');
  if (!mount) return;

  let caps, jobs = [], pollT = null;
  try { caps = await videoTools(); }
  catch (err) {
    mount.innerHTML = `<p style="color:#ff6b6b;margin-bottom:12px">Não foi possível conectar ao servidor de vídeo: ${escapeHtml(err.message || '')}</p><button class="btn btn-ghost" id="viRetry">Tentar de novo</button>`;
    mount.querySelector('#viRetry').addEventListener('click', () => loadVideo(root));
    return;
  }
  let jobsError = '';
  try { jobs = await getVideoJobs(); } catch (e) { jobsError = e.message || 'Falha ao carregar os jobs.'; }

  const can = caps.can || {};
  const cap = (k, label) => `<span class="so-badge ${can[k] ? 'ok' : 'off'}">${label} ${can[k] ? '✓' : '—'}</span>`;

  mount.innerHTML = `
    <div class="social">
      <div class="so-status">
        <span class="so-badge ${can.worker ? 'ok' : 'off'}">Worker ${can.worker ? 'ativo' : 'inativo'}</span>
        ${cap('vertical', '9:16')}${cap('normalize', 'Áudio -14 LUFS')}${cap('color', 'Color')}${cap('subtitles', 'Legendas')}${cap('intro', 'Intro')}
      </div>
      ${!can.worker ? '<div class="so-warn">Worker desativado. No servidor: <code>cd server && npm install && bash install-video.sh</code>, ative <b>VIDEO_WORKER_ENABLED=true</b> no <code>.env</code> e reinicie. Você pode criar jobs mesmo assim — ficam na fila.</div>' : ''}

      <div class="so-grid">
        <div class="so-compose">
          <div class="so-compose-head"><strong>Novo vídeo</strong></div>
          <label class="so-label">Origem</label>
          <div class="so-row">
            <select id="viType" class="crm-filter"><option value="url">URL (https)</option><option value="inbox">Arquivo no inbox do servidor</option></select>
            <input id="viValue" type="text" placeholder="https://… ou nome-do-arquivo.mp4" style="flex:1;min-width:200px">
          </div>

          <label class="so-label">Roteiro / legendas (vira legenda queimada se marcar “Legendas”)</label>
          <textarea id="viRoteiro" rows="3" placeholder="Cole o roteiro/locução. Será fatiado e cronometrado como legenda no vídeo."></textarea>

          <label class="so-label">Opções (FFmpeg — leve, sem Chrome)</label>
          <div class="vi-opts">
            <label><input type="checkbox" id="viVertical" checked> Formato 9:16 (vertical)</label>
            <label><input type="checkbox" id="viNormalize" checked> Normalizar áudio (-14 LUFS)</label>
            <label><input type="checkbox" id="viSubs"> Queimar legendas</label>
            <label><input type="checkbox" id="viIntro"> Intro de marca</label>
            <label>Color: <select id="viColor" class="crm-filter"><option value="none">Nenhum</option><option value="cinematic">Cinematográfico</option><option value="neutral">Neutro</option></select></label>
          </div>
          <div class="so-row" id="viIntroFields" hidden>
            <input id="viIntroTitle" type="text" placeholder="Título da intro (ex.: VN MAX)" style="flex:1">
            <input id="viIntroSub" type="text" placeholder="Subtítulo" style="flex:1">
          </div>

          <div class="so-publish">
            <button class="btn btn-primary" id="viSubmit">${icon('send')} Enviar para edição</button>
          </div>
          <div id="viMsg" class="so-msg"></div>
        </div>

        <div class="so-agenda">
          <div class="so-agenda-head"><h3>Jobs</h3><button class="btn btn-ghost so-mini" id="viRefresh">${icon('spark')} Atualizar</button></div>
          <div id="viList"></div>
        </div>
      </div>
    </div>`;

  const $ = (s) => mount.querySelector(s);
  const msg = (t, k) => { const el = $('#viMsg'); el.textContent = t || ''; el.className = 'so-msg' + (k ? ' ' + k : ''); };
  $('#viIntro').addEventListener('change', (e) => { $('#viIntroFields').hidden = !e.target.checked; });

  async function refresh() {
    try { jobs = await getVideoJobs(); jobsError = ''; } catch (e) { jobsError = e.message; }
    renderJobs();
    const active = jobs.some((j) => j.status === 'fila' || j.status === 'processando');
    if (active && !pollT) pollT = setInterval(refresh, 5000);
    if (!active && pollT) { clearInterval(pollT); pollT = null; }
  }

  $('#viSubmit').addEventListener('click', async () => {
    const type = $('#viType').value, value = $('#viValue').value.trim();
    if (!value) return msg('Informe a URL ou o nome do arquivo.', 'err');
    const b = $('#viSubmit'); b.disabled = true; msg('Enviando…');
    try {
      await createVideoJob({
        source: { type, value },
        options: {
          vertical: $('#viVertical').checked, normalize: $('#viNormalize').checked,
          subtitles: $('#viSubs').checked, intro: $('#viIntro').checked,
          color: $('#viColor').value, roteiro: $('#viRoteiro').value.trim(),
          introTitle: $('#viIntroTitle').value.trim(), introSubtitle: $('#viIntroSub').value.trim(),
        },
      });
      $('#viValue').value = ''; $('#viRoteiro').value = '';
      msg('Job criado.', 'ok');
      await refresh();
    } catch (e) { msg('Falha: ' + e.message, 'err'); }
    finally { b.disabled = false; }
  });

  $('#viRefresh').addEventListener('click', async (e) => { e.currentTarget.disabled = true; try { await refresh(); } finally { e.currentTarget.disabled = false; } });

  function renderJobs() {
    const list = $('#viList');
    if (jobsError && !jobs.length) { list.innerHTML = `<div class="so-empty" style="color:#ff6b6b">${escapeHtml(jobsError)}</div>`; return; }
    if (!jobs.length) { list.innerHTML = '<div class="so-empty">Nenhum job ainda.</div>'; return; }
    list.innerHTML = jobs.map((j) => {
      const st = VIDEO_STATUS[j.status] || { l: j.status, c: '#8a8a93' };
      const url = safeUrl(j.outputUrl);
      const notes = Array.isArray(j.notes) ? j.notes : [];
      return `<div class="so-item">
        <div class="so-item-top"><span class="so-tag" style="--tc:${st.c}">${escapeHtml(st.l)}</span><span class="so-when">${icon('clock')} ${fmtDate(j.createdAt)}</span></div>
        <div class="so-item-body">${escapeHtml(((j.source && j.source.value) || '').slice(0, 120))}${(j.options && j.options.roteiro) ? ' · ' + escapeHtml(j.options.roteiro.slice(0, 70)) : ''}</div>
        ${j.status === 'processando' || j.status === 'fila' ? `<div class="so-meta">${escapeHtml(j.progress || '')}</div>` : ''}
        ${j.status === 'erro' && j.error ? `<div class="so-reject">${escapeHtml(j.error)}</div>` : ''}
        ${notes.length ? `<div class="so-meta">${notes.map((n) => escapeHtml(n)).join(' · ')}</div>` : ''}
        ${url ? `<video class="vi-video" src="${escapeHtml(url)}" controls preload="metadata"></video>
          <div class="so-item-actions"><button class="btn btn-ghost so-mini vi-use" data-url="${escapeHtml(url)}">Usar na aba Social</button>
          <a class="btn btn-ghost so-mini" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" download>Baixar</a>
          <button class="btn btn-ghost so-mini vi-del" data-id="${j.id}">Excluir</button></div>`
          : `<div class="so-item-actions"><button class="btn btn-ghost so-mini vi-del" data-id="${j.id}">Excluir</button></div>`}
      </div>`;
    }).join('');
    list.querySelectorAll('.vi-del').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Excluir este job?')) return; b.disabled = true;
      try { await deleteVideoJob(b.dataset.id); await refresh(); } catch (e) { b.disabled = false; alert(e.message); }
    }));
    list.querySelectorAll('.vi-use').forEach((b) => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.url); b.textContent = 'URL copiada ✓'; setTimeout(() => { b.textContent = 'Usar na aba Social'; }, 1600); }
      catch { alert('URL: ' + b.dataset.url); }
    }));
  }

  await refresh();
}
