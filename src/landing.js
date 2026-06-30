// Landing page publica da VNMAX (conteudo comercial e institucional aberto).
import logoUrl from '../logo.png';
import { brand, publicContent as c } from './data.js';
import { icon } from './icons.js';

export function renderLanding() {
  return `
  <header class="site-header" id="siteHeader">
    <div class="wrap nav">
      <a class="brand-mark" href="#top" aria-label="VNMAX"><img src="${logoUrl}" alt="VNMAX"></a>
      <nav class="nav-links">
        <a href="#sobre">Sobre</a>
        <a href="#servicos">Serviços</a>
        <a href="#diferenciais">Diferenciais</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a class="btn btn-primary" href="#contato">${c.hero.cta1}</a>
    </div>
  </header>

  <main id="top">
    <!-- HERO -->
    <section class="hero">
      <div class="hero-grid"></div>
      <div class="wrap">
        <span class="eyebrow reveal">${c.hero.eyebrow}</span>
        <h1 class="reveal">Construindo o <span class="accent">futuro</span> através da tecnologia</h1>
        <p class="subtitle reveal">${c.hero.subtitle}</p>
        <div class="hero-actions reveal">
          <a class="btn btn-primary" href="#contato">${c.hero.cta1} ${icon('arrow')}</a>
          <a class="btn btn-ghost" href="#servicos">Conheça os serviços</a>
        </div>
      </div>
    </section>

    <!-- SOBRE + MISSAO/VISAO -->
    <section class="section" id="sobre">
      <div class="wrap">
        <span class="eyebrow reveal">${c.about.title}</span>
        <h2 class="section-title reveal" style="max-width:18ch">Tecnologia transformada em vantagem real</h2>
        <p class="section-sub reveal">${c.about.text}</p>
        <div class="mv-grid">
          <div class="mv reveal"><h3>Missão</h3><p>${c.mission}</p></div>
          <div class="mv reveal"><h3>Visão</h3><p>${c.vision}</p></div>
        </div>
      </div>
    </section>

    <!-- VALORES -->
    <section class="section tight" id="valores">
      <div class="wrap">
        <span class="eyebrow reveal">Nossos valores</span>
        <h2 class="section-title reveal">O que nos guia</h2>
        <div class="grid grid-3">
          ${c.values.map((v) => `
            <div class="card value reveal">
              <h3><span class="vdot"></span>${v.title}</h3>
              <p>${v.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- SERVICOS -->
    <section class="section" id="servicos">
      <div class="wrap">
        <span class="eyebrow reveal">O que fazemos</span>
        <h2 class="section-title reveal">Tecnologia ponta a ponta</h2>
        <p class="section-sub reveal">Da estratégia ao código, do design à infraestrutura — soluções digitais sob medida para o seu negócio.</p>
        <div class="grid grid-4">
          ${c.services.map((s) => `
            <div class="card reveal">
              <div class="ico">${icon(s.icon)}</div>
              <h3>${s.title}</h3>
              <p>${s.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- DIFERENCIAIS -->
    <section class="section" id="diferenciais">
      <div class="wrap split">
        <div class="reveal">
          <span class="eyebrow">Por que a VNMAX</span>
          <h2 class="section-title">Mais que uma software house: um parceiro de tecnologia</h2>
          <p class="section-sub">Um ecossistema coeso, com a especialização de quem é dedicado e a coesão de quem trabalha junto.</p>
        </div>
        <div class="reveal">
          ${c.why.map((w) => `
            <div class="why-item">
              <h3>${w.title}</h3>
              <p>${w.text}</p>
            </div>`).join('')}
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="section tight" id="numeros">
      <div class="wrap">
        <div class="stats">
          ${c.stats.map((s) => `<div class="stat reveal"><div class="v">${s.value}</div><div class="l">${s.label}</div></div>`).join('')}
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section" id="faq">
      <div class="wrap" style="max-width:840px">
        <span class="eyebrow reveal">Perguntas frequentes</span>
        <h2 class="section-title reveal">Tudo o que você precisa saber</h2>
        <div class="faq-list">
          ${c.faq.map((f) => `
            <div class="faq-item">
              <button class="faq-q" type="button" aria-expanded="false"><span>${f.q}</span><span class="plus">+</span></button>
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
          <a class="btn btn-primary" href="mailto:${brand.email}">${c.cta.button} ${icon('arrow')}</a>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER -->
  <footer class="site-footer">
    <div class="wrap">
      <div class="footer-top">
        <div class="footer-brand">
          <img src="${logoUrl}" alt="VNMAX" style="width:42px;height:42px">
          <p>${brand.slogan}.</p>
          <div class="social">
            ${brand.social.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.name}" title="${s.name}">${icon(s.icon)}</a>`).join('')}
          </div>
          <a class="footer-email" href="mailto:${brand.email}">${icon('mail')} ${brand.email}</a>
        </div>
        <div class="footer-col">
          <h4>Soluções</h4>
          <ul>${c.services.slice(0, 5).map((s) => `<li><a href="#servicos"><span class="fdot"></span>${s.title}</a></li>`).join('')}</ul>
        </div>
        <div class="footer-col">
          <h4>Empresa</h4>
          <ul>
            <li><a href="#sobre"><span class="fdot"></span>Sobre</a></li>
            <li><a href="#servicos"><span class="fdot"></span>Serviços</a></li>
            <li><a href="#faq"><span class="fdot"></span>FAQ</a></li>
            <li><a href="mailto:${brand.email}"><span class="fdot"></span>Contato</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${brand.founded} VNMAX · ${brand.domain}</span>
        <span>${brand.slogan}</span>
      </div>
    </div>
  </footer>`;
}

// Interacoes: header scroll, FAQ, reveal-on-scroll. Retorna teardown.
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
  }, { threshold: 0.1 });
  root.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  const recalcOpen = () => root.querySelectorAll('.faq-item.open .faq-a').forEach((a) => { a.style.maxHeight = a.scrollHeight + 'px'; });
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
