#!/usr/bin/env bash
# Instala o Assistente VNMAX como servico systemd no servidor Linux.
# Uso:   sudo bash install.sh
# (rode a partir da pasta server/; precisa de Node.js >= 18)
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_NAME="vnmax-assistant"
RUN_USER="${SUDO_USER:-$(whoami)}"
NODE_BIN="$(command -v node || true)"

echo "==> Diretorio: $APP_DIR"
echo "==> Usuario de execucao: $RUN_USER"

if [ -z "$NODE_BIN" ]; then
  echo "ERRO: Node.js nao encontrado. Instale Node 18+ (ex.: 'sudo apt install nodejs' ou nvm)." >&2
  exit 1
fi
NODE_MAJOR="$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERRO: Node $($NODE_BIN -v) detectado. Necessario Node 18+ (fetch nativo)." >&2
  exit 1
fi
echo "==> Node: $("$NODE_BIN" -v) ($NODE_BIN)"

if [ ! -f "$APP_DIR/.env" ]; then
  cp "$APP_DIR/.env.example" "$APP_DIR/.env"
  echo "==> .env criado a partir de .env.example."
fi
if ! grep -q '^NVIDIA_API_KEY=.\+' "$APP_DIR/.env"; then
  echo ""
  echo "!! Preencha NVIDIA_API_KEY em $APP_DIR/.env e rode novamente."
  exit 1
fi
if ! grep -qE '^ALLOWED_ORIGINS=https?://' "$APP_DIR/.env"; then
  echo ""
  echo "!! Defina ALLOWED_ORIGINS em $APP_DIR/.env com o(s) dominio(s) do site"
  echo "   (ex.: ALLOWED_ORIGINS=https://vnmax.org,https://www.vnmax.org). Use * so para teste."
  exit 1
fi
chmod 600 "$APP_DIR/.env"
mkdir -p "$APP_DIR/data"

echo "==> Instalando dependencias (firebase-admin)..."
( cd "$APP_DIR" && npm install --omit=dev --no-audit --no-fund )
if [ -f "$APP_DIR/serviceAccount.json" ]; then
  chmod 600 "$APP_DIR/serviceAccount.json"
  echo "==> serviceAccount.json detectado — leads irao para o Firestore (CRM)."
else
  echo "!! serviceAccount.json NAO encontrado em $APP_DIR."
  echo "   Sem ele, os leads vao so para data/leads.jsonl (CRM nao recebe)."
  echo "   Baixe em Firebase Console > Project settings > Service accounts e salve como serviceAccount.json aqui."
fi

UNIT_PATH="/etc/systemd/system/${SERVICE_NAME}.service"
echo "==> Escrevendo $UNIT_PATH"
cat > "$UNIT_PATH" <<EOF
[Unit]
Description=Assistente VNMAX (NVIDIA NIM)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$NODE_BIN $APP_DIR/index.js
Restart=on-failure
RestartSec=3
NoNewPrivileges=true
ProtectSystem=full
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE_NAME"
sleep 1
systemctl --no-pager --full status "$SERVICE_NAME" | head -12 || true

echo ""
echo "==> Pronto. Teste:  curl http://127.0.0.1:$(grep -E '^PORT=' "$APP_DIR/.env" | cut -d= -f2 || echo 8787)/api/health"
echo "==> Logs:           journalctl -u $SERVICE_NAME -f"
