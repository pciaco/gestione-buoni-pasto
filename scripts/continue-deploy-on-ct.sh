#!/bin/bash
# Esegui sul CT (o: pct exec 107 -- bash -s < scripts/continue-deploy-on-ct.sh)
set -euo pipefail

APP_DIR=/opt/gestione-buoni-pasto
DATA_DIR=/var/lib/gestione-buoni

export DEBIAN_FRONTEND=noninteractive
cd "$APP_DIR"

# Allinea pdfjs-dist (lock file su GitHub può essere vecchio)
if grep -q '"pdfjs-dist": "^5.7' package.json 2>/dev/null; then
  sed -i 's/"pdfjs-dist": "^5.7.284"/"pdfjs-dist": "5.4.296"/' package.json
fi

npm install
npm run build

mkdir -p "$DATA_DIR/uploads"
chown -R www-data:www-data "$DATA_DIR"

if [[ ! -f .env ]]; then
  SESSION=$(openssl rand -hex 32)
  ADMIN_PASS="Admin-$(openssl rand -hex 6)"
  cat > .env <<EOF
SESSION_SECRET=${SESSION}
DATABASE_PATH=${DATA_DIR}/app.db
UPLOAD_DIR=${DATA_DIR}/uploads
PORT=3000
HOST=127.0.0.1
COOKIE_SECURE=false
SEED_USERNAME=admin
SEED_PASSWORD=${ADMIN_PASS}
EOF
  echo "Credenziali app:"
  grep ^SEED_ .env
fi

cat > /etc/systemd/system/gestione-buoni-pasto.service <<'EOF'
[Unit]
Description=Gestione Buoni Pasto
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/gestione-buoni-pasto
Environment=NODE_ENV=production
EnvironmentFile=/opt/gestione-buoni-pasto/.env
ExecStart=/usr/bin/node /opt/gestione-buoni-pasto/build/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/nginx/sites-available/gestione-buoni-pasto <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 32M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/gestione-buoni-pasto /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

chown -R www-data:www-data "$APP_DIR" "$DATA_DIR"
systemctl daemon-reload
systemctl enable gestione-buoni-pasto nginx
systemctl restart gestione-buoni-pasto
nginx -t && systemctl reload nginx

IP=$(hostname -I | awk '{print $1}')
echo "OK — http://${IP}/"
