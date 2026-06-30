// Formulario de contato (modal). Abre ao clicar em qualquer elemento [data-contact]
// (ex.: botoes "Fale com a VNMAX"). Envia para o backend /api/contact, que grava
// o lead no Firestore (CRM) + backup local.
import { icon } from './icons.js';

const API_BASE = (import.meta.env.VITE_CHAT_API_URL || '').replace(/\/+$/, '');
const ENDPOINT = `${API_BASE}/api/contact`;
const APP_TOKEN = import.meta.env.VITE_CHAT_APP_TOKEN || '';

let sending = false;

export function mountContact() {
  if (document.getElementById('vnmax-contact')) return;
  const overlay = document.createElement('div');
  overlay.id = 'vnmax-contact';
  overlay.className = 'cform-overlay';
  overlay.innerHTML = `
    <div class="cform" role="dialog" aria-modal="true" aria-labelledby="cformTitle">
      <button class="cform-x" type="button" aria-label="Fechar">&times;</button>
      <div class="cform-head">
        <div class="cform-ico">${icon('mail')}</div>
        <div>
          <h2 id="cformTitle">Fale com a VNMAX</h2>
          <p>Conte seu desafio. A equipe entra em contato.</p>
        </div>
      </div>
      <form id="cformForm" novalidate>
        <div class="cform-row">
          <div class="cfield"><label for="cf-nome">Nome *</label><input id="cf-nome" name="nome" type="text" maxlength="120" required></div>
          <div class="cfield"><label for="cf-empresa">Empresa</label><input id="cf-empresa" name="empresa" type="text" maxlength="120"></div>
        </div>
        <div class="cform-row">
          <div class="cfield"><label for="cf-email">E-mail</label><input id="cf-email" name="email" type="email" autocomplete="email" maxlength="160" placeholder="voce@empresa.com"></div>
          <div class="cfield"><label for="cf-whats">WhatsApp</label><input id="cf-whats" name="whatsapp" type="tel" autocomplete="tel" maxlength="40" placeholder="(11) 99999-9999"></div>
        </div>
        <div class="cform-hint">Informe ao menos um — e-mail ou WhatsApp.</div>
        <div class="cfield"><label for="cf-assunto">Assunto</label><input id="cf-assunto" name="assunto" type="text" maxlength="200" placeholder="Ex.: site, app, automação com IA…"></div>
        <div class="cfield"><label for="cf-msg">Mensagem</label><textarea id="cf-msg" name="mensagem" rows="3" maxlength="2000" placeholder="Conte um pouco sobre o que você precisa."></textarea></div>
        <div class="cform-error" id="cformError" role="alert"></div>
        <div class="cform-actions">
          <button type="button" class="btn btn-ghost cform-x2">Cancelar</button>
          <button type="submit" class="btn btn-primary" id="cformSubmit">Enviar</button>
        </div>
      </form>
      <div class="cform-success" id="cformSuccess" hidden>
        <div class="cform-check">${icon('check')}</div>
        <h3>Recebido!</h3>
        <p>Obrigado. A equipe da VNMAX vai entrar em contato em breve.</p>
        <button type="button" class="btn btn-primary cform-x2">Fechar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeContact(); });
  overlay.querySelectorAll('.cform-x, .cform-x2').forEach((b) => b.addEventListener('click', closeContact));
  overlay.querySelector('#cformForm').addEventListener('submit', submit);

  // Abre o formulario ao clicar em qualquer [data-contact] (sobrevive a re-render).
  document.addEventListener('click', (e) => {
    const t = /** @type {HTMLElement} */ (e.target).closest('[data-contact]');
    if (t) { e.preventDefault(); openContact(); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeContact(); });
}

export function openContact() {
  const overlay = /** @type {any} */ (document.getElementById('vnmax-contact'));
  if (!overlay) return;
  if (overlay._resetTimer) { clearTimeout(overlay._resetTimer); overlay._resetTimer = null; }
  overlay.classList.add('show');
  setTimeout(() => /** @type {HTMLElement} */ (overlay.querySelector('#cf-nome'))?.focus(), 60);
}

function closeContact() {
  const overlay = /** @type {any} */ (document.getElementById('vnmax-contact'));
  if (!overlay || !overlay.classList.contains('show')) return;   // ja fechado: no-op
  overlay.classList.remove('show');
  // reset depois da animacao — cancelado se reabrir antes
  overlay._resetTimer = setTimeout(() => {
    overlay._resetTimer = null;
    if (overlay.classList.contains('show')) return;              // reaberto: nao reseta
    const form = /** @type {HTMLFormElement} */ (overlay.querySelector('#cformForm'));
    const ok = /** @type {HTMLElement} */ (overlay.querySelector('#cformSuccess'));
    if (form && ok) { form.hidden = false; ok.hidden = true; form.reset(); overlay.querySelector('#cformError').textContent = ''; }
  }, 200);
}

async function submit(e) {
  e.preventDefault();
  if (sending) return;
  const overlay = document.getElementById('vnmax-contact');
  const form = /** @type {HTMLFormElement} */ (overlay.querySelector('#cformForm'));
  const errEl = overlay.querySelector('#cformError');
  const btn = /** @type {HTMLButtonElement} */ (overlay.querySelector('#cformSubmit'));
  errEl.textContent = '';

  const data = Object.fromEntries(new FormData(form).entries());
  if (!String(data.nome || '').trim()) { errEl.textContent = 'Informe seu nome.'; return; }
  if (!String(data.email || '').trim() && !String(data.whatsapp || '').trim()) { errEl.textContent = 'Informe um e-mail ou WhatsApp para retorno.'; return; }

  sending = true; btn.disabled = true; btn.textContent = 'Enviando…';
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (APP_TOKEN) headers['X-VNMAX-Token'] = APP_TOKEN;
    const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(data) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { errEl.textContent = j.error || 'Não foi possível enviar agora. Tente novamente ou escreva para vnmax6@gmail.com.'; return; }
    form.hidden = true;
    /** @type {HTMLElement} */ (overlay.querySelector('#cformSuccess')).hidden = false;
  } catch (err) {
    errEl.textContent = 'Sem conexão no momento. Tente novamente ou escreva para vnmax6@gmail.com.';
  } finally {
    sending = false; btn.disabled = false; btn.textContent = 'Enviar';
  }
}
