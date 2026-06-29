// Gesto oculto e SILENCIOSO: segurar a tecla "U" por 3 segundos abre o modal
// de login. Nao ha nenhum indicador visual enquanto a tecla esta pressionada.
import { icon } from './icons.js';
import { login, authErrorMessage, isFirebaseConfigured } from './firebase.js';

const HOLD_MS = 3000;

let holdTimer = null;
let modalOpen = false;

function isTyping(target) {
  if (!target) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

function buildModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'loginOverlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
      <div class="modal-lock">${icon('lock')}</div>
      <h2 id="loginTitle">Acesso interno</h2>
      <p class="hint">Área restrita da VNMAX. Identifique-se para continuar.</p>
      <form id="loginForm" novalidate>
        <div class="field">
          <label for="loginEmail">E-mail</label>
          <input id="loginEmail" type="email" autocomplete="username" placeholder="voce@vnmax.org" required>
        </div>
        <div class="field">
          <label for="loginPass">Senha</label>
          <input id="loginPass" type="password" autocomplete="current-password" placeholder="••••••••" required>
        </div>
        <div class="error" id="loginError" role="alert"></div>
        ${isFirebaseConfigured ? '' : '<div class="modal-warn">Firebase não configurado. Preencha o arquivo <b>.env</b> para habilitar o login.</div>'}
        <div class="actions">
          <button type="button" class="btn btn-ghost" id="loginCancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="loginSubmit">Entrar</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(overlay);

  const close = () => closeModal(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#loginCancel').addEventListener('click', close);

  const form = overlay.querySelector('#loginForm');
  const errEl = overlay.querySelector('#loginError');
  const submitBtn = overlay.querySelector('#loginSubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const email = overlay.querySelector('#loginEmail').value;
    const pass = overlay.querySelector('#loginPass').value;
    if (!email || !pass) { errEl.textContent = 'Preencha e-mail e senha.'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    try {
      await login(email, pass);
      // onAuthStateChanged (em main.js) cuida de renderizar a area interna.
      closeModal(overlay);
    } catch (err) {
      errEl.textContent = authErrorMessage(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  });

  return overlay;
}

function openModal() {
  let overlay = document.getElementById('loginOverlay');
  if (!overlay) overlay = buildModal();
  modalOpen = true;
  overlay.classList.add('show');

  // Foca o campo so se o modal ainda estiver aberto quando o timer disparar.
  overlay._focusTimer = setTimeout(() => {
    if (overlay.classList.contains('show')) overlay.querySelector('#loginEmail').focus();
  }, 60);

  const onEsc = (e) => { if (e.key === 'Escape') closeModal(overlay); };
  overlay._onEsc = onEsc;
  document.addEventListener('keydown', onEsc);
}

function closeModal(overlay) {
  modalOpen = false;
  overlay.classList.remove('show');
  if (overlay._focusTimer) { clearTimeout(overlay._focusTimer); overlay._focusTimer = null; }
  const form = overlay.querySelector('#loginForm');
  if (form) form.reset();
  overlay.querySelector('#loginError').textContent = '';
  if (overlay._onEsc) { document.removeEventListener('keydown', overlay._onEsc); overlay._onEsc = null; }
}

function cancelHold() {
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
}

// Instala os listeners do gesto. Chamar uma vez no bootstrap.
export function installSecretGesture() {
  // Filtramos por e.code (tecla fisica) — estavel a layout, modificadores e IME.
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'KeyU') return;
    if (e.repeat) return;                 // ignora auto-repeat do teclado
    if (modalOpen || isTyping(e.target)) return;
    if (holdTimer) return;                // ja contando
    holdTimer = setTimeout(() => { holdTimer = null; openModal(); }, HOLD_MS);
  });

  const stop = (e) => {
    if (e && e.code && e.code !== 'KeyU') return;
    cancelHold();
  };
  window.addEventListener('keyup', stop);
  window.addEventListener('blur', () => stop());
}
