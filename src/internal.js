// Portal interno/institucional (renderizado apos login bem-sucedido).
// O conteudo (`content`) vem do Firestore (internal/content), buscado por main.js.
// Os documentos da base (internal_docs) sao carregados sob demanda.
import logoUrl from '../logo.png';
import { brand } from './data.js';
import { icon } from './icons.js';
import { logout } from './firebase.js';

export { getInternalContent } from './internal-data.js';
import { getInternalDocs } from './internal-data.js';

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

  const activate = (target) => {
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === target));
    panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (target === 'docs' && !docsLoaded) { docsLoaded = true; loadDocs(root); }
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
    mount.innerHTML = `<p style="color:#ff6b6b">Falha ao carregar documentos: ${escapeHtml(err.message || '')}</p>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
