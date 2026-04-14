#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
THESIS_DIR="$(cd "$ROOT_DIR/.." && pwd)/ELTE_FI_Thesis_Template"
TMP_DIR="$ROOT_DIR/.runtime-logs/screenshot-tmp"
STATE_FILE="$TMP_DIR/storage-state.json"

mkdir -p "$TMP_DIR"

if [[ -d "$ROOT_DIR/.local-node/bin" ]]; then
  export PATH="$ROOT_DIR/.local-node/bin:$PATH"
fi

for cmd in curl node npx; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: missing required command '$cmd'" >&2
    exit 1
  fi
done

PW="npx -y playwright@1.53.0"

capture_public() {
  local url="$1"
  local outfile="$2"
  local selector="$3"

  $PW screenshot \
    --browser chromium \
    --viewport-size "1440,900" \
    --wait-for-timeout 1800 \
    --wait-for-selector "$selector" \
    "$url" "$THESIS_DIR/$outfile"
}

capture_auth_chat() {
  local outfile="$1"

  $PW screenshot \
    --browser chromium \
    --viewport-size "1440,900" \
    --load-storage "$STATE_FILE" \
    --wait-for-timeout 3000 \
    --wait-for-selector "textarea[placeholder='Message EngageMind...']" \
    "http://localhost:3000/chat" "$THESIS_DIR/$outfile"
}

echo "[1/6] Capturing public pages..."
capture_public "http://localhost:3000" "landing_page.png" "text=Start Free Trial"
capture_public "http://localhost:3000/register" "register.png" "text=Create an account"
capture_public "http://localhost:3000/login" "login_main.png" "text=Welcome back"

echo "[2/6] Creating temporary user and auth state..."
TS="$(date +%s)"
EMAIL="phase3.${TS}@example.com"
USERNAME="phase3_${TS}"
PASSWORD="Thesis123!"

REGISTER_PAYLOAD=$(node -e 'console.log(JSON.stringify({username: process.argv[1], email: process.argv[2], password: process.argv[3]}))' "$USERNAME" "$EMAIL" "$PASSWORD")
REGISTER_RES=$(curl -sS -X POST "http://localhost:5003/auth/register" -H "Content-Type: application/json" -d "$REGISTER_PAYLOAD")
VERIFY_TOKEN=$(node -e 'const o=JSON.parse(process.argv[1]); process.stdout.write(o.verificationToken || "")' "$REGISTER_RES")

if [[ -z "$VERIFY_TOKEN" ]]; then
  echo "Error: registration did not return verification token: $REGISTER_RES" >&2
  exit 1
fi

curl -sS "http://localhost:5003/auth/verify-email?token=$VERIFY_TOKEN" >/dev/null

LOGIN_PAYLOAD=$(node -e 'console.log(JSON.stringify({emailOrUsername: process.argv[1], password: process.argv[2]}))' "$EMAIL" "$PASSWORD")
LOGIN_RES=$(curl -sS -X POST "http://localhost:5003/auth/login" -H "Content-Type: application/json" -d "$LOGIN_PAYLOAD")
TOKEN=$(node -e 'const o=JSON.parse(process.argv[1]); process.stdout.write(o.token || "")' "$LOGIN_RES")

if [[ -z "$TOKEN" ]]; then
  echo "Error: login did not return token: $LOGIN_RES" >&2
  exit 1
fi

cat > "$STATE_FILE" <<JSON
{
  "cookies": [],
  "origins": [
    {
      "origin": "http://localhost:3000",
      "localStorage": [
        { "name": "token", "value": "$TOKEN" }
      ]
    }
  ]
}
JSON

echo "[3/6] Creating chat conversation for screenshots..."
CONV_RES=$(curl -sS -X POST "http://localhost:5001/api/conversation" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}')
CONV_ID=$(node -e 'const o=JSON.parse(process.argv[1]); process.stdout.write(o.conversation_id || "")' "$CONV_RES")

if [[ -z "$CONV_ID" ]]; then
  echo "Error: could not create conversation: $CONV_RES" >&2
  exit 1
fi

DOC_PATH="$TMP_DIR/phase3_source_document.txt"
cat > "$DOC_PATH" <<'EOF'
EngageMind thesis source document

System architecture and responsibilities:
- Frontend: React application on port 3000 for login, chat, upload, and training controls.
- Auth backend: Node.js + Express service on port 5003 with JWT and Google OAuth support.
- RAG API: Flask service on port 5001 for document upload, retrieval, and conversation handling.
- Fine-tune API: Flask service on port 5002 with Celery worker + Redis queue for GPT-2 tasks.

Reliability and thesis-alignment challenges:
1) Reliable ingestion and indexing of uploaded documents.
2) Stable startup sequencing and authentication behavior across services.
3) High-quality grounded responses with explicit source traceability.
4) Keeping thesis diagrams and user documentation synchronized with implementation.

Transformer reference:
- The transformer architecture was introduced in the paper "Attention Is All You Need" by Vaswani et al. in 2017.
EOF

UPLOAD_RES=$(curl -sS -X POST "http://localhost:5001/api/upload" -H "Authorization: Bearer $TOKEN" -F "file=@$DOC_PATH;type=text/plain")
UPLOAD_STATUS=$(node -e 'const o=JSON.parse(process.argv[1]); process.stdout.write(o.status || "")' "$UPLOAD_RES")
if [[ "$UPLOAD_STATUS" != "success" && "$UPLOAD_STATUS" != "partial_success" ]]; then
  echo "Error: upload failed: $UPLOAD_RES" >&2
  exit 1
fi

echo "[4/6] Capturing chat interface baseline..."
capture_auth_chat "chat_interface.png"

send_message() {
  local msg="$1"
  local payload
  payload=$(node -e 'console.log(JSON.stringify({message: process.argv[1]}))' "$msg")
  curl -sS -X POST "http://localhost:5001/api/conversation/$CONV_ID/message" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null
}

echo "[5/6] Capturing chat example states..."
send_message "Summarize the uploaded document's architecture and component responsibilities in 3-4 sentences."
capture_auth_chat "chat_Example1.png"

send_message "List the main reliability and thesis-alignment challenges from the document."
capture_auth_chat "chat_Example2.png"

send_message "According to the uploaded document, who introduced the transformer model and in which year?"
capture_auth_chat "chat_Example3.png"

echo "[6/6] Done. Updated screenshots:"
echo "- $THESIS_DIR/landing_page.png"
echo "- $THESIS_DIR/register.png"
echo "- $THESIS_DIR/login_main.png"
echo "- $THESIS_DIR/chat_interface.png"
echo "- $THESIS_DIR/chat_Example1.png"
echo "- $THESIS_DIR/chat_Example2.png"
echo "- $THESIS_DIR/chat_Example3.png"
