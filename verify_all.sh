#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THESIS_DIR="$(cd "${ROOT_DIR}/.." && pwd)"

BACKEND_DIR="${ROOT_DIR}/engagemind-backend"
FRONTEND_DIR="${ROOT_DIR}/engagemind-frontend"
RAG_DIR="${ROOT_DIR}/engagemind-rag"

LOCAL_NODE_BIN="${THESIS_DIR}/.local-node/bin"
if [[ -x "${LOCAL_NODE_BIN}/npm" ]]; then
  export PATH="${LOCAL_NODE_BIN}:${PATH}"
fi

log() {
  printf "\n[%s] %s\n" "$(date +'%H:%M:%S')" "$1"
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

need_cmd npm
need_cmd python3
need_cmd docker

DOCKER_AVAILABLE="true"
if ! docker info >/dev/null 2>&1; then
  DOCKER_AVAILABLE="false"
  log "Docker daemon unavailable; skipping MongoDB container bootstrap"
fi

if [[ "${DOCKER_AVAILABLE}" == "true" ]]; then
  log "Ensuring MongoDB container is running"
  if [[ -n "$(docker ps --filter "name=^engagemind-mongo$" --format '{{.Names}}')" ]]; then
    log "MongoDB container already running"
  else
    if [[ -n "$(docker ps -a --filter "name=^engagemind-mongo$" --format '{{.Names}}')" ]]; then
      docker start engagemind-mongo >/dev/null
      log "Started existing MongoDB container"
    else
      docker run -d --name engagemind-mongo -p 27017:27017 mongo:7 >/dev/null
      log "Created and started MongoDB container"
    fi
  fi
fi

log "Verifying MongoDB port reachability"
if ! python3 - <<'PY'
import socket, sys
s = socket.socket()
s.settimeout(2)
try:
    s.connect(("127.0.0.1", 27017))
except Exception as e:
    print(f"MongoDB port check failed: {e}")
    sys.exit(1)
finally:
    s.close()
print("MongoDB reachable on localhost:27017")
PY
then
  if [[ "${DOCKER_AVAILABLE}" == "true" ]]; then
    echo "MongoDB port check failed even after Docker setup."
    exit 1
  fi
  log "MongoDB not reachable; continuing with limited checks"
fi

log "Running backend tests"
npm --prefix "${BACKEND_DIR}" test

log "Running frontend custom tests"
npm --prefix "${FRONTEND_DIR}" run test:custom

log "Running frontend Jest CI tests"
npm --prefix "${FRONTEND_DIR}" run test:ci

log "Running frontend production build"
npm --prefix "${FRONTEND_DIR}" run build

log "Running RAG API + phase1 tests"
"${RAG_DIR}/.venv/bin/python" "${RAG_DIR}/test_apis.py"
(
  cd "${RAG_DIR}"
  "./.venv/bin/python" test_phase1_simple.py
  "./.venv/bin/python" test_security_fixes.py
)

log "Running RAG phase verifiers"
"${RAG_DIR}/.venv/bin/python" "${RAG_DIR}/verify_phase3.py"
"${RAG_DIR}/.venv/bin/python" "${RAG_DIR}/verify_phase4.py"
log "Running RAG fine-tune contract tests"
"${RAG_DIR}/.venv/bin/python" "${RAG_DIR}/test_fine_tune_contract.py"

log "Running RAG compile check"
PYTHONPYCACHEPREFIX="${RAG_DIR}/.pycache" \
  "${RAG_DIR}/.venv/bin/python" -m compileall -q "${RAG_DIR}"

log "All verification steps passed"
