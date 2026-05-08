import { AuthMode } from '@/lib/auth/config';

export const SESSION_COOKIE = 'mongonaut_session';
export const OIDC_FLOW_COOKIE = 'mongonaut_oidc_flow';
export const REDIRECT_COOKIE = 'mongonaut_redirect';

export interface SessionPayload {
	sub: string;
	mode: AuthMode;
	iat: number;
	exp: number;
	email?: string;
	name?: string;
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

export async function createSessionToken(
	secret: string,
	mode: AuthMode,
	subject: string,
	ttlSeconds: number,
	extra?: { email?: string; name?: string },
): Promise<{ token: string; payload: SessionPayload }> {
	const now = Math.floor(Date.now() / 1000);
	const payload: SessionPayload = {
		sub: subject,
		mode,
		iat: now,
		exp: now + ttlSeconds,
		...(extra?.email ? { email: extra.email } : {}),
		...(extra?.name ? { name: extra.name } : {}),
	};
	const token = await signPayload(secret, payload);
	return { token, payload };
}

export async function readSessionToken(
	secret: string,
	token: string | undefined,
): Promise<SessionPayload | null> {
	if (!token) return null;
	const payload = await verifyPayload<SessionPayload>(secret, token);
	if (!payload) return null;
	if (typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now()) return null;
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
		return new URL(url).protocol === 'https:';
	} catch {
		return false;
	}
}
