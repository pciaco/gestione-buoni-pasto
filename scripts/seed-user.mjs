import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const username = process.argv[2] ?? process.env.SEED_USERNAME;
const password = process.argv[3] ?? process.env.SEED_PASSWORD;
const dbPath = resolve(process.env.DATABASE_PATH ?? './data/app.db');

if (!username || !password) {
	console.error('Uso: node scripts/seed-user.mjs <username> <password>');
	console.error('Oppure imposta SEED_USERNAME e SEED_PASSWORD in .env');
	process.exit(1);
}

const dir = dirname(dbPath);
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const db = new Database(dbPath);
db.exec(`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		username TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
`);

const hash = bcrypt.hashSync(password, 12);
try {
	db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
	console.log(`Utente "${username}" creato.`);
} catch (e) {
	if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
		console.error(`Username "${username}" già esistente.`);
		process.exit(1);
	}
	throw e;
}

db.close();
