#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKEND_PORT="${PORT:-5000}"
TIMEOUT="${HEALTH_TIMEOUT:-60}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

BACKEND_PID=""
if [ $# -ge 1 ] && [ "$1" = "--pid" ] && [ -n "${2:-}" ]; then
  BACKEND_PID="$2"
fi

if [ -z "$BACKEND_PID" ]; then
  BACKEND_PID=$(lsof -ti :"$BACKEND_PORT" 2>/dev/null | head -1 || echo "")
fi

info "Validating backend health on port $BACKEND_PORT (timeout: ${TIMEOUT}s)..."

START_TIME=$SECONDS
for i in $(seq 1 "$TIMEOUT"); do
  if [ -n "$BACKEND_PID" ] && ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend process (PID $BACKEND_PID) is no longer running"
    info "Check logs: cd $BACKEND_DIR && NODE_ENV=production node dist/app.js"
    exit 1
  fi

  HEALTH=$(curl -s -m 3 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "")
  if [ -z "$HEALTH" ]; then
    HEALTH=$(curl -s -m 3 "http://127.0.0.1:$BACKEND_PORT/health" 2>/dev/null || echo "")
  fi

  if [ -n "$HEALTH" ]; then
    HTTP_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "parse_error")
    DB_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('database','unknown'))" 2>/dev/null || echo "parse_error")
    PW_STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('playwright','unknown'))" 2>/dev/null || echo "parse_error")
    UPTIME=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('uptime',0))" 2>/dev/null || echo "0")
    UPTIME_INT=$(printf "%.0f" "$UPTIME" 2>/dev/null || echo "0")

    if [ "$HTTP_STATUS" = "ok" ]; then
      ELAPSED=$((SECONDS - START_TIME))
      ok "Backend is healthy (${ELAPSED}s)"
      echo ""
      echo "  Status:     ${HTTP_STATUS}"
      echo "  Database:   ${DB_STATUS}"
      echo "  Playwright: ${PW_STATUS}"
      echo "  Uptime:     ${UPTIME_INT}s"
      echo "  PID:        ${BACKEND_PID:-unknown}"
      echo "  Port:       ${BACKEND_PORT}"

      if [ "$DB_STATUS" != "connected" ]; then
        warn "Database is not connected (${DB_STATUS}) — some features may be unavailable"
      fi
      if [ "$PW_STATUS" != "available" ]; then
        warn "Playwright is not available (${PW_STATUS}) — scraper jobs may fail"
      fi

      exit 0
    fi
  fi

  ELAPSED=$((SECONDS - START_TIME))
  if [ $((i % 5)) -eq 0 ]; then
    info "  Still waiting... (${ELAPSED}s elapsed)"
  fi
  sleep 1
done

ELAPSED=$((SECONDS - START_TIME))
err "Backend did not become healthy within ${ELAPSED}s"

if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
  warn "Backend process is running but not responding on port $BACKEND_PORT"
  LAST_HEALTH=$(curl -s -m 2 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "no_response")
  if [ "$LAST_HEALTH" != "no_response" ]; then
    err "Last health response: $LAST_HEALTH"
  fi
  info "Check backend logs for errors"
else
  err "No backend process found on port $BACKEND_PORT"
  info "Start the backend first, then run this script"
fi

exit 1
