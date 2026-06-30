// Gesto oculto e SILENCIOSO: segurar a tecla "U" por 3 segundos abre o modal
// de login. Nao ha nenhum indicador visual enquanto a tecla esta pressionada.
//
// Apos o login bem-sucedido o usuario e levado para /interno.html — uma ROTA
// SEPARADA (documento proprio). Assim a landing publica nunca carrega o Firebase
// Auth/Firestore nem o portal interno no bundle inicial.
import { loginFormHtml, bindLoginForm } from './login-ui.js';

const HOLD_MS = 3000;
// Destino do interno. Permite override por ambiente, com fallback para a rota MPA.
const INTERNAL_URL = import.meta.env.VITE_INTERNAL_PATH || '/interno.html';

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
  overlay.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="loginTitle">${loginFormHtml()}</div>`;
  document.body.appendChild(overlay);

  const close = () => closeModal(overlay);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  bindLoginForm(overlay, {
    onCancel: close,
    // Login OK -> navega para a rota interna (documento separado, bundle proprio).
    onSuccess: () => { window.location.assign(INTERNAL_URL); },
  });

  return overlay;
}

function openModal() {
  let overlay = /** @type {any} */ (document.getElementById('loginOverlay'));
  if (!overlay) overlay = buildModal();
  modalOpen = true;
  overlay.classList.add('show');

  // Foca o campo so se o modal ainda estiver aberto quando o timer disparar.
  overlay._focusTimer = setTimeout(() => {
    if (overlay.classList.contains('show')) /** @type {HTMLElement} */ (overlay.querySelector('#loginEmail')).focus();
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
  const err = overlay.querySelector('#loginError');
  if (err) err.textContent = '';
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
