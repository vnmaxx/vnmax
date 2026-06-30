// Portal interno/institucional (renderizado apos login bem-sucedido).
// O conteudo (`content`) vem do Firestore (internal/content), buscado por main.js.
// Os documentos da base (internal_docs) sao carregados sob demanda.
import logoUrl from '../logo.png';
import { brand } from './data.js';
import { icon } from './icons.js';
import { logout } from './firebase.js';

export { getInternalContent } from './internal-data.js';
import { getInternalDocs, getLeads, updateLeadStatus, addLeadNote, deleteLead } from './internal-data.js';

// Estagios do funil do CRM.
const STAGES = [
  { key: 'novo', label: 'Novo', color: '#9b5cff' },
  { key: 'contatado', label: 'Contatado', color: '#2f7bff' },
  { key: 'qualificado', label: 'Qualificado', color: '#22d3ee' },
  { key: 'proposta', label: 'Proposta', color: '#ff8a3d' },
  { key: 'negociacao', label: 'Negociação', color: '#f5b73c' },
  { key: 'ganho', label: 'Ganho', color: '#36d399' },
  { key: 'perdido', label: 'Perdido', color: '#ff4d4f' },
];
const stageOf = (k) => STAGES.find((s) => s.key === k) || STAGES[0];

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
        <a class="brand-mark" href="#"><img src="${logoUrl}" alt="VNMAX">${badge ? '<span class="portal-badge">Interno</span>' : ''}</a>
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

  const activate = (target) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (target === 'docs' && !docsLoaded) { docsLoaded = true; loadDocs(root); }
    if (target === 'crm' && !crmLoaded) { crmLoaded = true; loadCrm(root); }
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

// CRM: carrega os leads e monta o funil (Kanban) com drag-and-drop e drawer.
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

  let busca = '', filtro = 'todos', dragId = null, openLeadId = null;
  const syncDrawerStatus = (id, lead) => {
    if (openLeadId === id) { const sel = drawer.querySelector('#cdStatus'); if (sel) sel.value = lead.status || 'novo'; }
  };

  mount.innerHTML = `
    <div class="crm">
      <div class="crm-bar">
        <div class="crm-stats" id="crmStats"></div>
        <div class="crm-tools">
          <input class="crm-search" id="crmSearch" type="search" placeholder="Buscar nome, contato, assunto…">
          <select class="crm-filter" id="crmFiltro">
            <option value="todos">Todas as origens</option>
            <option value="form">Formulário</option>
            <option value="chat">Chat IA</option>
          </select>
          <button class="btn btn-ghost" id="crmRefresh">${icon('spark')} Atualizar</button>
        </div>
      </div>
      ${leads.length ? '' : '<p style="color:var(--text-dim);margin:0 0 14px">Nenhum lead ainda. Eles aparecem aqui quando alguém usa o formulário “Fale com a VNMAX” ou pede contato no chat.</p>'}
      <div class="crm-board" id="crmBoard">
        ${STAGES.map((s) => `
          <div class="crm-col" data-stage="${s.key}">
            <div class="crm-col-head"><span class="crm-dot" style="background:${s.color}"></span>${s.label}<span class="crm-count" data-count="${s.key}">0</span></div>
            <div class="crm-col-body" data-stage="${s.key}"></div>
          </div>`).join('')}
      </div>
    </div>
    <div class="crm-drawer" id="crmDrawer" hidden></div>`;

  const board = mount.querySelector('#crmBoard');
  const statsEl = mount.querySelector('#crmStats');
  const drawer = mount.querySelector('#crmDrawer');

  const visiveis = () => {
    const q = busca.trim().toLowerCase();
    return leads.filter((l) => {
      if (filtro !== 'todos' && (l.origem || 'chat') !== filtro) return false;
      if (!q) return true;
      return [l.nome, l.contato, l.email, l.whatsapp, l.empresa, l.assunto, l.mensagem].some((v) => (v || '').toLowerCase().includes(q));
    });
  };

  const cardHtml = (l) => {
    const origem = l.origem === 'form' ? 'form' : 'chat';
    return `<div class="crm-card" draggable="true" data-id="${l.id}">
      <div class="crm-card-top"><strong>${escapeHtml(l.nome || '—')}</strong><span class="crm-origem ${origem}">${origem === 'form' ? 'Form' : 'Chat'}</span></div>
      <div class="crm-card-contato">${escapeHtml(l.contato || l.email || l.whatsapp || '')}</div>
      ${l.assunto ? `<div class="crm-card-assunto">${escapeHtml(l.assunto)}</div>` : ''}
      <div class="crm-card-date">${fmtDate(l.createdAt)}</div>
    </div>`;
  };

  function render() {
    const vis = visiveis();
    STAGES.forEach((s) => {
      const body = board.querySelector(`.crm-col-body[data-stage="${s.key}"]`);
      const items = vis.filter((l) => (l.status || 'novo') === s.key);
      body.innerHTML = items.map(cardHtml).join('');
      board.querySelector(`[data-count="${s.key}"]`).textContent = items.length;
    });
    const nForm = leads.filter((l) => l.origem === 'form').length;
    statsEl.innerHTML = `<span class="crm-total">${leads.length} leads</span><span class="crm-sub">${nForm} do formulário · ${leads.length - nForm} do chat</span>`;
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

  async function move(id, status) {
    const lead = leads.find((l) => l.id === id);
    if (!lead || (lead.status || 'novo') === status) return;
    const prev = lead.status;
    lead.status = status;
    render();
    syncDrawerStatus(id, lead);
    try { await updateLeadStatus(id, status); }
    catch (e) { lead.status = prev; render(); syncDrawerStatus(id, lead); alert('Não foi possível mover o lead: ' + e.message); }
  }

  function openDrawer(id) {
    const l = leads.find((x) => x.id === id);
    if (!l) return;
    openLeadId = id;
    const origemLabel = l.origem === 'form' ? 'Formulário' : 'Chat IA';
    drawer.innerHTML = `
      <div class="crm-drawer-inner">
        <button class="crm-drawer-x" id="cdX" aria-label="Fechar">&times;</button>
        <div class="crm-drawer-head"><h3>${escapeHtml(l.nome || '—')}</h3><span class="crm-origem ${l.origem === 'form' ? 'form' : 'chat'}">${origemLabel}</span></div>
        <dl class="crm-fields">
          ${l.contato ? `<dt>Contato</dt><dd>${escapeHtml(l.contato)}</dd>` : ''}
          ${l.email ? `<dt>E-mail</dt><dd><a href="mailto:${encodeURIComponent(l.email)}">${escapeHtml(l.email)}</a></dd>` : ''}
          ${l.whatsapp ? `<dt>WhatsApp</dt><dd>${escapeHtml(l.whatsapp)}</dd>` : ''}
          ${l.empresa ? `<dt>Empresa</dt><dd>${escapeHtml(l.empresa)}</dd>` : ''}
          ${l.assunto ? `<dt>Assunto</dt><dd>${escapeHtml(l.assunto)}</dd>` : ''}
          ${l.mensagem ? `<dt>Mensagem</dt><dd>${escapeHtml(l.mensagem)}</dd>` : ''}
          <dt>Criado</dt><dd>${fmtDate(l.createdAt) || '—'}</dd>
        </dl>
        <label class="crm-stage-sel">Estágio
          <select id="cdStatus">${STAGES.map((s) => `<option value="${s.key}"${(l.status || 'novo') === s.key ? ' selected' : ''}>${s.label}</option>`).join('')}</select>
        </label>
        <div class="crm-notes">
          <h4>Notas</h4>
          <div id="cdNotes">${(l.notas || []).map((n) => `<div class="crm-note"><p>${escapeHtml(n.texto || '')}</p><span>${fmtDate(n.ts)}</span></div>`).join('') || '<div class="crm-note-empty">Sem notas ainda.</div>'}</div>
          <div class="crm-note-add"><textarea id="cdNoteText" rows="2" placeholder="Adicionar nota…"></textarea><button class="btn btn-ghost" id="cdNoteBtn">Adicionar nota</button></div>
        </div>
        <div class="crm-drawer-actions"><button class="btn crm-del" id="cdDel">Excluir lead</button></div>
      </div>`;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add('show'));

    const close = () => { openLeadId = null; drawer.classList.remove('show'); setTimeout(() => { drawer.hidden = true; }, 180); };
    drawer.querySelector('#cdX').addEventListener('click', close);
    drawer.addEventListener('click', (e) => { if (e.target === drawer) close(); });
    drawer.querySelector('#cdStatus').addEventListener('change', (e) => move(id, e.target.value));
    drawer.querySelector('#cdNoteBtn').addEventListener('click', async () => {
      const ta = drawer.querySelector('#cdNoteText');
      const texto = ta.value.trim();
      if (!texto) return;
      ta.disabled = true;
      try { await addLeadNote(id, texto); l.notas = [...(l.notas || []), { texto, ts: Date.now() }]; openDrawer(id); }
      catch (e) { ta.disabled = false; alert('Falha ao salvar nota: ' + e.message); }
    });
    drawer.querySelector('#cdDel').addEventListener('click', async () => {
      if (!confirm('Excluir este lead definitivamente?')) return;
      try { await deleteLead(id); leads = leads.filter((x) => x.id !== id); close(); render(); }
      catch (e) { alert('Falha ao excluir: ' + e.message); }
    });
  }

  mount.querySelector('#crmSearch').addEventListener('input', (e) => { busca = e.target.value; render(); });
  mount.querySelector('#crmFiltro').addEventListener('change', (e) => { filtro = e.target.value; render(); });
  mount.querySelector('#crmRefresh').addEventListener('click', async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try { leads = await getLeads(); render(); } catch (err) { alert('Falha ao atualizar: ' + err.message); } finally { b.disabled = false; }
  });

  render();
}
