#!/bin/bash
# Run on the Proxmox host (root shell), NOT inside the CT.
# Usage: ./scripts/deploy-from-proxmox-host.sh 107 /path/to/deploy-bundle.tar.gz
set -euo pipefail

VMID="${1:?VMID required}"
ARCHIVE="${2:?Path to deploy-bundle.tar.gz required}"
ARCHIVE="$(readlink -f "$ARCHIVE")"

if ! pct status "$VMID" &>/dev/null; then
  echo "CT $VMID not found on this node." >&2
  exit 1
fi

echo "Pushing bundle to CT $VMID..."
pct push "$VMID" "$ARCHIVE" /tmp/deploy-bundle.tar.gz

echo "Extracting and provisioning..."
pct exec "$VMID" -- bash -c '
  set -euo pipefail
  rm -rf /opt/gestione-buoni-pasto
  mkdir -p /opt
  tar xzf /tmp/deploy-bundle.tar.gz -C /opt
  chmod +x /opt/gestione-buoni-pasto/scripts/provision-ct.sh
  bash /opt/gestione-buoni-pasto/scripts/provision-ct.sh --app-only
'

echo "Deploy finished. Open http://<ct-ip>/"
