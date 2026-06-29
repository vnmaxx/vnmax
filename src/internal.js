// Portal interno (renderizado apenas apos login bem-sucedido).
// O conteudo (`content`) NAO vem do bundle: e buscado do Firestore por main.js
// apos a autenticacao, sujeito as regras de seguranca (allowlist).
import logoUrl from '../logo.png';
import { brand } from './data.js';
import { icon } from './icons.js';
import { logout } from './firebase.js';

// Re-exporta o carregador de conteudo para que firebase/firestore fique neste
// chunk dinamico (fora do bundle publico inicial).
export { getInternalContent } from './internal-data.js';

export function renderInternal(user, content) {
  const d = content;
  const who = user && (user.email || user.displayName) ? (user.displayName || user.email) : 'Equipe VNMAX';
  return `
  <div class="portal">
    <header class="portal-header">
      <div class="wrap nav">
        <a class="brand-mark" href="#"><img src="${logoUrl}" alt="VNMAX"> VNMAX <span class="portal-badge">Interno</span></a>
        <div class="user-box">
          <span>${who}</span>
          <button class="btn btn-ghost" id="logoutBtn">${icon('logout')} Sair</button>
        </div>
      </div>
    </header>

    <section class="portal-hero">
      <div class="wrap">
        <h1>VNMAX OS — Central interna</h1>
        <p>Base operacional reservada: ecossistema, roadmap, portfólio e padrões de engenharia. Conteúdo confidencial — não exibir em materiais públicos.</p>

        <div class="tabs" id="portalTabs">
          <button class="tab active" data-tab="eco">Ecossistema</button>
          <button class="tab" data-tab="roadmap">Roadmap 2026–2031</button>
          <button class="tab" data-tab="produtos">Produtos</button>
          <button class="tab" data-tab="eng">Arquitetura & IA</button>
          <button class="tab" data-tab="gov">Confidencialidade</button>
        </div>
      </div>
    </section>

    <!-- ECOSSISTEMA -->
    <section class="panel" data-panel="eco">
      <div class="wrap">
        <span class="eyebrow">9 divisões</span>
        <h2 class="section-title">Mapa do ecossistema</h2>
        <div class="grid grid-3" style="margin-top:32px">
          ${d.divisions.map(divisionCard).join('')}
        </div>
      </div>
    </section>

    <!-- ROADMAP -->
    <section class="panel hidden" data-panel="roadmap">
      <div class="wrap" style="max-width:820px">
        <span class="eyebrow">Plano estratégico</span>
        <h2 class="section-title">Roadmap 2026–2031</h2>
        <div class="timeline">
          ${d.roadmap.map((r) => `
            <div class="tl-item">
              <div class="tl-phase">${r.phase}</div>
              <div class="tl-year">${r.year}</div>
              <div class="tl-goal">${r.goal}</div>
              <ul class="tl-items">${r.items.map((i) => `<li>${i}</li>`).join('')}</ul>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- PRODUTOS -->
    <section class="panel hidden" data-panel="produtos">
      <div class="wrap">
        <span class="eyebrow">Portfólio</span>
        <h2 class="section-title">Maturidade de produto</h2>
        <p class="section-sub">Cada produto avança por estágios antes de virar oferta ativa.</p>
        <div class="maturity-row">
          ${d.maturity.map((m, i) => `
            <div class="mat">
              <div class="num">0${i + 1}</div>
              <h4>${m.stage}</h4>
              <p>${m.text}</p>
            </div>`).join('')}
        </div>

        <h3 style="margin:48px 0 0;font-size:20px">Plataformas por divisão</h3>
        <div class="grid grid-3" style="margin-top:24px">
          ${d.divisions.map((v) => `
            <div class="division-card" style="--div:${v.color}">
              <div class="dhead"><span class="dot"></span><h3>${v.platform}</h3></div>
              <p class="slogan">${v.name}</p>
              <div class="tag-row">${v.products.map((p) => `<span class="tag">${p}</span>`).join('')}</div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- ARQUITETURA & IA -->
    <section class="panel hidden" data-panel="eng">
      <div class="wrap">
        <span class="eyebrow">Engenharia</span>
        <h2 class="section-title">${d.engineering.title}</h2>
        <div class="grid grid-3" style="margin-top:32px">
          ${d.engineering.pillars.map((p) => `
            <div class="card">
              <h3>${p.title}</h3>
              <p>${p.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- CONFIDENCIALIDADE -->
    <section class="panel hidden" data-panel="gov">
      <div class="wrap" style="max-width:820px">
        <span class="eyebrow">Governança</span>
        <h2 class="section-title">Regras de confidencialidade</h2>
        <ul class="notice">
          ${d.confidentiality.map((x) => `<li>${x}</li>`).join('')}
        </ul>
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

function divisionCard(v) {
  return `
    <div class="division-card" style="--div:${v.color}">
      <div class="dhead"><span class="dot"></span><h3>${v.name}</h3></div>
      <p class="slogan">${v.slogan}</p>
      <div class="meta"><span class="k">Plataforma:</span> <span class="v">${v.platform}</span></div>
      <div class="meta" style="margin-top:4px"><span class="k">Objetivo:</span> ${v.goal}</div>
      <div class="tag-row">${v.products.map((p) => `<span class="tag">${p}</span>`).join('')}</div>
    </div>`;
}

function portalHeader(who, withBadge) {
  return `
    <header class="portal-header">
      <div class="wrap nav">
        <a class="brand-mark" href="#"><img src="${logoUrl}" alt="VNMAX"> VNMAX ${withBadge ? '<span class="portal-badge">Interno</span>' : ''}</a>
        <div class="user-box">
          <span>${who}</span>
          <button class="btn btn-ghost" id="logoutBtn">${icon('logout')} Sair</button>
        </div>
      </div>
    </header>`;
}

// Tela enquanto o conteudo interno e carregado do Firestore.
export function renderLoading() {
  return `
  <div class="portal">
    <section class="portal-hero">
      <div class="wrap" style="display:flex;align-items:center;gap:14px;padding:80px 0">
        <span class="spinner"></span>
        <span style="color:var(--text-dim)">Carregando área interna…</span>
      </div>
    </section>
  </div>`;
}

// Tela para usuario autenticado mas SEM permissao (fora da allowlist) ou erro.
export function renderDenied(user, message) {
  const who = user && (user.email || user.displayName) ? (user.displayName || user.email) : 'Usuário';
  return `
  <div class="portal">
    ${portalHeader(who, false)}
    <section class="portal-hero">
      <div class="wrap" style="max-width:620px">
        <div class="modal-lock" style="margin-bottom:18px">${icon('lock')}</div>
        <h1>Acesso restrito</h1>
        <p style="margin-top:12px">${message}</p>
        <p style="margin-top:10px;color:var(--text-dim);font-size:14px">Use o botão <b>Sair</b> no topo para entrar com outra conta.</p>
      </div>
    </section>
  </div>`;
}

// Liga interacoes do portal: troca de abas e logout.
export function bindInternal(root, onLogout) {
  const tabs = root.querySelectorAll('.tab');
  const panels = root.querySelectorAll('.panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      panels.forEach((p) => p.classList.toggle('hidden', p.dataset.panel !== target));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  const btn = root.querySelector('#logoutBtn');
  if (btn) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await logout();
      if (onLogout) onLogout();
    });
  }

  // Sem listeners globais aqui (tudo vive dentro de #app e e coletado no
  // proximo render). Retornamos um teardown vazio para uniformidade com main.js.
  return () => {};
}
