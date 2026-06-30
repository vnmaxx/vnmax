# Assistente VNMAX (NVIDIA NIM) + captura de leads (CRM)

Backend que (1) responde/ajuda/agenda visitantes via **NVIDIA NIM** (chat),
(2) recebe o **formulário de contato** do site e (3) publica/agenda nas redes
sociais via **Ayrshare** com adaptação por rede via IA (aba **Social** do portal).
Todo lead — do chat e do formulário — é gravado no **Firestore** (alimenta o CRM)
com backup local em `data/leads.jsonl`. As chaves (NVIDIA/Ayrshare) ficam
**somente** aqui (no `.env`) — nunca no frontend.

Endpoints públicos: `POST /api/chat`, `POST /api/contact`, `GET /api/health`.
Endpoints privilegiados (exigem ID token Firebase de um membro da allowlist):
`GET /api/social/status`, `POST /api/social/adapt`, `POST /api/social/publish`,
`POST /api/social/cancel`.

## Requisitos
- Node.js **18+**.
- Uma chave do NVIDIA NIM (NVIDIA Build / API Catalog).
- `firebase-admin` (instalado via `npm install`) + **`serviceAccount.json`** do Firebase
  na pasta `server/` (para gravar os leads no Firestore/CRM). Sem ele, os leads vão
  apenas para `data/leads.jsonl` e o CRM não recebe.

## Rodar localmente
```bash
cd server
npm install                 # instala firebase-admin
cp .env.example .env        # preencha NVIDIA_API_KEY (e ALLOWED_ORIGINS p/ teste: *)
# (opcional) coloque serviceAccount.json aqui para alimentar o CRM
npm start
# em outro terminal:
curl http://127.0.0.1:8787/api/health
curl -X POST http://127.0.0.1:8787/api/chat -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"O que a VNMAX faz?"}]}'
```

## Deploy no servidor Linux (systemd)
```bash
cd server
cp .env.example .env         # preencha NVIDIA_API_KEY e ALLOWED_ORIGINS=https://vnmax.org
sudo bash install.sh         # cria e inicia o servico vnmax-assistant
journalctl -u vnmax-assistant -f   # logs
```
O `install.sh` valida o Node, gera a unit systemd com os caminhos corretos, protege
o `.env` (chmod 600) e habilita o serviço para iniciar no boot.

## Expor para o site público (importante)
O site (https://vnmax.org) só consegue chamar o assistente por **HTTPS** (navegador
bloqueia HTTP a partir de página HTTPS). Coloque um proxy reverso com TLS na frente:

```nginx
# exemplo nginx em assistant.vnmax.org -> 127.0.0.1:8787
location /api/ {
    proxy_pass http://127.0.0.1:8787;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;   # reescreve (NAO use $proxy_add_x_forwarded_for)
}
```
Use um domínio/subdomínio com certificado (Let's Encrypt / Caddy resolvem em 1 passo).
Atrás do proxy, ative **`TRUST_PROXY=true`** no `.env` para o rate limit usar o IP real do cliente.

## Conectar o frontend
No `.env` do **site** (raiz do projeto), defina a URL pública do assistente:
```
VITE_CHAT_API_URL=https://assistant.vnmax.org
```
Rebuilde o site. O widget passa a chamar `${VITE_CHAT_API_URL}/api/chat`.

## Agendamentos / leads
Quando o visitante pede contato/agendamento, o modelo chama a ferramenta
`registrar_contato` e o pedido é gravado em `server/data/leads.jsonl`
(uma linha JSON por contato). Plugue depois em e-mail/CRM/Firestore se quiser.

## Redes sociais (aba Social)
Defina no `.env` do servidor:
```
AYRSHARE_API_KEY=...           # chave do Ayrshare (conecte as redes em app.ayrshare.com)
NVIDIA_SOCIAL_MODEL=           # opcional: modelo dedicado p/ copy; vazio = usa NVIDIA_MODEL
```
- Conecte Instagram, X, LinkedIn, TikTok, YouTube, Facebook, Threads, Bluesky,
  Pinterest, Reddit, Telegram e Google Business no painel do Ayrshare (modo conta única).
- A publicação/agendamento usa o `scheduleDate` nativo do Ayrshare (UTC). A agenda
  (coleção Firestore `social_posts`) é **gravada só pelo servidor** (Admin SDK) e lida
  pelos membros via allowlist. Publique a regra `social_posts` (`firestore.rules`) no console.
- Os endpoints `/api/social/*` exigem `Authorization: Bearer <ID token Firebase>` de um
  usuário presente em `allowlist/{uid}` — verificado no servidor (`requireMember`).

## Segurança
- `NVIDIA_API_KEY` vive só no `.env` (gitignored, chmod 600). Nunca no bundle/frontend.
- **CORS não é autenticação.** `ALLOWED_ORIGINS` (defesa em profundidade) bloqueia o navegador de terceiros, mas clientes não-browser podem omitir o `Origin`. Em produção, a barreira real contra abuso/custo é a combinação: `TRUST_PROXY` + rate limit + `APP_TOKEN` opcional + **teto de cota/billing na conta NVIDIA**.
- `APP_TOKEN` (opcional): se definido, o widget deve enviar o mesmo valor (`VITE_CHAT_APP_TOKEN`). Dificulta abuso por scripts (não é segredo forte — vai no bundle).
- Rate limit por IP, limites de payload/mensagens e filtro de saída (anti-vazamento do prompt) já vêm ativos. O endpoint chama a API paga da NVIDIA, então **defina um limite de gasto/cota na conta NVIDIA**.
- Os leads (`data/leads.jsonl`) são dados informados por visitantes — trate como não confiáveis ao consumir.
- Rotacione a chave da NVIDIA se ela for exposta.
