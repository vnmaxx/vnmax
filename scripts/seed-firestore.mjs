// Publica o conteudo reservado no Firestore (documento internal/content) e
// gerencia a allowlist de membros internos. Usa o Firebase Admin SDK, que
// ignora as regras de seguranca (executa server-side), entao precisa de uma
// chave de conta de servico.
//
// Credenciais (uma das opcoes):
//   1. Coloque a chave em ./serviceAccount.json (Console Firebase > Project
//      settings > Service accounts > Generate new private key). Esse arquivo
//      ja esta no .gitignore.
//   2. OU defina GOOGLE_APPLICATION_CREDENTIALS apontando para a chave .json.
//
// Uso:
//   node scripts/seed-firestore.mjs                  # publica internal/content
//   node scripts/seed-firestore.mjs docs             # publica vnmax-os/ em internal_docs
//   node scripts/seed-firestore.mjs allow:<uid>      # adiciona um UID a allowlist
//   node scripts/seed-firestore.mjs deny:<uid>       # remove um UID da allowlist
//   atalhos npm:
//     npm run seed                       # publica o conteudo do portal
//     npm run seed:docs                  # publica a base vnmax-os
//     npm run allow -- allow:<uid>       # adiciona UID  (ou: npm run allow -- <uid>)
//     npm run allow -- deny:<uid>        # remove UID
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join } from 'node:path';
import admin from 'firebase-admin';
import { internalContent } from '../src/data-internal.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const saPath = resolve(__dirname, '..', 'serviceAccount.json');
const vnmaxOsDir = resolve(__dirname, '..', 'vnmax-os');

// Percorre vnmax-os/ e devolve { id, path, content } por arquivo (md/json/txt).
function collectDocs(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(md|json|txt)$/i.test(name)) continue;
      const rel = relative(vnmaxOsDir, full).split(/[\\/]/).join('/');
      out.push({
        id: rel.replace(/[^A-Za-z0-9]+/g, '_'),  // id valido para Firestore
        path: rel,
        content: readFileSync(full, 'utf8'),
      });
    }
  };
  walk(dir);
  return out;
}

if (existsSync(saPath)) {
  const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  admin.initializeApp({ credential: admin.credential.applicationDefault() });
} else {
  console.error(
    'Credenciais nao encontradas.\n' +
      'Crie ./serviceAccount.json (Console Firebase > Project settings > Service accounts)\n' +
      'ou defina GOOGLE_APPLICATION_CREDENTIALS apontando para a chave .json.'
  );
  process.exit(1);
}

const db = admin.firestore();
const arg = process.argv[2] || '';

try {
  if (arg === '') {
    // Sem argumento: publica o conteudo interno.
    await db.collection('internal').doc('content').set(internalContent);
    console.log('Conteudo interno publicado em internal/content.');
  } else if (arg === 'docs') {
    // Publica a base vnmax-os/ em internal_docs (um doc por arquivo).
    if (!existsSync(vnmaxOsDir)) throw new Error('Pasta vnmax-os/ nao encontrada no disco.');
    const docs = collectDocs(vnmaxOsDir);
    if (!docs.length) throw new Error('Nenhum arquivo encontrado em vnmax-os/.');
    let batch = db.batch();
    docs.forEach((d) => {
      batch.set(db.collection('internal_docs').doc(d.id), {
        path: d.path,
        content: d.content,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
    console.log(`Base interna publicada em internal_docs: ${docs.length} documentos.`);
  } else if (arg.startsWith('deny:')) {
    const uid = arg.slice('deny:'.length).trim();
    if (!uid) throw new Error('Informe o UID: deny:<uid>');
    await db.collection('allowlist').doc(uid).delete();
    console.log(`UID removido da allowlist: ${uid}`);
  } else {
    // 'allow:<uid>' ou um UID puro: adiciona a allowlist.
    const uid = (arg.startsWith('allow:') ? arg.slice('allow:'.length) : arg).trim();
    if (!uid) throw new Error('Informe o UID: allow:<uid>');
    await db.collection('allowlist').doc(uid).set({
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`UID adicionado a allowlist: ${uid}`);
  }
  process.exit(0);
} catch (err) {
  console.error('Falha:', err.message);
  process.exit(1);
}
