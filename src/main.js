// Bootstrap da LANDING publica VNMAX (rota /).
// - Renderiza a landing publica.
// - Instala o gesto oculto (segurar "U" 3s -> modal de login).
// - Monta o assistente (chat) e o formulario de contato.
//
// A area interna vive em uma ROTA SEPARADA (/interno.html -> src/internal-main.js).
// Por isso a landing NAO importa Firebase Auth/Firestore nem o portal interno: o
// bundle inicial fica enxuto e o conteudo reservado nunca chega ao visitante.
import './styles.css';
import { renderLanding, bindLanding } from './landing.js';
import { installSecretGesture } from './secret.js';
import { mountChat, setChatVisible } from './chat.js';
import { mountContact } from './contact.js';

const app = document.getElementById('app');

// Render da landing (publico) — disponivel mesmo sem Firebase configurado.
app.innerHTML = renderLanding();
bindLanding(app);
window.scrollTo(0, 0);

// Gesto oculto de acesso interno (segurar "U" 3s -> login -> /interno.html).
installSecretGesture();

// Widget do assistente (so na landing publica) e formulario de contato.
mountChat();
setChatVisible(true);
mountContact();
