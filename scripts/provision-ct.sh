#!/bin/bash
# Provision Gestione Buoni Pasto on Debian LXC (run as root inside CT or via: pct exec <vmid> -- bash -s)
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/gestione-buoni-pasto}"
DATA_DIR="${DATA_DIR:-/var/lib/gestione-buoni}"
SERVICE_USER="${SERVICE_USER:-www-data}"
SKIP_APT="${SKIP_APT:-0}"

log() { echo "[provision] $*"; }

if [[ "${1:-}" == "--app-only" ]]; then
  SKIP_APT=1
fi

if [[ "$SKIP_APT" != "1" ]]; then
  log "Installing system packages..."
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y curl ca-certificates gnupg nginx build-essential python3

  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 22 ]]; then
    log "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
  fi
fi

log "Preparing directories..."
mkdir -p "$APP_DIR" "$DATA_DIR/uploads"
chown -R "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"

if [[ ! -f "$APP_DIR/package.json" ]]; then
  echo "ERROR: $APP_DIR/package.json not found. Copy the app bundle first." >&2
  exit 1
fi

cd "$APP_DIR"

if [[ ! -f .env ]]; then
  if [[ -f deploy/env.production.example ]]; then
    cp deploy/env.production.example .env
    sed -i "s/CHANGE_ME_SESSION_SECRET/$(openssl rand -hex 32)/" .env
    log "Created .env from template — set SEED_PASSWORD before going live."
  else
    echo "ERROR: missing .env and deploy/env.production.example" >&2
    exit 1
  fi
fi

log "Installing Node dependencies (native build for Linux)..."
npm ci --omit=dev

if [[ ! -d build ]] || [[ ! -f build/index.js ]]; then
  log "No build/ output — running npm run build on server..."
  npm run build
fi

log "Installing systemd unit..."
install -m 0644 deploy/gestione-buoni-pasto.service /etc/systemd/system/gestione-buoni-pasto.service
install -m 0644 deploy/nginx-gestione-buoni.conf /etc/nginx/sites-available/gestione-buoni-pasto
ln -sf /etc/nginx/sites-available/gestione-buoni-pasto /etc/nginx/sites-enabled/gestione-buoni-pasto
rm -f /etc/nginx/sites-enabled/default

chown -R "$SERVICE_USER:$SERVICE_USER" "$APP_DIR" "$DATA_DIR"

systemctl daemon-reload
systemctl enable gestione-buoni-pasto nginx
systemctl restart gestione-buoni-pasto
nginx -t && systemctl reload nginx

log "Done. App should listen on http://$(hostname -I | awk '{print $1}'):80"
systemctl --no-pager status gestione-buoni-pasto || true
