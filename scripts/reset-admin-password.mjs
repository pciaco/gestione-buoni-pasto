#!/usr/bin/env node
/**
 * Reimposta la password dell'admin da SEED_USERNAME / SEED_PASSWORD nel .env
 * Uso sul CT: cd /opt/gestione-buoni-pasto && node scripts/reset-admin-password.mjs
 */
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readFileSync } from 'node:fs';

const root = process.cwd();
const envPath = resolve(root, '.env');
if (existsSync(envPath)) {
	for (const line of readFileSync(envPath, 'utf8').split('\n')) {
		const t = line.trim();
		if (!t || t.startsWith('#') || !t.includes('=')) continue;
		const i = t.indexOf('=');
		const k = t.slice(0, i).trim();
		let v = t.slice(i + 1).trim();
		if (
			(v.startsWith('"') && v.endsWith('"')) ||
			(v.startsWith("'") && v.endsWith("'"))
		) {
			v = v.slice(1, -1);
		}
		if (!(k in process.env)) process.env[k] = v;
	}
}

const username = process.env.SEED_USERNAME ?? 'admin';
const password = process.env.SEED_PASSWORD;
const dbPath = resolve(process.env.DATABASE_PATH ?? '/var/lib/gestione-buoni/app.db');

if (!password) {
	console.error('SEED_PASSWORD mancante in .env');
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
	CREATE TABLE IF NOT EXISTS sessions (
		id TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at TEXT NOT NULL
	);
	CREATE TABLE IF NOT EXISTS documents (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		original_filename TEXT NOT NULL,
		stored_filename TEXT NOT NULL,
		uploaded_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE TABLE IF NOT EXISTS vouchers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		page_number INTEGER NOT NULL,
		code TEXT NOT NULL,
		value_eur INTEGER,
		expiry TEXT,
		status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
		used_at TEXT,
		UNIQUE(user_id, code)
	);
	CREATE INDEX IF NOT EXISTS idx_vouchers_document ON vouchers(document_id);
	CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(user_id, status);
`);

const hash = bcrypt.hashSync(password, 12);
const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
if (row) {
	db.prepare('UPDATE users SET password_hash = ? WHERE username = ?').run(hash, username);
	console.log(`Password aggiornata per "${username}".`);
} else {
	db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
	console.log(`Utente "${username}" creato.`);
}
db.close();
console.log(`Login: ${username} / ${password}`);
