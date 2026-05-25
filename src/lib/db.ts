import Database from 'better-sqlite3';
import { ensureDataDirs, DATABASE_PATH, SEED_PASSWORD, SEED_USERNAME } from '$lib/config';
import { hashPassword } from '$lib/auth';
import type { DocumentRow, User, VoucherRow } from '$lib/types';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
	if (!db) {
		ensureDataDirs();
		db = new Database(DATABASE_PATH);
		db.pragma('journal_mode = WAL');
		db.pragma('foreign_keys = ON');
		initSchema(db);
		maybeSeedUser(db);
	}
	return db;
}

function initSchema(database: Database.Database): void {
	database.exec(`
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
}

function maybeSeedUser(database: Database.Database): void {
	const count = database.prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
	if (count.c > 0 || !SEED_USERNAME || !SEED_PASSWORD) return;

	const hash = hashPassword(SEED_PASSWORD);
	database.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
		SEED_USERNAME,
		hash
	);
}

export function findUserByUsername(username: string): (User & { password_hash: string }) | undefined {
	return getDb()
		.prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
		.get(username) as (User & { password_hash: string }) | undefined;
}

export function findUserById(id: number): User | undefined {
	return getDb().prepare('SELECT id, username FROM users WHERE id = ?').get(id) as User | undefined;
}

export function createSession(userId: number, sessionId: string, expiresAt: string): void {
	getDb()
		.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
		.run(sessionId, userId, expiresAt);
}

export function findSession(sessionId: string): { user_id: number; expires_at: string } | undefined {
	return getDb()
		.prepare('SELECT user_id, expires_at FROM sessions WHERE id = ?')
		.get(sessionId) as { user_id: number; expires_at: string } | undefined;
}

export function deleteSession(sessionId: string): void {
	getDb().prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

export function deleteExpiredSessions(): void {
	getDb().prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

const DOCUMENT_LIST_SQL = `
	SELECT d.id, d.original_filename, d.uploaded_at,
		COUNT(v.id) AS voucher_count,
		SUM(CASE WHEN v.status = 'used' THEN 1 ELSE 0 END) AS used_count
	FROM documents d
	LEFT JOIN vouchers v ON v.document_id = d.id
	WHERE d.user_id = ?
	GROUP BY d.id
`;

/** PDF con almeno un buono ancora disponibile. */
export function listActiveDocuments(userId: number): DocumentRow[] {
	return getDb()
		.prepare(
			`${DOCUMENT_LIST_SQL}
			HAVING voucher_count > used_count
			ORDER BY d.uploaded_at DESC`
		)
		.all(userId) as DocumentRow[];
}

/** PDF esauriti: tutti i buoni sono stati usati. */
export function listArchivedDocuments(userId: number): DocumentRow[] {
	return getDb()
		.prepare(
			`${DOCUMENT_LIST_SQL}
			HAVING voucher_count > 0 AND voucher_count = used_count
			ORDER BY d.uploaded_at DESC`
		)
		.all(userId) as DocumentRow[];
}

export function getDocument(
	userId: number,
	documentId: number
): { id: number; original_filename: string; stored_filename: string } | undefined {
	return getDb()
		.prepare(
			'SELECT id, original_filename, stored_filename FROM documents WHERE id = ? AND user_id = ?'
		)
		.get(documentId, userId) as
		| { id: number; original_filename: string; stored_filename: string }
		| undefined;
}

export function insertDocument(
	userId: number,
	originalFilename: string,
	storedFilename: string
): number {
	const result = getDb()
		.prepare('INSERT INTO documents (user_id, original_filename, stored_filename) VALUES (?, ?, ?)')
		.run(userId, originalFilename, storedFilename);
	return Number(result.lastInsertRowid);
}

export function insertVouchers(
	userId: number,
	documentId: number,
	vouchers: Array<{
		page_number: number;
		code: string;
		value_eur: number | null;
		expiry: string | null;
	}>
): void {
	const stmt = getDb().prepare(
		`INSERT INTO vouchers (document_id, user_id, page_number, code, value_eur, expiry)
		 VALUES (?, ?, ?, ?, ?, ?)`
	);
	const tx = getDb().transaction((rows) => {
		for (const v of rows) {
			stmt.run(documentId, userId, v.page_number, v.code, v.value_eur, v.expiry);
		}
	});
	tx(vouchers);
}

export function listVouchers(userId: number, documentId: number, status?: string): VoucherRow[] {
	if (status === 'available' || status === 'used') {
		return getDb()
			.prepare(
				`SELECT id, document_id, page_number, code, value_eur, expiry, status, used_at
				 FROM vouchers WHERE document_id = ? AND user_id = ? AND status = ?
				 ORDER BY page_number ASC`
			)
			.all(documentId, userId, status) as VoucherRow[];
	}
	return getDb()
		.prepare(
			`SELECT id, document_id, page_number, code, value_eur, expiry, status, used_at
			 FROM vouchers WHERE document_id = ? AND user_id = ?
			 ORDER BY page_number ASC`
		)
		.all(documentId, userId) as VoucherRow[];
}

export function getVoucher(
	userId: number,
	voucherId: number
): (VoucherRow & { document_filename: string; stored_filename: string }) | undefined {
	return getDb()
		.prepare(
			`SELECT v.id, v.document_id, v.page_number, v.code, v.value_eur, v.expiry, v.status, v.used_at,
				d.original_filename AS document_filename, d.stored_filename
			 FROM vouchers v
			 JOIN documents d ON d.id = v.document_id
			 WHERE v.id = ? AND v.user_id = ?`
		)
		.get(voucherId, userId) as
		| (VoucherRow & { document_filename: string; stored_filename: string })
		| undefined;
}

export function markVoucherUsed(userId: number, voucherId: number): boolean {
	const result = getDb()
		.prepare(
			`UPDATE vouchers SET status = 'used', used_at = datetime('now')
			 WHERE id = ? AND user_id = ? AND status = 'available'`
		)
		.run(voucherId, userId);
	return result.changes > 0;
}

export function markVoucherAvailable(userId: number, voucherId: number): boolean {
	const result = getDb()
		.prepare(
			`UPDATE vouchers SET status = 'available', used_at = NULL
			 WHERE id = ? AND user_id = ? AND status = 'used'`
		)
		.run(voucherId, userId);
	return result.changes > 0;
}

export function createUser(username: string, passwordHash: string): void {
	getDb()
		.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
		.run(username, passwordHash);
}
