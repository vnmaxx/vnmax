#!/usr/bin/env bash
# Instala o worker de edicao de video do VNMAX — LEVE, FFmpeg-only.
# Sem Chrome, sem root, sem yt-dlp/whisper/claude. O binario do FFmpeg vem do pacote
# npm `ffmpeg-static` (~80MB), instalado junto com as deps do servidor.
#
# Como rodar (no servidor):   cd ~/vnmax/server && bash install-video.sh
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE"

echo "== Instalando dependencias do servidor (inclui ffmpeg-static) =="
npm install --omit=dev

echo "== Criando diretorios de trabalho =="
mkdir -p video/inbox video/output

echo "== Verificando o FFmpeg empacotado =="
node -e "import('ffmpeg-static').then(m=>{const p=m.default;if(!p){console.error('ffmpeg-static sem binario para esta plataforma');process.exit(1)}console.log('ffmpeg-static OK:',p)})" \
  || { echo 'Falha ao localizar o ffmpeg-static. Rode npm install novamente.'; exit 1; }

cat <<EOF

============================================================
Pronto. Para ATIVAR o worker, adicione ao server/.env:

  VIDEO_WORKER_ENABLED=true
  VIDEO_PUBLIC_BASE=https://vnmax.tail740f28.ts.net   # base publica deste servidor
  # VIDEO_MAX_INPUT_MB=600                              # teto do download (opcional)
  # VIDEO_URL_ALLOWED_HOSTS=youtube.com,vimeo.com       # allowlist de origem (opcional, mais seguro)

Depois:  sudo systemctl restart vnmax-assistant

USO: aba "Vídeo" do portal -> envie um arquivo no inbox (server/video/inbox/) ou
uma URL https, marque as opcoes (9:16, -14 LUFS, legendas do roteiro, color, intro)
e acompanhe o job. O MP4 final vira midia para a aba Social.

OBS: HyperFrames (grafismo animado) e video-use (corte por IA) NAO sao instalados
aqui — sao pesados (Chrome/uv). Ficam no caminho local/assistido (rode-os na sua
maquina e suba o resultado pelo inbox). Se um dia quiser render no servidor, suba
um worker dedicado separado deste.
============================================================
EOF
