# Assistente VNMAX (NVIDIA NIM)

Backend de chat que responde, ajuda e agenda contatos para os visitantes do site,
usando o **NVIDIA NIM** (catálogo NVIDIA, endpoint OpenAI-compatible). A chave da
NVIDIA fica **somente** aqui (no `.env` do servidor) — nunca no frontend.

## Requisitos
- Node.js **18+** (usa `fetch` nativo, zero dependências).
- Uma chave do NVIDIA NIM (NVIDIA Build / API Catalog).

## Rodar localmente
```bash
cd server
cp .env.example .env        # preencha NVIDIA_API_KEY (e ALLOWED_ORIGINS p/ teste: *)
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

## Segurança
- `NVIDIA_API_KEY` vive só no `.env` (gitignored, chmod 600). Nunca no bundle/frontend.
- **CORS não é autenticação.** `ALLOWED_ORIGINS` (defesa em profundidade) bloqueia o navegador de terceiros, mas clientes não-browser podem omitir o `Origin`. Em produção, a barreira real contra abuso/custo é a combinação: `TRUST_PROXY` + rate limit + `APP_TOKEN` opcional + **teto de cota/billing na conta NVIDIA**.
- `APP_TOKEN` (opcional): se definido, o widget deve enviar o mesmo valor (`VITE_CHAT_APP_TOKEN`). Dificulta abuso por scripts (não é segredo forte — vai no bundle).
- Rate limit por IP, limites de payload/mensagens e filtro de saída (anti-vazamento do prompt) já vêm ativos. O endpoint chama a API paga da NVIDIA, então **defina um limite de gasto/cota na conta NVIDIA**.
- Os leads (`data/leads.jsonl`) são dados informados por visitantes — trate como não confiáveis ao consumir.
- Rotacione a chave da NVIDIA se ela for exposta.
