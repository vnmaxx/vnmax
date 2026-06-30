// Formulario de login compartilhado entre o modal da landing (secret.js) e a
// pagina interna (internal-main.js). O Firebase Auth e importado SOB DEMANDA
// (dynamic import) apenas no submit, para nao pesar no bundle inicial da landing.
import { icon } from './icons.js';

// Constante de build (Vite substitui em tempo de compilacao): true quando o .env
// esta preenchido. Nao importa firebase aqui — so checa as variaveis de ambiente.
export const FIREBASE_CONFIGURED = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_PROJECT_ID
);

// HTML do miolo do formulario (sem overlay). Reutilizado no modal e na pagina.
export function loginFormHtml({ cancelLabel = 'Cancelar' } = {}) {
  return `
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
      ${FIREBASE_CONFIGURED ? '' : '<div class="modal-warn">Firebase não configurado. Preencha o arquivo <b>.env</b> para habilitar o login.</div>'}
      <div class="actions">
        <button type="button" class="btn btn-ghost" id="loginCancel">${cancelLabel}</button>
        <button type="submit" class="btn btn-primary" id="loginSubmit">Entrar</button>
      </div>
    </form>`;
}

// Liga o submit do formulario. onSuccess() roda apos o login resolver; onCancel()
// no botao ghost. O firebase so e baixado quando o usuario realmente envia.
/**
 * @param {Element|Document} root
 * @param {{ onSuccess?: () => void, onCancel?: () => void }} [opts]
 */
export function bindLoginForm(root, { onSuccess, onCancel } = {}) {
  const form = root.querySelector('#loginForm');
  if (!form) return;
  const errEl = root.querySelector('#loginError');
  const submitBtn = /** @type {HTMLButtonElement} */ (root.querySelector('#loginSubmit'));
  const cancelBtn = root.querySelector('#loginCancel');
  if (cancelBtn && onCancel) cancelBtn.addEventListener('click', onCancel);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    const email = /** @type {HTMLInputElement} */ (root.querySelector('#loginEmail')).value;
    const pass = /** @type {HTMLInputElement} */ (root.querySelector('#loginPass')).value;
    if (!email || !pass) { errEl.textContent = 'Preencha e-mail e senha.'; return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando…';
    try {
      const { login } = await import('./firebase.js');
      await login(email, pass);
      if (onSuccess) onSuccess();
    } catch (err) {
      const { authErrorMessage } = await import('./firebase.js');
      errEl.textContent = authErrorMessage(err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Entrar';
    }
  });
}
