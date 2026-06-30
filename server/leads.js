// Persistencia de leads: grava no Firestore (alimenta o CRM interno) e mantem um
// backup local em data/leads.jsonl. Se nao houver credenciais Firebase, funciona
// so com o backup local (e avisa). Usado pelo chat (tool) e pelo /api/contact.
import { appendFile, mkdir } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, 'data');
const LEADS_FILE = resolve(DATA_DIR, 'leads.jsonl');
const SA_PATH = resolve(__dirname, 'serviceAccount.json');

let db = null;
try {
  if (existsSync(SA_PATH)) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(SA_PATH, 'utf8'))) });
    db = admin.firestore();
    console.log('[leads] Firestore conectado (serviceAccount.json) — leads alimentam o CRM.');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
    db = admin.firestore();
    console.log('[leads] Firestore conectado (GOOGLE_APPLICATION_CREDENTIALS).');
  } else {
    console.warn('[leads] SEM credenciais Firebase: leads vao apenas para data/leads.jsonl. Para alimentar o CRM, coloque serviceAccount.json em server/.');
  }
} catch (e) {
  console.warn('[leads] Falha ao iniciar Firestore:', e.message, '— usando apenas leads.jsonl.');
}

// Valida nome + contato (e-mail OU telefone BR). Rejeita placeholders/lixo.
export function validarContato(nome, contato) {
  nome = String(nome || '').trim();
  contato = String(contato || '').trim();
  if (!nome || !contato) return 'Informe nome e um contato (WhatsApp ou e-mail).';
  const blob = `${nome} ${contato}`.toLowerCase();
  if (/(seu[ _-]?nome|nome do|fulano|exemplo|example|email@|user@|placeholder|\bxxx\b|asdf|qwerty)/.test(blob)) return 'Parecem dados de exemplo. Informe dados reais.';
  if ((nome.match(/\p{L}/gu) || []).length < 2 || /^(.)\1+$/.test(nome.replace(/\s/g, ''))) return 'Nome inválido.';
  const isEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(contato);
  const fakeEmail = isEmail && (/^(.)\1{3,}@/.test(contato) || /@(example|exemplo|test|teste|mailinator|tempmail)\./i.test(contato) || /\.(test|example|invalid|local)$/i.test(contato));
  const dig = (contato.match(/\d/g) || []).join('');
  const seq = /^(\d)\1+$/.test(dig) || /0123456789|1234567890|12345678/.test(dig);
  const isPhone = dig.length >= 10 && dig.length <= 13 && !seq;
  if (isEmail && fakeEmail) return 'E-mail parece de teste. Informe um e-mail válido.';
  if (!isEmail && !isPhone) return 'Contato inválido. Use um WhatsApp com DDD ou um e-mail válido.';
  return null; // ok
}

// Grava um lead. `input`: { nome, contato, email, whatsapp, empresa, assunto, mensagem, origem, ip }
export async function saveLead(input = {}) {
  const lead = {
    nome: String(input.nome || '').trim().slice(0, 120),
    contato: String(input.contato || '').trim().slice(0, 160),
    email: input.email ? String(input.email).trim().slice(0, 160) : null,
    whatsapp: input.whatsapp ? String(input.whatsapp).trim().slice(0, 60) : null,
    empresa: input.empresa ? String(input.empresa).trim().slice(0, 120) : null,
    assunto: input.assunto ? String(input.assunto).trim().slice(0, 200) : null,
    mensagem: input.mensagem ? String(input.mensagem).trim().slice(0, 2000) : null,
    origem: input.origem === 'form' ? 'form' : 'chat',
    status: 'novo',
    ip: input.ip || null,
  };

  // Backup local (sempre).
  try {
    await mkdir(DATA_DIR, { recursive: true });
    await appendFile(LEADS_FILE, JSON.stringify({ ...lead, ts: new Date().toISOString() }) + '\n', 'utf8');
  } catch {}

  // Firestore (alimenta o CRM).
  if (db) {
    try {
      const ref = await db.collection('leads').add({
        ...lead,
        notas: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { ok: true, id: ref.id };
    } catch (e) {
      console.error('[leads] Falha ao gravar no Firestore (lead salvo no backup local):', e.message);
    }
  }
  return { ok: true, id: null };
}
