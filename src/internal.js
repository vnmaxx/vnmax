// Portal interno/institucional (renderizado apos login bem-sucedido).
// O conteudo (`content`) vem do Firestore (internal/content), buscado por main.js.
// Os documentos da base (internal_docs) sao carregados sob demanda.
import logoUrl from '../logo-wordmark.png';
import { brand } from './data.js';
import { icon } from './icons.js';
import { logout } from './firebase.js';

export { getInternalContent } from './internal-data.js';
import { getInternalDocs, getLeads, updateLeadStage, addLeadEvent, updateLeadFields, deleteLead } from './internal-data.js';
import { socialStatus, adaptPosts, publishPosts, cancelCampaign, getSocialPosts } from './social-data.js';

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

  const activate = (target) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (target === 'docs' && !docsLoaded) { docsLoaded = true; loadDocs(root); }
    if (target === 'crm' && !crmLoaded) { crmLoaded = true; loadCrm(root); }
    if (target === 'social' && !socialLoaded) { socialLoaded = true; loadSocial(root); }
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
  agendado: { l: 'Agendado', c: '#f5b73c' }, publicado: { l: 'Publicado', c: '#36d399' },
  parcial: { l: 'Parcial', c: '#ff8a3d' }, erro: { l: 'Erro', c: '#ff4d4f' },
  cancelado: { l: 'Cancelado', c: '#8a8a93' }, pendente: { l: 'Pendente', c: '#9b5cff' },
};
const tomos = [['profissional', 'Profissional'], ['inspirador', 'Inspirador'], ['descontraido', 'Descontraído'], ['tecnico', 'Técnico'], ['vendedor', 'Persuasivo']];

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
  const connected = new Set(status.connected || []);
  const selected = new Set();
  let variants = {};
  let busy = false;

  const netChip = (p) => {
    const on = selected.has(p.key);
    const conn = connected.has(p.key);
    return `<button class="so-net${on ? ' on' : ''}" data-net="${p.key}" title="${conn ? 'Conectada' : 'Não conectada no Ayrshare'}${p.requiresMedia ? ' · exige mídia' : ''}">
      <span class="so-net-ico">${icon(SOCIAL_ICON[p.key] || 'spark')}</span>${escapeHtml(p.label)}
      ${conn ? '<span class="so-dot on"></span>' : '<span class="so-dot"></span>'}
    </button>`;
  };

  const cfgNote = !status.ayrshare
    ? '<div class="so-warn">Ayrshare não configurado no servidor. Defina <b>AYRSHARE_API_KEY</b> no <code>.env</code> do servidor e conecte suas redes no painel do Ayrshare.</div>'
    : (status.connectError ? `<div class="so-warn">Conectado ao Ayrshare, mas a leitura das redes falhou: ${escapeHtml(status.connectError)}</div>`
      : (!connected.size ? '<div class="so-warn">Nenhuma rede conectada ainda. Conecte Instagram, X, LinkedIn etc. no painel do Ayrshare (app.ayrshare.com).</div>' : ''));

  mount.innerHTML = `
    <div class="social">
      <div class="so-status">
        <span class="so-badge ${status.ayrshare ? 'ok' : 'off'}">Ayrshare ${status.ayrshare ? 'ativo' : 'inativo'}</span>
        <span class="so-badge ${status.nvidia ? 'ok' : 'off'}">IA ${status.nvidia ? 'ativa' : 'inativa'}</span>
        ${(status.connected || []).map((k) => `<span class="so-conn">${icon(SOCIAL_ICON[k] || 'spark')}${escapeHtml(byKey[k] ? byKey[k].label : k)}</span>`).join('')}
        <a class="btn btn-ghost so-mini" href="https://app.ayrshare.com/social-accounts" target="_blank" rel="noopener noreferrer">Conectar redes</a>
      </div>
      ${cfgNote}

      <div class="so-grid">
        <div class="so-compose">
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

          <div class="so-publish">
            <input id="soWhen" type="datetime-local" class="crm-filter">
            <button class="btn btn-ghost" id="soSchedule">${icon('clock')} Agendar</button>
            <button class="btn btn-primary" id="soNow">${icon('send')} Publicar agora</button>
          </div>
          <div id="soMsg" class="so-msg"></div>
        </div>

        <div class="so-agenda">
          <div class="so-agenda-head"><h3>Agenda de postagens</h3><button class="btn btn-ghost so-mini" id="soRefresh">${icon('spark')} Atualizar</button></div>
          <div id="soList"></div>
        </div>
      </div>
    </div>`;

  const $ = (s) => mount.querySelector(s);
  const msg = (text, kind) => { const el = $('#soMsg'); el.textContent = text || ''; el.className = 'so-msg' + (kind ? ' ' + kind : ''); };

  // -- selecao de redes --
  mount.querySelectorAll('.so-net').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.net;
    if (selected.has(k)) selected.delete(k); else selected.add(k);
    b.classList.toggle('on', selected.has(k));
  }));

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

  // -- publicar / agendar --
  async function send(scheduleAt) {
    const content = $('#soContent').value.trim();
    const chosen = [...selected];
    const mediaUrls = collectMedia();
    if (!chosen.length) return msg('Selecione ao menos uma rede.', 'err');
    if (!content && !mediaUrls.length) return msg('Escreva um conteúdo ou informe uma mídia.', 'err');
    if (busy) return; busy = true;
    const nowBtn = $('#soNow'), schBtn = $('#soSchedule');
    nowBtn.disabled = schBtn.disabled = true; msg('Enviando…');
    try {
      const payload = { content, platforms: chosen, variants, tone: $('#soTone').value, mediaUrls };
      if (scheduleAt) payload.scheduleAt = scheduleAt;
      const r = await publishPosts(payload);
      const okN = (r.targets || []).filter((t) => t.status === 'agendado' || t.status === 'publicado').length;
      msg(`${scheduleAt ? 'Agendado' : 'Publicado'}: ${okN}/${(r.targets || []).length} rede(s).` + (r.status === 'parcial' || r.status === 'erro' ? ' Veja os detalhes na agenda.' : ''), r.status === 'erro' ? 'err' : 'ok');
      posts = await getSocialPosts().catch(() => posts);
      renderList();
    } catch (e) { msg('Falha ao publicar: ' + e.message, 'err'); }
    finally { busy = false; nowBtn.disabled = schBtn.disabled = false; }
  }

  $('#soNow').addEventListener('click', () => send(null));
  $('#soSchedule').addEventListener('click', () => {
    const v = $('#soWhen').value;
    if (!v) return msg('Escolha a data/hora do agendamento.', 'err');
    const ms = new Date(v).getTime();
    if (!Number.isFinite(ms) || ms < Date.now() + 120000) return msg('O agendamento precisa ser ao menos 2 min no futuro.', 'err');
    send(ms);
  });

  $('#soRefresh').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try { posts = await getSocialPosts(); agendaError = ''; renderList(); } catch (err) { msg('Falha ao atualizar agenda: ' + err.message, 'err'); }
    finally { b.disabled = false; }
  });

  // -- agenda (lista de campanhas) --
  function renderList() {
    const list = $('#soList');
    if (agendaError && !posts.length) { list.innerHTML = `<div class="so-empty" style="color:#ff6b6b">Não foi possível carregar a agenda: ${escapeHtml(agendaError)}</div>`; return; }
    if (!posts.length) { list.innerHTML = '<div class="so-empty">Nenhuma postagem ainda. Crie a primeira ao lado.</div>'; return; }
    list.innerHTML = posts.map((p) => {
      const st = SOCIAL_STATUS[p.status] || SOCIAL_STATUS.pendente;
      const when = p.scheduleAt ? `Agendado para ${fmtDate(p.scheduleAt)}` : fmtDate(p.createdAt);
      const targets = Array.isArray(p.targets) ? p.targets : [];
      const cancelable = targets.some((t) => t.status === 'agendado');
      return `<div class="so-item">
        <div class="so-item-top"><span class="so-tag" style="--tc:${st.c}">${st.l}</span><span class="so-when">${icon('clock')} ${when}</span></div>
        <div class="so-item-body">${escapeHtml((p.content || '').slice(0, 160)) || '<i>(sem texto)</i>'}</div>
        <div class="so-targets">${targets.map((t) => {
          const ts = SOCIAL_STATUS[t.status] || SOCIAL_STATUS.pendente;
          const lbl = (byKey[t.platform] || {}).label || t.platform;
          const inner = `${icon(SOCIAL_ICON[t.platform] || 'spark')} ${escapeHtml(lbl)}`;
          const href = safeUrl(t.permalink);
          const body = href ? `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
          return `<span class="so-target" style="--tc:${ts.c}" title="${escapeHtml(t.error || ts.l)}">${body}</span>`;
        }).join('')}</div>
        ${cancelable ? `<div class="so-item-actions"><button class="btn btn-ghost so-mini so-cancel" data-id="${p.id}">Cancelar agendamento</button></div>` : ''}
      </div>`;
    }).join('');
    list.querySelectorAll('.so-cancel').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Cancelar esta campanha agendada nas redes?')) return;
      b.disabled = true;
      try { await cancelCampaign(b.dataset.id); posts = await getSocialPosts(); renderList(); }
      catch (e) { b.disabled = false; alert('Falha ao cancelar: ' + e.message); }
    }));
  }

  renderList();
}
