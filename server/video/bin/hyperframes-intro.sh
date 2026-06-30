#!/usr/bin/env bash
# Contrato do worker:  hyperframes-intro.sh <titulo> <subtitulo> <saida.mp4>
# Renderiza uma intro de marca (HTML -> MP4) com o hyperframes a partir do template
# em ../hyperframes-intro/. O titulo/subtitulo entram por ENV (sem interpolacao no
# shell) para evitar problemas com caracteres especiais.
#
# Ajuste o comando de render conforme a sua instalacao do hyperframes; o worker
# degrada com nota se este script falhar ou nao gerar o MP4.
set -euo pipefail

TITLE="${1:-VNMAX}"
SUBTITLE="${2:-}"
OUT="${3:?saida.mp4 obrigatoria}"

HERE="$(cd "$(dirname "$0")" && pwd)"
TEMPLATE="$HERE/../hyperframes-intro"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cp -r "$TEMPLATE"/. "$TMP"/

# Injeta titulo/subtitulo no HTML (via env, seguro a caracteres especiais).
TITLE="$TITLE" SUBTITLE="$SUBTITLE" python3 - "$TMP/index.html" <<'PY'
import os, sys
p = sys.argv[1]
with open(p, encoding='utf-8') as f: s = f.read()
def esc(x): return (x or '').replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')
s = s.replace('__TITLE__', esc(os.environ.get('TITLE',''))).replace('__SUBTITLE__', esc(os.environ.get('SUBTITLE','')))
with open(p, 'w', encoding='utf-8') as f: f.write(s)
PY

cd "$TMP"
# Render com o hyperframes (ajuste se a sua versao usar outra flag/saida).
npx --yes hyperframes render --out out.mp4 >/dev/null 2>&1 || npx --yes hyperframes render >/dev/null 2>&1

# Localiza o MP4 gerado e copia para a saida combinada.
GEN="$(ls -1 out.mp4 render/*.mp4 out/*.mp4 *.mp4 2>/dev/null | head -1 || true)"
[ -n "$GEN" ] || { echo "hyperframes: nenhum MP4 gerado" >&2; exit 1; }
cp "$GEN" "$OUT"
