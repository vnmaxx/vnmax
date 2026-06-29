// Renderiza a landing page publica (conteudo comercial).
import logoUrl from '../logo.png';
import { brand, publicContent as c } from './data.js';
import { icon } from './icons.js';

export function renderLanding() {
  const s = c.services;
  return `
  <header class="site-header" id="siteHeader">
    <div class="wrap nav">
      <a class="brand-mark" href="#top">
        <img src="${logoUrl}" alt="VNMAX"> VNMAX
      </a>
      <nav class="nav-links">
        <a href="#solucao">Solução</a>
        <a href="#servicos">Serviços</a>
        <a href="#diferenciais">Diferenciais</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="btn btn-primary" href="#contato">${c.hero.primaryCta}</a>
    </div>
  </header>

  <main id="top">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="wrap">
        <span class="eyebrow reveal">${c.hero.eyebrow}</span>
        <h1 class="reveal">${c.hero.title}</h1>
        <p class="subtitle reveal">${c.hero.subtitle}</p>
        <div class="hero-actions reveal">
          <a class="btn btn-primary" href="#contato">${c.hero.primaryCta}</a>
          <a class="btn btn-ghost" href="#servicos">${c.hero.secondaryCta}</a>
        </div>
        <div class="hero-badges reveal">
          ${['Software', 'Inteligência Artificial', 'Automação', 'Dados', 'Cloud', 'Segurança'].map((x) => `<span class="chip">${x}</span>`).join('')}
        </div>
      </div>
    </section>

    <!-- PROBLEMA -->
    <section class="section" id="problema">
      <div class="wrap split">
        <div class="reveal">
          <span class="eyebrow">O problema</span>
          <h2 class="section-title">${c.problem.title}</h2>
          <p class="section-sub">${c.problem.text}</p>
        </div>
        <ul class="pain-list reveal">
          ${c.problem.pains.map((p) => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    </section>

    <!-- SOLUCAO -->
    <section class="section" id="solucao">
      <div class="wrap">
        <span class="eyebrow reveal">A solução</span>
        <h2 class="section-title reveal">${c.solution.title}</h2>
        <p class="section-sub reveal">${c.solution.text}</p>
        <div class="grid grid-4 steps">
          ${c.solution.steps.map((st) => `
            <div class="card reveal">
              <div class="step-n">${st.n}</div>
              <h3 style="margin-top:10px">${st.title}</h3>
              <p>${st.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- BENEFICIOS -->
    <section class="section" id="beneficios">
      <div class="wrap">
        <span class="eyebrow reveal">Benefícios</span>
        <h2 class="section-title reveal">${c.benefits.title}</h2>
        <div class="grid grid-3">
          ${c.benefits.items.map((b) => card(b)).join('')}
        </div>
      </div>
    </section>

    <!-- SERVICOS -->
    <section class="section" id="servicos">
      <div class="wrap">
        <span class="eyebrow reveal">Serviços</span>
        <h2 class="section-title reveal">${s.title}</h2>
        <p class="section-sub reveal">${s.subtitle}</p>
        <div class="grid grid-4">
          ${s.items.map((it) => card(it)).join('')}
        </div>
      </div>
    </section>

    <!-- DIFERENCIAIS -->
    <section class="section" id="diferenciais">
      <div class="wrap split">
        <div class="reveal">
          <span class="eyebrow">Diferenciais</span>
          <h2 class="section-title">${c.differentials.title}</h2>
          <p class="section-sub">Tecnologia com método, clareza e padrão de produto.</p>
        </div>
        <div class="reveal">
          ${c.differentials.items.map((d) => `
            <div class="diff-item">
              <h3>${d.title}</h3>
              <p>${d.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- CREDENCIAIS -->
    <section class="section" id="credenciais">
      <div class="wrap">
        <span class="eyebrow reveal">Credenciais</span>
        <h2 class="section-title reveal">${c.credentials.title}</h2>
        <p class="section-sub reveal">${c.credentials.text}</p>
        <div class="stats">
          ${c.credentials.stats.map((st) => `
            <div class="stat reveal"><div class="v">${st.value}</div><div class="l">${st.label}</div></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" id="faq">
      <div class="wrap" style="max-width:820px">
        <span class="eyebrow reveal">FAQ</span>
        <h2 class="section-title reveal">${c.faq.title}</h2>
        <div class="faq-list" id="faqList">
          ${c.faq.items.map((f, i) => `
            <div class="faq-item" data-faq="${i}">
              <button class="faq-q" type="button" aria-expanded="false">
                <span>${f.q}</span><span class="plus">+</span>
              </button>
              <div class="faq-a"><p>${f.a}</p></div>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section" id="contato">
      <div class="wrap">
        <div class="cta-band reveal">
          <h2>${c.cta.title}</h2>
          <p>${c.cta.text}</p>
          <a class="btn btn-accent" href="mailto:${brand.email}">${c.cta.button}</a>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${logoUrl}" alt="VNMAX">
          <p>${c.footer.tagline}</p>
        </div>
        ${c.footer.columns.map((col) => `
          <div class="footer-col">
            <h4>${col.title}</h4>
            <ul>${col.links.map((l) => `<li><a href="#">${l}</a></li>`).join('')}</ul>
          </div>`).join('')}
      </div>
      <div class="footer-bottom">
        <span>© ${brand.founded} VNMAX · ${brand.domain}</span>
        <span>${brand.slogan}</span>
      </div>
    </div>
  </footer>`;
}

function card(item) {
  return `
    <div class="card reveal">
      <div class="ico">${icon(item.icon)}</div>
      <h3>${item.title}</h3>
      <p>${item.text}</p>
    </div>`;
}

// Liga interacoes da landing (header scroll, FAQ, reveal on scroll).
// Retorna uma funcao de teardown que remove os listeners globais — chamada
// por main.js antes de trocar de view, evitando acumulo de listeners.
export function bindLanding(root) {
  const header = root.querySelector('#siteHeader');
  const onScroll = () => header && header.classList.toggle('scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  root.querySelectorAll('.faq-item').forEach((item) => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    btn.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      ans.style.maxHeight = open ? ans.scrollHeight + 'px' : '0px';
    });
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  root.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Recalcula a altura do FAQ aberto quando a janela muda ou a fonte carrega.
  const recalcOpen = () => {
    root.querySelectorAll('.faq-item.open .faq-a').forEach((ans) => {
      ans.style.maxHeight = ans.scrollHeight + 'px';
    });
  };
  let rid;
  const onResize = () => { clearTimeout(rid); rid = setTimeout(recalcOpen, 100); };
  window.addEventListener('resize', onResize, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(recalcOpen);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    clearTimeout(rid);
    io.disconnect();
  };
}
