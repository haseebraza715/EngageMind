#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SRC_DIR="$ROOT_DIR/docs/diagrams-src"
OUT_DIR="$ROOT_DIR/docs/diagrams-export"
THESIS_DIR="$(cd "$ROOT_DIR/.." && pwd)/ELTE_FI_Thesis_Template"

if [[ -d "$ROOT_DIR/.local-node/bin" ]]; then
  export PATH="$ROOT_DIR/.local-node/bin:$PATH"
fi

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx not found. Install Node.js or add .local-node/bin to PATH." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

render() {
  local input_file="$1"
  local output_name="$2"

  npx -y @mermaid-js/mermaid-cli \
    -c "$SRC_DIR/mermaid-config.json" \
    -i "$SRC_DIR/$input_file" \
    -o "$OUT_DIR/$output_name.png"

  npx -y @mermaid-js/mermaid-cli \
    -c "$SRC_DIR/mermaid-config.json" \
    -i "$SRC_DIR/$input_file" \
    -o "$OUT_DIR/$output_name.svg"
}

render "engagemind_architecture.mmd" "engagemind_architecture"
render "engagemind_user_flow.mmd" "diagram"

cp "$OUT_DIR/engagemind_architecture.png" "$THESIS_DIR/engagemind_architecture.png"
cp "$OUT_DIR/diagram.png" "$THESIS_DIR/diagram.png"

echo "Export completed."
echo "- $OUT_DIR/engagemind_architecture.png"
echo "- $OUT_DIR/engagemind_architecture.svg"
echo "- $OUT_DIR/diagram.png"
echo "- $OUT_DIR/diagram.svg"
echo "Synced thesis figures:"
echo "- $THESIS_DIR/engagemind_architecture.png"
echo "- $THESIS_DIR/diagram.png"
