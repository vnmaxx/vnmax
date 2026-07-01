// Efeitos interativos da landing (discretos, premium).
// - Brilho ambiente que segue o cursor (camada fixa, bem sutil).
// - Spotlight + leve tilt 3D nos cards, acompanhando o mouse.
// - Efeito magnetico discreto nos botoes primarios.
//
// Tudo so liga em ponteiro fino (mouse) e quando o usuario NAO pediu menos
// movimento. Retorna um teardown para remover listeners/elementos.

/** @param {Document|Element} root */
export function installEffects(root = document) {
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reduce) return () => {};

  const cleanups = [];

  // ---- 1. Brilho ambiente que segue o cursor -------------------------------
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  let gx = window.innerWidth / 2;
  let gy = window.innerHeight / 2;
  let cx = gx;
  let cy = gy;
  let rafId = 0;
  let running = false;

  const tick = () => {
    cx += (gx - cx) * 0.12;
    cy += (gy - cy) * 0.12;
    glow.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    if (Math.abs(gx - cx) > 0.3 || Math.abs(gy - cy) > 0.3) {
      rafId = requestAnimationFrame(tick);
    } else {
      running = false;
    }
  };
  const kick = () => { if (!running) { running = true; rafId = requestAnimationFrame(tick); } };

  const onPointerMove = (e) => {
    gx = e.clientX;
    gy = e.clientY;
    glow.style.opacity = '1';
    kick();
  };
  const onPointerLeave = () => { glow.style.opacity = '0'; };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.addEventListener('pointerleave', onPointerLeave);
  cleanups.push(() => {
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerleave', onPointerLeave);
    cancelAnimationFrame(rafId);
    glow.remove();
  });

  // ---- 2. Spotlight + tilt 3D nos cards ------------------------------------
  const cards = Array.from(root.querySelectorAll('.card, .mv, .stat, .cta-band'));
  cards.forEach((/** @type {HTMLElement} */ card) => {
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty('--mx', `${px * 100}%`);
      card.style.setProperty('--my', `${py * 100}%`);
      const tilt = card.classList.contains('cta-band') ? 2.5 : 5;
      card.style.setProperty('--rx', `${(0.5 - py) * tilt}deg`);
      card.style.setProperty('--ry', `${(px - 0.5) * tilt}deg`);
    };
    const onLeave = () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
      card.style.removeProperty('--mx');
      card.style.removeProperty('--my');
    };
    card.classList.add('fx-interactive');
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', onLeave);
    });
  });

  // ---- 3. Efeito magnetico nos botoes primarios ----------------------------
  const magnets = Array.from(root.querySelectorAll('.btn-primary'));
  magnets.forEach((/** @type {HTMLElement} */ btn) => {
    const onMove = (e) => {
      const r = btn.getBoundingClientRect();
      const mx = e.clientX - (r.left + r.width / 2);
      const my = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${mx * 0.18}px, ${my * 0.22}px)`;
    };
    const onLeave = () => { btn.style.transform = ''; };
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerleave', onLeave);
    cleanups.push(() => {
      btn.removeEventListener('pointermove', onMove);
      btn.removeEventListener('pointerleave', onLeave);
      btn.style.transform = '';
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
