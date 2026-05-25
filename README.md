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
