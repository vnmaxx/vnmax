// Widget de chat do site — fala com o backend do Assistente VNMAX (NVIDIA NIM).
// A URL do backend vem de VITE_CHAT_API_URL (.env do site); vazio = mesma origem.
import { icon } from './icons.js';

const API_BASE = (import.meta.env.VITE_CHAT_API_URL || '').replace(/\/+$/, '');
const ENDPOINT = `${API_BASE}/api/chat`;
const APP_TOKEN = import.meta.env.VITE_CHAT_APP_TOKEN || '';

const WELCOME = 'Olá! Sou o assistente da VNMAX. Posso explicar nossos serviços, tirar dúvidas e agendar uma conversa com a equipe. Como posso ajudar?';
const STORE_KEY = 'vnmax_chat_v1';

let history = [];          // [{role, content}]
let sending = false;

function loadHistory() {
  try { const v = JSON.parse(localStorage.getItem(STORE_KEY)); history = Array.isArray(v) ? v : []; }
  catch { history = []; }
}
function saveHistory() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(history.slice(-50))); } catch {}
}

function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

// Renderiza markdown leve do assistente: **negrito** vira <strong>; remove markdown
// residual para nao aparecer "**" / "#" / "*" literais. Escapa HTML antes (XSS-safe).
function formatBot(s) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')   // **negrito** -> negrito
    .replace(/\*\*/g, '')                                  // remove ** soltos
    .replace(/(^|\n)\s*#{1,6}\s+/g, '$1')                  // tira ### de titulos
    .replace(/(^|\n)\s*\*\s+/g, '$1• ');                  // bullets "* " -> "• "
}

export function mountChat() {
  if (document.getElementById('vnmax-chat')) return;
  const root = document.createElement('div');
  root.id = 'vnmax-chat';
  root.className = 'vnchat';
  root.innerHTML = `
    <button class="vnchat-launch" id="vnchatLaunch" aria-label="Falar com o assistente VNMAX" title="Assistente VNMAX">
      <span class="vnchat-launch-ico">${icon('spark')}</span>
    </button>
    <div class="vnchat-panel" id="vnchatPanel" role="dialog" aria-label="Assistente VNMAX" aria-hidden="true">
      <div class="vnchat-head">
        <div class="vnchat-id"><span class="vnchat-avatar">${icon('spark')}</span><div><strong>Assistente VNMAX</strong><span class="vnchat-status">Online · responde na hora</span></div></div>
        <div class="vnchat-head-actions">
          <button class="vnchat-iconbtn" id="vnchatClear" aria-label="Limpar conversa" title="Limpar conversa">${icon('trash')}</button>
          <button class="vnchat-close" id="vnchatClose" aria-label="Fechar">&times;</button>
        </div>
      </div>
      <div class="vnchat-msgs" id="vnchatMsgs"></div>
      <form class="vnchat-input" id="vnchatForm">
        <input id="vnchatText" type="text" autocomplete="off" placeholder="Escreva sua mensagem…" maxlength="2000" aria-label="Mensagem">
        <button class="vnchat-send" type="submit" aria-label="Enviar">${icon('arrow')}</button>
      </form>
    </div>`;
  document.body.appendChild(root);

  const panel = root.querySelector('#vnchatPanel');
  const msgs = root.querySelector('#vnchatMsgs');
  const form = root.querySelector('#vnchatForm');
  const input = root.querySelector('#vnchatText');

  loadHistory();

  // Renderiza a conversa salva (ou a boas-vindas se nao houver).
  const renderConversation = () => {
    msgs.innerHTML = '';
    if (history.length) history.forEach((m) => addBubble(m.role === 'user' ? 'user' : 'bot', m.content));
    else addBubble('bot', WELCOME);
  };

  const open = () => {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    root.querySelector('#vnchatLaunch').classList.add('hidden');
    if (!msgs.childElementCount) renderConversation();
    setTimeout(() => { input.focus(); msgs.scrollTop = msgs.scrollHeight; }, 60);
  };
  const close = () => {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    root.querySelector('#vnchatLaunch').classList.remove('hidden');
  };
  const clear = () => {
    history = [];
    saveHistory();
    renderConversation();
    input.focus();
  };

  root.querySelector('#vnchatLaunch').addEventListener('click', open);
  root.querySelector('#vnchatClose').addEventListener('click', close);
  root.querySelector('#vnchatClear').addEventListener('click', clear);

  form.addEventListener('submit', (e) => { e.preventDefault(); send(input.value); input.value = ''; });

  function addBubble(who, text) {
    const el = document.createElement('div');
    el.className = `vnchat-msg ${who}`;
    el.innerHTML = `<div class="vnchat-bubble">${who === 'bot' ? formatBot(text) : esc(text)}</div>`;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }
  function addNote(text) {
    const el = document.createElement('div');
    el.className = 'vnchat-note';
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
  }
  function typing(on) {
    let t = msgs.querySelector('.vnchat-typing');
    if (on && !t) {
      t = document.createElement('div');
      t.className = 'vnchat-msg bot vnchat-typing';
      t.innerHTML = `<div class="vnchat-bubble"><span class="vnchat-dots"><i></i><i></i><i></i></span></div>`;
      msgs.appendChild(t);
      msgs.scrollTop = msgs.scrollHeight;
    } else if (!on && t) t.remove();
  }

  async function send(raw) {
    const text = (raw || '').trim();
    if (!text || sending) return;
    sending = true;
    addBubble('user', text);
    history.push({ role: 'user', content: text });
    saveHistory();
    typing(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (APP_TOKEN) headers['X-VNMAX-Token'] = APP_TOKEN;
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: history.slice(-12) }),
      });
      const data = await res.json().catch(() => ({}));
      typing(false);
      if (!res.ok) {
        addBubble('bot', data.error || 'Não consegui responder agora. Tente novamente em instantes ou escreva para vnmax6@gmail.com.');
      } else {
        const reply = data.reply || 'Desculpe, não entendi. Pode reformular?';
        history.push({ role: 'assistant', content: reply });
        saveHistory();
        addBubble('bot', reply);
        if (data.registered) addNote('✓ Contato registrado — a equipe entrará em contato.');
      }
    } catch (e) {
      typing(false);
      addBubble('bot', 'Estou sem conexão com o assistente no momento. Tente mais tarde ou escreva para vnmax6@gmail.com.');
    } finally {
      sending = false;
    }
  }
}

export function setChatVisible(visible) {
  const el = document.getElementById('vnmax-chat');
  if (el) el.classList.toggle('vnchat-hidden', !visible);
}
