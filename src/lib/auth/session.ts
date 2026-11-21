import { AuthConfig, AuthMode, getPublicBaseURL } from '@/lib/auth/config';

export const SESSION_COOKIE = 'mongonaut_session';
export const OIDC_FLOW_COOKIE = 'mongonaut_oidc_flow';
export const REDIRECT_COOKIE = 'mongonaut_redirect';

export const SESSION_TOKEN_TYPE = 'session';
export const OIDC_FLOW_TOKEN_TYPE = 'oidc_flow';

export interface SessionPayload {
	typ: typeof SESSION_TOKEN_TYPE;
	sub: string;
	mode: AuthMode;
	iat: number;
	exp: number;
	email?: string;
	name?: string;
	ver?: number;
	recovery?: boolean;
	/** Fingerprint of the credential configuration the session was issued under. */
	bind?: string;
}

function toBase64Url(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): Uint8Array {
	const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
	const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign', 'verify'],
	);
}

async function hmacSign(secret: string, data: string): Promise<string> {
	const key = await importHmacKey(secret);
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
	return toBase64Url(new Uint8Array(sig));
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
}

export async function signPayload<T extends object>(secret: string, payload: T): Promise<string> {
	const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
	const sig = await hmacSign(secret, body);
	return `${body}.${sig}`;
}

export async function verifyPayload<T>(secret: string, token: string): Promise<T | null> {
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [body, sig] = parts;
	const expected = await hmacSign(secret, body);
	if (!timingSafeEqual(sig, expected)) return null;
	try {
		const json = decoder.decode(fromBase64Url(body));
		return JSON.parse(json) as T;
	} catch {
		return null;
	}
}

/**
 * Ties STATIC_PASSWORD and OIDC sessions to the configuration that issued them,
 * so rotating the shared password or pointing at another identity provider or
 * client ends every existing session. ACCOUNT sessions use tokenVersion instead.
 * The value is keyed with the auth secret, so the cookie reveals nothing about
 * the password.
 */
async function sessionBinding(cfg: AuthConfig, mode: AuthMode): Promise<string | null> {
	if (!cfg.secret) return null;
	if (mode === 'STATIC_PASSWORD' && cfg.staticPassword) {
		return hmacSign(cfg.secret, `session-bind:static-password:${cfg.staticPassword}`);
	}
	if (mode === 'OIDC' && cfg.oidc) {
		return hmacSign(cfg.secret, `session-bind:oidc:${cfg.oidc.issuer}\n${cfg.oidc.clientId}`);
	}
	return null;
}

// The allowlist is checked on every request, not only at login, so removing an
// address from MONGONAUT_OIDC_ALLOWED_EMAILS ends that user's session at once.
function oidcEmailStillAllowed(cfg: AuthConfig, email: string | undefined): boolean {
	const allowed = cfg.oidc?.allowedEmails;
	if (!allowed || allowed.length === 0) return true;
	return typeof email === 'string' && allowed.includes(email.toLowerCase());
}

export async function createSessionToken(
	cfg: AuthConfig,
	mode: AuthMode,
	subject: string,
	ttlSeconds: number,
	extra?: { email?: string; name?: string; ver?: number; recovery?: boolean },
): Promise<{ token: string; payload: SessionPayload }> {
	if (!cfg.secret) throw new Error('MONGONAUT_AUTH_SECRET is not configured');
	const bind = await sessionBinding(cfg, mode);
	const now = Math.floor(Date.now() / 1000);
	const payload: SessionPayload = {
		typ: SESSION_TOKEN_TYPE,
		sub: subject,
		mode,
		iat: now,
		exp: now + ttlSeconds,
		...(extra?.email ? { email: extra.email } : {}),
		...(extra?.name ? { name: extra.name } : {}),
		...(typeof extra?.ver === 'number' ? { ver: extra.ver } : {}),
		...(extra?.recovery ? { recovery: true } : {}),
		...(bind ? { bind } : {}),
	};
	const token = await signPayload(cfg.secret, payload);
	return { token, payload };
}

/**
 * Returns the session only if it is a session token issued for the active auth
 * mode and, for STATIC_PASSWORD and OIDC, for the current credential settings.
 */
export async function readSessionToken(
	cfg: AuthConfig,
	token: string | undefined,
): Promise<SessionPayload | null> {
	if (!token || !cfg.secret) return null;
	const payload = await verifyPayload<SessionPayload>(cfg.secret, token);
	if (!payload || typeof payload !== 'object') return null;
	if (payload.typ !== SESSION_TOKEN_TYPE) return null;
	if (payload.mode !== cfg.mode) return null;
	if (typeof payload.sub !== 'string' || payload.sub === '') return null;
	if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;

	const expectedBind = await sessionBinding(cfg, cfg.mode);
	if (expectedBind !== null) {
		if (typeof payload.bind !== 'string' || !timingSafeEqual(payload.bind, expectedBind)) {
			return null;
		}
	}
	if (cfg.mode === 'OIDC' && !oidcEmailStillAllowed(cfg, payload.email)) return null;
	return payload;
}

export interface SessionCookieOptions {
	ttlSeconds: number;
	secure: boolean;
}

export function buildSessionCookieAttributes(opts: SessionCookieOptions): {
	maxAge: number;
	path: string;
	httpOnly: true;
	sameSite: 'lax';
	secure: boolean;
} {
	return {
		maxAge: opts.ttlSeconds,
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: opts.secure,
	};
}

export function randomToken(byteLength = 32): string {
	const bytes = new Uint8Array(byteLength);
	crypto.getRandomValues(bytes);
	return toBase64Url(bytes);
}

export async function sha256Base64Url(input: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', encoder.encode(input));
	return toBase64Url(new Uint8Array(digest));
}

export function isSecureRequest(url: string): boolean {
	try {
		return new URL(getPublicBaseURL(url)).protocol === 'https:';
	} catch {
		return false;
	}
}
