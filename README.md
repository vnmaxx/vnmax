# vnmax

Site institucional da VNMAX: landing comercial pública + área interna protegida por login (Firebase **Authentication**) com conteúdo reservado servido pelo **Firestore** sob regras de segurança.

## Como funciona

- **Landing pública** (`src/landing.js`): conteúdo comercial visível para qualquer visitante — hero, problema, solução, benefícios, serviços, diferenciais, credenciais, FAQ, CTA e footer. Não expõe roadmap, stack, plataformas ou planos internos.
- **Acesso interno oculto**: segure a tecla **`U`** por **3 segundos** (uma barra de progresso discreta aparece) para abrir o modal de login.
- **Área interna** (`src/internal.js`): após o login, o app busca o conteúdo reservado no Firestore (`internal/content`). As regras só liberam a leitura para usuários autenticados **e** presentes na allowlist. O conteúdo **não vive no bundle** — quem não for membro recebe `permission-denied` e vê a tela de acesso restrito.

## Rodando localmente

1. `npm install`
2. Copie `.env.example` para `.env` e preencha as chaves do Firebase
   (Console Firebase → Project settings → General → Your apps → SDK setup):

   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. No Console Firebase:
   - **Authentication → Sign-in method → E-mail/senha**: habilite e crie ao menos um usuário (em Users). Anote o **UID**.
   - **Firestore Database**: crie o banco (modo produção).
4. `npm run dev` (desenvolvimento) ou `npm run build` (produção em `dist/`).

> Sem o `.env`, a landing pública funciona normalmente; o modal de login apenas avisa que o Firebase não está configurado.

## Backend: Firestore (conteúdo reservado)

O conteúdo interno vive em `src/data-internal.mjs` apenas como **fonte do seed** — ele
não é importado pelo client. O fluxo de publicação:

### 1. Regras de segurança

Arquivo [`firestore.rules`](firestore.rules): leitura de `internal/*` só para membros
(`request.auth != null` **e** existe `allowlist/{uid}`); escrita só via Admin SDK.
Faça o deploy com a Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use <SEU_PROJECT_ID>          # ou: firebase use --add
firebase deploy --only firestore:rules
```

### 2. Credencial de seed (Admin SDK)

Console Firebase → Project settings → **Service accounts** → *Generate new private key*.
Salve como **`serviceAccount.json`** na raiz (já está no `.gitignore`) ou aponte
`GOOGLE_APPLICATION_CREDENTIALS` para o arquivo.

### 3. Publicar o conteúdo e liberar membros

```bash
npm run seed                       # publica internal/content no Firestore
npm run allow -- allow:<UID>       # adiciona um UID à allowlist (libera acesso)
npm run allow -- deny:<UID>        # remove um UID da allowlist
```

Pronto: o usuário com aquele UID, ao logar pelo modal (segurando `U`), passa a ver a área interna.

## Estrutura

```
index.html             # entry do app (Vite)
src/main.js            # bootstrap: alterna landing <-> portal; busca conteúdo pós-login
src/firebase.js        # Firebase Auth (bundle público)
src/internal-data.js   # acesso ao Firestore (chunk interno, fora do bundle público)
src/landing.js         # landing pública (comercial)
src/secret.js          # gesto oculto (segurar "U" 3s) + modal de login
src/internal.js        # portal interno (chunk dinâmico, carregado pós-login)
src/data.js            # conteúdo PÚBLICO
src/data-internal.mjs  # fonte do seed do Firestore (NÃO vai ao client)
src/styles.css         # design system (dark premium)
src/icons.js           # ícones SVG
firestore.rules        # regras de segurança (allowlist)
scripts/seed-firestore.mjs  # seed/allowlist via Admin SDK
```

## Segurança

- **Confidencialidade real**: o conteúdo reservado fica no Firestore atrás das regras
  de segurança. O bundle público (≈134 kB) contém apenas a landing e o Auth; nenhum
  dado interno é enviado a visitantes não autenticados. O Firestore (≈430 kB) só é
  baixado após o login, no chunk interno.
- **Credenciais**: `.env`, `serviceAccount.json` e tokens nunca vão ao Git
  (ver `.gitignore`). Os scripts de domínio (`add-domain.*`) leem o token da Vercel
  de `VERCEL_API_KEY` no ambiente, não de código.

## VNMAX OS

Base interna `vnmax-os` (prompts, marca, UX, arquitetura, IA, roadmap) para orientar entregas sem expor informações sensíveis. Pacote ZIP local: `npm run knowledge:zip`.

## Tecnologias

- Vite + JavaScript (ES modules)
- Firebase Authentication + Firestore
- CSS (design system próprio, dark premium)
- Deploy na Vercel

## Deploy (Vercel)

`npm run build` gera `dist/`; o `vercel.json` define `framework: vite`,
`outputDirectory: dist` e o fallback de SPA. Configure as variáveis
`VITE_FIREBASE_*` em **Project Settings → Environment Variables**. Acessível em
[vnmax.org](https://vnmax.org).
