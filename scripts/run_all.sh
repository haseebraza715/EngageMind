#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
THESIS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

BACKEND_DIR="${THESIS_DIR}/engagemind-backend"
FRONTEND_DIR="${THESIS_DIR}/engagemind-frontend"
RAG_DIR="${THESIS_DIR}/engagemind-rag"
LOG_DIR="${THESIS_DIR}/.runtime-logs"

mkdir -p "${LOG_DIR}"

# Prefer repo-local Node runtime if present.
if [[ -x "${THESIS_DIR}/.local-node/bin/npm" ]]; then
  export PATH="${THESIS_DIR}/.local-node/bin:${PATH}"
fi

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    exit 1
  fi
}

require_cmd npm
require_cmd python3

if [[ ! -x "${RAG_DIR}/.venv/bin/python" ]]; then
  echo "Missing Python venv at ${RAG_DIR}/.venv"
  echo "Create it first, then install requirements."
  exit 1
fi

port_open() {
  local port="$1"
  python3 - "$port" <<'PY'
import socket, sys
port = int(sys.argv[1])
s = socket.socket()
s.settimeout(0.5)
try:
    s.connect(("127.0.0.1", port))
    print("open")
except Exception:
    print("closed")
finally:
    s.close()
PY
}

port_owner() {
  local port="$1"
  lsof -iTCP:"${port}" -sTCP:LISTEN -n -P 2>/dev/null | awk 'NR==2 {print $1 " (pid=" $2 ")"}'
}

declare -a PIDS=()
ALREADY_CLEANED_UP="false"

start_service() {
  local name="$1"
  local workdir="$2"
  local logfile="$3"
  shift 3

  (
    cd "$workdir"
    exec "$@"
  ) >"${logfile}" 2>&1 &

  local pid=$!
  PIDS+=("${pid}")
  echo "Started ${name} (pid=${pid})"
}

wait_for_port() {
  local port="$1"
  local name="$2"
  local attempts="${3:-20}"

  for _ in $(seq 1 "${attempts}"); do
    if [[ "$(port_open "${port}")" == "open" ]]; then
      return 0
    fi
    sleep 1
  done

  echo "Warning: ${name} did not open port ${port} in time. Check logs."
  return 1
}

cleanup() {
  if [[ "${ALREADY_CLEANED_UP}" == "true" ]]; then
    return
  fi
  ALREADY_CLEANED_UP="true"
  local code=$?
  if [[ ${#PIDS[@]} -gt 0 ]]; then
    echo
    echo "Stopping services..."
    for pid in "${PIDS[@]}"; do
      if kill -0 "${pid}" >/dev/null 2>&1; then
        kill "${pid}" >/dev/null 2>&1 || true
      fi
    done
    wait || true
  fi
  exit "${code}"
}

trap cleanup INT TERM EXIT

echo "Launcher root: ${THESIS_DIR}"
echo "Logs: ${LOG_DIR}"
echo

if [[ "$(port_open 27017)" != "open" ]]; then
  echo "Warning: MongoDB (localhost:27017) is not reachable."
  echo "Backend/RAG will start, but auth/data operations will return database unavailable errors."
  echo
fi

if [[ "$(port_open 5003)" == "open" ]]; then
  echo "Port 5003 already in use by $(port_owner 5003), skipping backend start."
else
  start_service "backend" "${BACKEND_DIR}" "${LOG_DIR}/backend.log" npm start
  wait_for_port 5003 "backend" 20 || true
fi

if [[ "$(port_open 5001)" == "open" ]]; then
  echo "Port 5001 already in use by $(port_owner 5001), skipping RAG API start."
else
  start_service "rag-api" "${RAG_DIR}" "${LOG_DIR}/rag.log" env DEBUG=false "${RAG_DIR}/.venv/bin/python" main.py
  wait_for_port 5001 "rag-api" 25 || true
fi

if [[ "$(port_open 5002)" == "open" ]]; then
  echo "Port 5002 already in use by $(port_owner 5002), skipping fine-tune API start."
else
  start_service "fine-tune-api" "${RAG_DIR}" "${LOG_DIR}/fine-tune.log" env FINE_TUNE_DEBUG=false "${RAG_DIR}/.venv/bin/python" fine_tune/fine_tune_app.py
  wait_for_port 5002 "fine-tune-api" 20 || true
fi

if [[ "$(port_open 6379)" != "open" ]]; then
  echo "Warning: Redis (localhost:6379) is not reachable."
  echo "Fine-tune API can start, but training tasks will fail until Redis is running."
elif [[ -x "${RAG_DIR}/.venv/bin/celery" ]]; then
  start_service "celery-worker" "${RAG_DIR}" "${LOG_DIR}/celery.log" "${RAG_DIR}/.venv/bin/celery" -A fine_tune.celery_config.app worker --loglevel=info
else
  echo "Warning: Celery binary not found in ${RAG_DIR}/.venv/bin/celery; worker not started."
fi

if [[ "$(port_open 3000)" == "open" ]]; then
  echo "Port 3000 already in use by $(port_owner 3000), skipping frontend start."
else
  start_service "frontend" "${FRONTEND_DIR}" "${LOG_DIR}/frontend.log" npm start
  wait_for_port 3000 "frontend" 30 || true
fi

echo
echo "Services should be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend : http://localhost:5003"
echo "  RAG API : http://localhost:5001"
echo "  Fine-tune API: http://localhost:5002"
echo
echo "Log files:"
echo "  ${LOG_DIR}/frontend.log"
echo "  ${LOG_DIR}/backend.log"
echo "  ${LOG_DIR}/rag.log"
echo "  ${LOG_DIR}/fine-tune.log"
echo "  ${LOG_DIR}/celery.log"
echo
echo "Press Ctrl+C to stop all started services."

while true; do
  sleep 2
  for pid in "${PIDS[@]}"; do
    if ! kill -0 "${pid}" >/dev/null 2>&1; then
      echo "A service exited unexpectedly. Check logs in ${LOG_DIR}."
      exit 1
    fi
  done
done
