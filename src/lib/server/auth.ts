import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { USER_NAME, PASSWORD, AUTH_SECRET } from '$app/env/private';

export interface AuthUser {
	username: string;
	role: 'admin' | 'manager' | 'agent';
}

const COOKIE_NAME = 'amasoft_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
	return AUTH_SECRET || process.env.AUTH_SECRET || 'amasoft-crm-default-auth-secret-key-2026-ao';
}

function getValidUsername(): string {
	return USER_NAME || process.env.USER_NAME || 'anvima';
}

function getValidPassword(): string {
	return PASSWORD || process.env.PASSWORD || 'YxzveZ3a2h175w==';
}

/**
 * Validates provided credentials against server environment variables.
 */
export function verifyCredentials(username?: string, password?: string): boolean {
	if (!username || !password) return false;
	const expectedUser = getValidUsername();
	const expectedPass = getValidPassword();

	const userMatch = username.trim() === expectedUser.trim();
	const passMatch = password.trim() === expectedPass.trim();

	return userMatch && passMatch;
}

/**
 * Creates a cryptographically signed session token: Base64(payload).Base64(signature)
 */
export function createSignedToken(payload: { username: string; role: string; exp: number }): string {
	const secret = getSecret();
	const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = createHmac('sha256', secret).update(dataStr).digest('base64url');
	return `${dataStr}.${signature}`;
}

/**
 * Verifies a signed session token and returns the payload if valid.
 */
export function verifySignedToken(token: string): { username: string; role: string; exp: number } | null {
	try {
		const [dataStr, signature] = token.split('.');
		if (!dataStr || !signature) return null;

		const secret = getSecret();
		const expectedSignature = createHmac('sha256', secret).update(dataStr).digest('base64url');

		const sigBuffer = Buffer.from(signature);
		const expectedBuffer = Buffer.from(expectedSignature);

		if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
			return null;
		}

		const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf-8'));
		if (!payload || typeof payload !== 'object') return null;

		// Check expiry
		if (payload.exp && Date.now() > payload.exp) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}

/**
 * Sets the secure HTTP-only session cookie.
 */
export function createSessionCookie(cookies: Cookies, user: AuthUser): void {
	const exp = Date.now() + SESSION_MAX_AGE * 1000;
	const token = createSignedToken({ username: user.username, role: user.role, exp });

	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_MAX_AGE
	});
}

/**
 * Reads and validates the session cookie from request.
 */
export function getSessionUser(cookies: Cookies): AuthUser | null {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return null;

	const payload = verifySignedToken(token);
	if (!payload) return null;

	// Verify username matches active server config
	if (payload.username !== getValidUsername()) {
		return null;
	}

	return {
		username: payload.username,
		role: (payload.role as 'admin') || 'admin'
	};
}

/**
 * Clears the session cookie.
 */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(COOKIE_NAME, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production'
	});
}
