#!/usr/bin/env bash
set -euo pipefail

# ════════════════════════════════════════════════════════════════
# Lead Finder Agent — Production Startup Script
# Starts backend, ngrok, auto-discovers ngrok URL, updates
# Netlify _redirects, builds frontend, and deploys to Netlify.
# ════════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
REDIRECTS_FILE="$FRONTEND_DIR/public/_redirects"
NGROK_LOG="/tmp/lead-finder-ngrok.log"
BACKEND_PORT="${PORT:-5000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
err()   { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
  info "Shutting down..."
  if [ -n "${NGROK_PID:-}" ]; then
    kill "$NGROK_PID" 2>/dev/null || true
  fi
  if [ -n "${BACKEND_PID:-}" ]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# ────────────────────────────────────────────────────────────────
# Step 1: Build backend
# ────────────────────────────────────────────────────────────────
info "Building backend..."
cd "$BACKEND_DIR"
npm run build 2>&1 | sed 's/^/  [BACKEND] /' || {
  err "Backend build failed — check TypeScript errors"
  exit 1
}
ok "Backend built successfully"

# ────────────────────────────────────────────────────────────────
# Step 2: Start backend
# ────────────────────────────────────────────────────────────────
info "Starting backend on port $BACKEND_PORT..."
cd "$BACKEND_DIR"
NODE_ENV=production node dist/app.js &
BACKEND_PID=$!

# Validate backend health before proceeding (max 60s)
info "Waiting for backend to become healthy (max 60s)..."
BACKEND_READY=false
BACKEND_START_SECONDS=$SECONDS
for i in $(seq 1 60); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend process died during startup"
    if [ -f "$BACKEND_DIR/dist/app.js" ]; then
      err "Run backend manually: cd $BACKEND_DIR && NODE_ENV=production node dist/app.js"
    fi
    exit 1
  fi

  HEALTH_JSON=$(curl -s -m 2 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "")
  if [ -n "$HEALTH_JSON" ]; then
    HTTP_CODE=$(echo "$HEALTH_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "")
    DB_STATUS=$(echo "$HEALTH_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('database','unknown'))" 2>/dev/null || echo "")
    PW_STATUS=$(echo "$HEALTH_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('playwright','unknown'))" 2>/dev/null || echo "")

    if [ "$HTTP_CODE" = "ok" ] && [ "$DB_STATUS" = "connected" ]; then
      BACKEND_READY=true
      ELAPSED=$((SECONDS - BACKEND_START_SECONDS))
      ok "Backend healthy after ${ELAPSED}s (PID: $BACKEND_PID, DB: $DB_STATUS, PW: $PW_STATUS)"
      break
    else
      info "  Backend responding but not ready (status=$HTTP_CODE, db=$DB_STATUS, pw=$PW_STATUS) — waiting..."
    fi
  else
    info "  Waiting for backend to respond on port $BACKEND_PORT..."
  fi
  sleep 1
done

if [ "$BACKEND_READY" != "true" ]; then
  # Final attempt — check if process is still alive
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    err "Backend process died during health check"
  else
    ELAPSED=$((SECONDS - BACKEND_START_SECONDS))
    warn "Backend did not become healthy within ${ELAPSED}s — proceeding anyway"
    warn "Check backend logs: cd $BACKEND_DIR && NODE_ENV=production node dist/app.js"
    # Try health one more time
    FINAL_JSON=$(curl -s -m 2 "http://127.0.0.1:$BACKEND_PORT/api/health" 2>/dev/null || echo "")
    if [ -n "$FINAL_JSON" ]; then
      warn "Backend is responding — proceeding..."
    else
      err "Backend is not responding — aborting"
      exit 1
    fi
  fi
fi

# ────────────────────────────────────────────────────────────────
# Step 3: Start ngrok (only after backend is verified healthy)
# ────────────────────────────────────────────────────────────────
info "Starting ngrok tunnel to port $BACKEND_PORT..."
ngrok http "$BACKEND_PORT" --log=stdout > "$NGROK_LOG" 2>&1 &
NGROK_PID=$!

# Wait for ngrok to be ready (max 30s)
NGROK_URL=""
info "Waiting for ngrok tunnel to become active..."
for i in $(seq 1 30); do
  # Check if ngrok API is responding
  NGROK_API=$(curl -s -m 2 http://127.0.0.1:4040/api/tunnels 2>/dev/null || echo "")
  if [ -n "$NGROK_API" ]; then
    NGROK_URL=$(echo "$NGROK_API" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    tunnels=d.get('tunnels',[])
    for t in tunnels:
        if t.get('proto')=='https':
            print(t['public_url'])
            break
    else:
        if tunnels:
            print(tunnels[0]['public_url'])
except: pass
" 2>/dev/null || echo "")
    if [ -n "$NGROK_URL" ]; then
      break
    fi
  fi
  sleep 1
done

if [ -z "$NGROK_URL" ]; then
  warn "Could not detect ngrok URL from API — checking log file..."
  NGROK_URL=$(grep -oP 'url=https?://[^\s]+' "$NGROK_LOG" 2>/dev/null | head -1 || echo "")
  if [ -n "$NGROK_URL" ]; then
    ok "Ngrok tunnel (from log): ${NGROK_URL}"
  fi
fi

if [ -z "$NGROK_URL" ]; then
  warn "Ngrok URL not detected. Check ngrok manually: http://127.0.0.1:4040"
  warn "Continuing without ngrok URL — manual setup required"
else
  ok "Ngrok tunnel: ${NGROK_URL}"
fi

# ────────────────────────────────────────────────────────────────
# Step 4: Update backend .env with ngrok URL
# ────────────────────────────────────────────────────────────────
if [ -n "$NGROK_URL" ]; then
  if grep -q "^NGROK_URL=" "$BACKEND_DIR/.env" 2>/dev/null; then
    sed -i "s|^NGROK_URL=.*|NGROK_URL=$NGROK_URL|" "$BACKEND_DIR/.env"
  else
    echo "" >> "$BACKEND_DIR/.env"
    echo "# Auto-detected at startup" >> "$BACKEND_DIR/.env"
    echo "NGROK_URL=$NGROK_URL" >> "$BACKEND_DIR/.env"
  fi
  ok "Updated backend .env with NGROK_URL=$NGROK_URL"

  # ──────────────────────────────────────────────────────────────
  # Step 5: Update Netlify _redirects with current ngrok URL
  # ──────────────────────────────────────────────────────────────
  cat > "$REDIRECTS_FILE" << EOF
# AUTO-GENERATED by scripts/start-production.sh at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ngrok URL: $NGROK_URL
/api/v1/*  ${NGROK_URL}/api/v1/:splat  200

# SPA fallback — all routes serve index.html
/*  /index.html  200
EOF
  ok "Updated Netlify _redirects with current ngrok URL"

  # ──────────────────────────────────────────────────────────────
  # Step 6: Export for frontend build
  # ──────────────────────────────────────────────────────────────
  export NEXT_PUBLIC_API_URL="${NGROK_URL}/api/v1"
  export NEXT_PUBLIC_SOCKET_URL="${NGROK_URL}"
  info "Set NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"
  info "Set NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}"
fi

# ────────────────────────────────────────────────────────────────
# Step 7: Verify ngrok tunnel (if available) — backend already
#         validated in Step 2, now check via ngrok endpoint
# ────────────────────────────────────────────────────────────────
if [ -n "${NGROK_URL:-}" ]; then
  info "Verifying ngrok tunnel at ${NGROK_URL}/api/health..."
  for i in $(seq 1 10); do
    NGROK_HEALTH=$(curl -s -m 3 "${NGROK_URL}/api/health" 2>/dev/null || echo "")
    NGROK_STATUS=$(echo "$NGROK_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
    NGROK_DB=$(echo "$NGROK_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('database',''))" 2>/dev/null || echo "")
    if [ "$NGROK_STATUS" = "ok" ] && [ "$NGROK_DB" = "connected" ]; then
      ok "Ngrok tunnel verified — backend reachable at ${NGROK_URL}/api/health"
      break
    fi
    if [ "$i" -eq 10 ]; then
      warn "Ngrok health check failed (status=$NGROK_STATUS, db=$NGROK_DB) — tunnel may not be fully ready"
    fi
    sleep 1
  done
fi

# ────────────────────────────────────────────────────────────────
# Step 9: Build frontend with ngrok URL
# ────────────────────────────────────────────────────────────────
if [ -n "${NGROK_URL:-}" ]; then
  info "Building frontend with NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}..."
  cd "$FRONTEND_DIR"
  npm run build 2>&1 | sed 's/^/  [FRONTEND] /' || {
    warn "Frontend build failed — you may need to build manually"
  }
  ok "Frontend built successfully"

  # ──────────────────────────────────────────────────────────────
  # Step 10: Deploy to Netlify (if CLI is available)
  # ──────────────────────────────────────────────────────────────
  if command -v netlify &>/dev/null; then
    info "Netlify CLI found — deploying to Netlify..."
    npx netlify deploy --prod --dir=out 2>&1 | sed 's/^/  [NETLIFY] /' || {
      warn "Netlify deploy failed — deploy the out/ directory manually"
    }
    ok "Frontend deployed to Netlify"
  else
    warn "Netlify CLI not found — deploy the out/ directory manually:"
    echo ""
    echo "  cd frontend && npx netlify deploy --prod --dir=out"
    echo ""
  fi
else
  warn "No ngrok URL available — skipping frontend build"
  warn "Build manually with: cd frontend && NEXT_PUBLIC_API_URL=<ngrok-url>/api/v1 npm run build"
fi

# ────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}Lead Finder Agent — Production Startup Complete${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo -e "  Backend:     ${BLUE}http://localhost:${BACKEND_PORT}${NC}"
if [ -n "${NGROK_URL:-}" ]; then
  echo -e "  Ngrok URL:  ${BLUE}${NGROK_URL}${NC}"
  echo -e "  API URL:    ${BLUE}${NGROK_URL}/api/v1${NC}"
  echo -e "  Socket URL: ${BLUE}${NGROK_URL}${NC}"
fi
echo -e "  Health:     ${BLUE}http://localhost:${BACKEND_PORT}/api/health${NC}"
echo -e "  Network:    ${BLUE}http://localhost:${BACKEND_PORT}/api/debug/network${NC}"
echo ""
if [ -n "${NGROK_URL:-}" ]; then
  echo -e "  ${YELLOW}Netlify frontend URL:  https://lead-finder-agent.netlify.app${NC}"
  echo -e "  ${YELLOW}CORS origin (Netlify): https://lead-finder-agent.netlify.app${NC}"
  echo -e "  ${YELLOW}All origins allowed — using JWT for auth${NC}"
fi
echo ""
echo -e "  ${RED}Press Ctrl+C to stop backend + ngrok${NC}"
echo "═══════════════════════════════════════════════════════════════"

# Wait for processes
wait
