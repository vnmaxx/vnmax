// Bootstrap da aplicacao VNMAX.
// - Renderiza a landing publica.
// - Instala o gesto oculto (segurar "U" 3s -> modal de login).
// - Observa o estado de autenticacao: logado -> portal interno; deslogado -> landing.
//
// Confidencialidade: o conteudo interno NAO vive no bundle. Apos o login, main.js
// busca o documento `internal/content` no Firestore; as regras de seguranca so
// liberam a leitura para usuarios autenticados E presentes na allowlist. Quem nao
// for membro recebe 'permission-denied' e ve a tela de acesso restrito.
import './styles.css';
import { renderLanding, bindLanding } from './landing.js';
import { installSecretGesture } from './secret.js';
import { mountChat, setChatVisible } from './chat.js';
import { watchAuth, contentErrorMessage } from './firebase.js';

const app = document.getElementById('app');
let currentUser = null;
let view = null;        // 'landing' | 'internal'
let teardown = null;    // cleanup da view atual (remove listeners globais)
let loadToken = 0;      // invalida cargas internas concorrentes (ex.: logout durante fetch)

function swap(html) {
  if (teardown) { teardown(); teardown = null; }
  app.innerHTML = html;
}

function showLanding() {
  view = 'landing';
  swap(renderLanding());
  teardown = bindLanding(app);
  setChatVisible(true);
  window.scrollTo(0, 0);
}

async function showInternal(user) {
  view = 'internal';
  const token = ++loadToken;
  const internal = await import('./internal.js');
  if (token !== loadToken) return;            // estado mudou enquanto carregava o modulo

  swap(internal.renderLoading());
  try {
    const content = await internal.getInternalContent();
    if (token !== loadToken) return;          // ex.: usuario deslogou durante o fetch
    swap(internal.renderInternal(user, content));
  } catch (err) {
    if (token !== loadToken) return;
    swap(internal.renderDenied(user, contentErrorMessage(err)));
  }
  teardown = internal.bindInternal(app, () => { /* watchAuth detecta o logout e volta para a landing */ });
  setChatVisible(false);            // o assistente e para visitantes, nao para a area interna
  window.scrollTo(0, 0);
}

// Render inicial (publico) — disponivel mesmo sem Firebase configurado.
showLanding();

// Gesto oculto de acesso interno.
installSecretGesture();

// Widget do assistente (visivel na landing publica).
mountChat();
setChatVisible(true);

// Reage a login/logout. Com Firebase nao configurado, o callback recebe null
// e o site permanece na landing publica.
watchAuth((user) => {
  const prevUid = currentUser ? currentUser.uid : null;
  currentUser = user;

  if (user && view !== 'internal') {
    showInternal(user);
  } else if (!user && view !== 'landing') {
    loadToken++;                              // cancela qualquer carga interna pendente
    showLanding();
  } else if (user && view === 'internal' && user.uid !== prevUid) {
    // re-renderiza apenas se a conta logada mudou.
    showInternal(user);
  }
});
