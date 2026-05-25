import { env } from '$env/dynamic/private';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = process.cwd();

export const DATABASE_PATH = resolve(env.DATABASE_PATH ?? './data/app.db');
export const UPLOAD_DIR = resolve(env.UPLOAD_DIR ?? './data/uploads');
export const SESSION_SECRET = env.SESSION_SECRET ?? 'dev-secret-change-in-production';
export const SEED_USERNAME = env.SEED_USERNAME;
export const SEED_PASSWORD = env.SEED_PASSWORD;

export function ensureDataDirs(): void {
	for (const dir of [dirname(DATABASE_PATH), UPLOAD_DIR]) {
		if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
	}
}
