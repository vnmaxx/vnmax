#!/usr/bin/env bash
# Contrato do worker:  video-use-edit.sh <entrada.mp4> <instrucoes> <saida.mp4>
# Roda a edicao inteligente (cortar fillers, dead space, etc.) com o video-use sobre
# o video de entrada e devolve o resultado em <saida.mp4>.
#
# O video-use (browser-use/video-use) e um skill orientado a agente: ele espera uma
# PASTA com a footage e edita conforme as instrucoes. Este wrapper monta essa pasta,
# invoca o video-use e copia o resultado. Ajuste o comando conforme a sua instalacao;
# o worker degrada com nota se este script falhar ou nao gerar o MP4.
#
# Variaveis esperadas (defina no .env / ambiente do worker):
#   VIDEO_USE_HOME  -> diretorio do clone do video-use (com o ambiente uv pronto)
set -euo pipefail

IN="${1:?entrada.mp4 obrigatoria}"
INSTR="${2:-}"
OUT="${3:?saida.mp4 obrigatoria}"

: "${VIDEO_USE_HOME:?defina VIDEO_USE_HOME apontando para o clone do video-use}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$IN" "$WORK/source.mp4"
printf '%s\n' "$INSTR" > "$WORK/instructions.txt"

# Invoca o video-use sobre a pasta de trabalho. Ajuste a chamada conforme o
# entrypoint da sua versao (CLI/skill). Ex. tipico:
( cd "$VIDEO_USE_HOME" && uv run video-use edit "$WORK" --instructions-file "$WORK/instructions.txt" ) \
  || ( cd "$VIDEO_USE_HOME" && uv run python -m video_use "$WORK" ) \
  || { echo "video-use: falha ao executar" >&2; exit 1; }

# O video-use organiza a saida em edit/final.mp4 (ou final.mp4 na pasta).
GEN="$(ls -1 "$WORK/edit/final.mp4" "$WORK/final.mp4" "$WORK"/*final*.mp4 2>/dev/null | head -1 || true)"
[ -n "$GEN" ] || { echo "video-use: nenhum final.mp4 gerado" >&2; exit 1; }
cp "$GEN" "$OUT"
