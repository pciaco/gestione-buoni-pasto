#!/bin/bash
# Esegui nella Shell del NODO Proxmox "Server-HA" (Interfaccia web → Server-HA → Shell).
# Non usare la console del CT. Richiede: pct, CT 107 avviato.
set -euo pipefail

VMID=107
BUNDLE="${1:-/tmp/deploy-bundle.tar.gz}"

if [[ -f "$BUNDLE" ]]; then
  echo "Deploy da bundle $BUNDLE ..."
  pct push "$VMID" "$BUNDLE" /tmp/deploy-bundle.tar.gz
  pct exec "$VMID" -- bash -c '
    set -euo pipefail
    rm -rf /opt/gestione-buoni-pasto
    mkdir -p /opt
    tar xzf /tmp/deploy-bundle.tar.gz -C /opt
    chmod +x /opt/gestione-buoni-pasto/scripts/provision-ct.sh
    bash /opt/gestione-buoni-pasto/scripts/provision-ct.sh --app-only
  '
else
  echo "Bundle non trovato, deploy da GitHub ..."
  pct exec "$VMID" -- bash -c '
    set -euo pipefail
    export DEBIAN_FRONTEND=noninteractive
    apt-get update
    apt-get install -y git curl ca-certificates gnupg nginx build-essential python3
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    rm -rf /opt/gestione-buoni-pasto
    git clone https://github.com/pciaco/gestione-buoni-pasto.git /opt/gestione-buoni-pasto
    cd /opt/gestione-buoni-pasto
    npm ci
    npm run build
    cp deploy/env.production.example .env
    sed -i "s/CHANGE_ME_SESSION_SECRET/$(openssl rand -hex 32)/" .env
    sed -i "s/CHANGE_ME_ADMIN_PASSWORD/Admin-$(openssl rand -hex 6)/" .env
    chmod +x scripts/provision-ct.sh
    ./scripts/provision-ct.sh --app-only
    echo "--- Credenziali app (salva):"
    grep -E "^SEED_" .env
  '
fi

IP=$(pct exec "$VMID" -- hostname -I | awk "{print \$1}")
echo "Deploy completato. Apri: http://${IP}/"
