# Gestione Buoni Pasto

Web app **SvelteKit** per gestire PDF di buoni Pluxee: import, visualizzazione barcode alla cassa dal telefono, marcatura come usato.

## Funzionalità

- Login con username e password
- Upload PDF (drag & drop o file picker)
- Estrazione automatica codici Pluxee (14 cifre)
- Lista buoni con filtri (disponibili / usati / tutti)
- Schermo cassa a tutto schermo con pagina PDF per scansione
- Segna come usato solo dopo la cassa (con conferma)

## Avvio rapido (sviluppo)

```bash
cp .env.example .env
# Modifica SESSION_SECRET, SEED_USERNAME, SEED_PASSWORD

npm install
npm run dev
```

Apri `http://localhost:5173` e accedi con le credenziali da `.env`.

### Creare utente manualmente

```bash
npm run seed -- admin tua-password-sicura
```

## Produzione (CT Proxmox)

CT di esempio: **107** `gestione-buoni` — IP **192.168.1.188** (DHCP).

### Deploy automatico (bundle)

Su Windows (nel repo):

```powershell
npm run build
.\scripts\build-bundle.ps1
```

**Opzione A — dal nodo Proxmox** (shell root su `192.168.1.52`):

```bash
scp deploy-bundle.tar.gz root@192.168.1.52:/tmp/
ssh root@192.168.1.52 'bash -s' 107 /tmp/deploy-bundle.tar.gz < scripts/deploy-from-proxmox-host.sh
```

**Opzione B — SSH sul CT** (password root in `.env.deploy`):

```bash
cp .env.deploy.example .env.deploy   # CT_PASSWORD=...
pip install paramiko
python scripts/deploy-remote.py
```

**Opzione C — console CT** (Proxmox → CT 107 → Console, incolla):

```bash
apt update && apt install -y git curl ca-certificates gnupg nginx build-essential python3
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt install -y nodejs
git clone https://github.com/pciaco/gestione-buoni-pasto.git /opt/gestione-buoni-pasto
cd /opt/gestione-buoni-pasto && npm ci && npm run build
cp deploy/env.production.example .env
nano .env   # imposta SEED_PASSWORD
chmod +x scripts/provision-ct.sh && ./scripts/provision-ct.sh --app-only
```

App: **http://192.168.1.188/** (nginx → Node su porta 3000).

### Avvio manuale

```bash
npm run build
node build
```

Variabili ambiente:

| Variabile | Descrizione |
|-----------|-------------|
| `SESSION_SECRET` | Stringa casuale lunga (obbligatoria in produzione) |
| `DATABASE_PATH` | Percorso SQLite (es. `/var/lib/gestione-buoni/app.db`) |
| `UPLOAD_DIR` | Cartella PDF caricati |
| `PORT` | Porta Node (default 3000) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `SEED_USERNAME` / `SEED_PASSWORD` | Primo utente se DB vuoto |

### systemd (esempio)

```ini
[Unit]
Description=Gestione Buoni Pasto
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/gestione-buoni-pasto
Environment=NODE_ENV=production
EnvironmentFile=/opt/gestione-buoni-pasto/.env
ExecStart=/usr/bin/node build
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### nginx (reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name buoni.tuodominio.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Backup

Copia periodicamente:

- file in `UPLOAD_DIR`
- database SQLite (`DATABASE_PATH`)
