# Assistente VNMAX (NVIDIA NIM) + captura de leads (CRM)

Backend que (1) responde/ajuda/agenda visitantes via **NVIDIA NIM** (chat),
(2) recebe o **formulário de contato** do site e (3) roda a aba **Social** do portal
(sistema próprio self-hosted: rascunho → aprovação → publicar, com adaptação de
texto por rede via IA). Todo lead — do chat e do formulário — é gravado no
**Firestore** (alimenta o CRM) com backup local em `data/leads.jsonl`. A chave da
NVIDIA fica **somente** aqui (no `.env`) — nunca no frontend.

Endpoints públicos: `POST /api/chat`, `POST /api/contact`, `GET /api/health`.
Endpoints privilegiados (exigem ID token Firebase de um membro da allowlist):
`GET /api/social/status`, `POST /api/social/{adapt,save,submit,approve,reject,markposted,delete}`.

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

## Redes sociais (aba Social) — sistema próprio self-hosted
Sem SaaS de postagem. Fluxo: **rascunho → aguardando aprovação → aprovado/agendado →
publicado** (o operador confirma a postagem). A IA adapta o texto por rede (X, Instagram,
LinkedIn, TikTok, YouTube, Facebook, Threads, Bluesky, Pinterest, Reddit, Telegram,
Google Business), respeitando limites. A publicação final é **semiautomática**: para as
redes com URL de _intent_ (X, Threads, Bluesky, LinkedIn, Reddit, Telegram, Facebook), o
portal abre a rede com o texto pronto; para as demais, copia o texto e abre o site. O
operador então marca como publicado (e pode colar o link do post).
```
NVIDIA_SOCIAL_MODEL=           # opcional: modelo dedicado p/ copy; vazio = usa NVIDIA_MODEL
```
- A agenda (coleção Firestore `social_posts`) é **gravada só pelo servidor** (Admin SDK)
  e lida pelos membros via allowlist. Publique a regra `social_posts` (`firestore.rules`).
- Os endpoints `/api/social/*` exigem `Authorization: Bearer <ID token Firebase>` de um
  usuário em `allowlist/{uid}` — verificado no servidor (`requireMember`).

## Edição de vídeo (aba Vídeo) — worker FFmpeg-only (leve)
Worker self-hosted que edita vídeo em background **só com FFmpeg** (binário do pacote
npm `ffmpeg-static`, ~80MB) — **sem Chrome, sem root, sem yt-dlp/whisper/claude**, para
não sufocar o servidor. Faz o essencial de "cortes/montagens": entrada (arquivo no inbox
ou URL https) → **9:16**, **normaliza áudio (-14 LUFS)**, color grade, **queima legendas
do roteiro (ASS)** e uma **intro de marca** (title card via libass). O resultado vira
mídia pronta para a aba Social.
```bash
cd server
bash install-video.sh          # npm install (ffmpeg-static) + cria diretorios
# no .env: VIDEO_WORKER_ENABLED=true  e  VIDEO_PUBLIC_BASE=<url publica do servidor>
sudo systemctl restart vnmax-assistant
```
- Endpoints (membro/dono): `GET /api/video/{tools,list}`, `POST /api/video/{create,get,delete}`.
  O MP4 finalizado é servido em `GET /video/output/<arquivo>` (nome aleatório, com Range).
- Jobs ficam em `video_jobs` (Firestore, escrita só pelo servidor; leitura escopada ao dono).
  Concorrência 1 e limpeza do diretório ao final — leve no disco/RAM.
- **Segurança**: processos via `spawn(bin, [args])` (sem shell → sem injeção); entradas e
  caminhos validados (anti path traversal); download com **anti-SSRF** (bloqueia IPs
  internos/metadata + allowlist opcional) e teto de tamanho.
- **HyperFrames** ([heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)) e
  **video-use** ([browser-use/video-use](https://github.com/browser-use/video-use)) ficam no
  **caminho local/assistido** (pesados — Chrome/uv): rode-os na sua máquina e suba o
  resultado pelo inbox. A composição de intro (`server/video/hyperframes-intro/`) e os
  briefings (`server/video/bin/*.sh`) são a referência desse caminho.

## Segurança
- `NVIDIA_API_KEY` vive só no `.env` (gitignored, chmod 600). Nunca no bundle/frontend.
- **CORS não é autenticação.** `ALLOWED_ORIGINS` (defesa em profundidade) bloqueia o navegador de terceiros, mas clientes não-browser podem omitir o `Origin`. Em produção, a barreira real contra abuso/custo é a combinação: `TRUST_PROXY` + rate limit + `APP_TOKEN` opcional + **teto de cota/billing na conta NVIDIA**.
- `APP_TOKEN` (opcional): se definido, o widget deve enviar o mesmo valor (`VITE_CHAT_APP_TOKEN`). Dificulta abuso por scripts (não é segredo forte — vai no bundle).
- Rate limit por IP, limites de payload/mensagens e filtro de saída (anti-vazamento do prompt) já vêm ativos. O endpoint chama a API paga da NVIDIA, então **defina um limite de gasto/cota na conta NVIDIA**.
- Os leads (`data/leads.jsonl`) são dados informados por visitantes — trate como não confiáveis ao consumir.
- Rotacione a chave da NVIDIA se ela for exposta.
