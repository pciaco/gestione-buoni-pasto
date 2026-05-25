import bcrypt from 'bcryptjs';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { SESSION_SECRET } from '$lib/config';
import {
	createSession,
	deleteExpiredSessions,
	deleteSession,
	findSession,
	findUserById
} from '$lib/db';
import type { User } from '$lib/types';

export const SESSION_COOKIE = 'session_id';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 12;

export function hashPassword(password: string): string {
	return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): boolean {
	return bcrypt.compareSync(password, hash);
}

function signSessionId(sessionId: string): string {
	const payload = Buffer.from(sessionId, 'utf8').toString('base64url');
	const sig = createHmac('sha256', SESSION_SECRET).update(sessionId).digest('base64url');
	return `${payload}.${sig}`;
}

function unsignSessionCookie(value: string): string | null {
	const parts = value.split('.');
	if (parts.length !== 2) return null;

	let sessionId: string;
	try {
		sessionId = Buffer.from(parts[0], 'base64url').toString('utf8');
	} catch {
		return null;
	}

	const expected = createHmac('sha256', SESSION_SECRET).update(sessionId).digest('base64url');
	const a = Buffer.from(parts[1]);
	const b = Buffer.from(expected);
	if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

	return sessionId;
}

export function startSession(cookies: Cookies, userId: number): void {
	deleteExpiredSessions();
	const sessionId = randomBytes(32).toString('hex');
	const expires = new Date();
	expires.setDate(expires.getDate() + SESSION_DAYS);
	const expiresAt = expires.toISOString().slice(0, 19).replace('T', ' ');

	createSession(userId, sessionId, expiresAt);

	cookies.set(SESSION_COOKIE, signSessionId(sessionId), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DAYS * 24 * 60 * 60
	});
}

export function endSession(cookies: Cookies): void {
	const raw = cookies.get(SESSION_COOKIE);
	if (raw) {
		const sessionId = unsignSessionCookie(raw);
		if (sessionId) deleteSession(sessionId);
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function getUserFromCookies(cookies: Cookies): User | null {
	const raw = cookies.get(SESSION_COOKIE);
	if (!raw) return null;

	const sessionId = unsignSessionCookie(raw);
	if (!sessionId) return null;

	const session = findSession(sessionId);
	if (!session) return null;

	if (new Date(session.expires_at) < new Date()) {
		deleteSession(sessionId);
		return null;
	}

	return findUserById(session.user_id) ?? null;
}
