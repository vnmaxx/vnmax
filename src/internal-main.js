// Bootstrap da AREA INTERNA VNMAX (rota /interno.html — documento proprio).
// Carregado SO nesta rota: aqui (e somente aqui) entram o Firebase Auth, o
// Firestore e o portal interno (internal.js). A landing publica (/) nunca baixa
// esse codigo, mantendo o bundle inicial enxuto e o conteudo reservado isolado.
//
// Fluxo:
//   - logado + na allowlist  -> renderiza o portal (conteudo do Firestore);
//   - logado sem permissao   -> tela de acesso negado;
//   - deslogado              -> formulario de login (Cancelar volta para /).
import './styles.css';
import { watchAuth, contentErrorMessage } from './firebase.js';
import * as internal from './internal.js';
import { loginFormHtml, bindLoginForm } from './login-ui.js';

const app = document.getElementById('app');
let view = null;        // 'loading' | 'login' | 'portal'
let teardown = null;    // cleanup da view atual
let loadToken = 0;      // invalida cargas concorrentes (ex.: logout durante fetch)

function swap(html) {
  if (teardown) { teardown(); teardown = null; }
  app.innerHTML = html;
}

function showLogin() {
  view = 'login';
  swap(`<div class="login-page"><div class="modal modal-static" role="dialog" aria-modal="true" aria-labelledby="loginTitle">${loginFormHtml({ cancelLabel: 'Voltar ao site' })}</div></div>`);
  bindLoginForm(app, {
    // Sucesso: watchAuth dispara com o usuario e troca para o portal.
    onSuccess: () => {},
    onCancel: () => { window.location.assign('/'); },
  });
  window.scrollTo(0, 0);
}

async function showPortal(user) {
  view = 'portal';
  const token = ++loadToken;
  swap(internal.renderLoading());
  try {
    const content = await internal.getInternalContent();
    if (token !== loadToken) return;          // estado mudou durante o fetch
    swap(internal.renderInternal(user, content));
  } catch (err) {
    if (token !== loadToken) return;
    swap(internal.renderDenied(user, contentErrorMessage(err)));
  }
  // Logout: volta para a landing publica (mantem o interno fora do historico util).
  teardown = internal.bindInternal(app, () => { window.location.assign('/'); });
  window.scrollTo(0, 0);
}

// Estado inicial enquanto o Firebase resolve a sessao persistida.
swap(internal.renderLoading());

watchAuth((user) => {
  if (user) {
    if (view !== 'portal') showPortal(user);
  } else {
    loadToken++;                              // cancela carga interna pendente
    if (view !== 'login') showLogin();
  }
});
