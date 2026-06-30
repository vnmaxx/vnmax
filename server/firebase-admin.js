// Inicializacao UNICA do firebase-admin, compartilhada por leads.js e social.js.
// Exporta `db` (Firestore), `auth` (para verificar ID tokens do portal interno) e
// `admin` (FieldValue etc.). Sem credenciais, db/auth ficam null e os modulos
// que dependem disso degradam com mensagem clara (nada quebra no boot).
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SA_PATH = resolve(__dirname, 'serviceAccount.json');

let app = null;
try {
  if (existsSync(SA_PATH)) {
    app = admin.initializeApp({ credential: admin.credential.cert(JSON.parse(readFileSync(SA_PATH, 'utf8'))) });
    console.log('[firebase] conectado (serviceAccount.json).');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    app = admin.initializeApp({ credential: admin.credential.applicationDefault() });
    console.log('[firebase] conectado (GOOGLE_APPLICATION_CREDENTIALS).');
  } else {
    console.warn('[firebase] SEM credenciais: CRM e Social ficam limitados. Coloque serviceAccount.json em server/.');
  }
} catch (e) {
  console.warn('[firebase] falha ao iniciar:', e.message);
}

export const db = app ? admin.firestore() : null;
export const auth = app ? admin.auth() : null;
export const firebaseConfigured = Boolean(app);
export { admin };
