import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import {
	buildSessionCookieAttributes,
	createSessionToken,
	isSecureRequest,
	SESSION_COOKIE,
} from '@/lib/auth/session';
import {
	checkLoginRateLimit,
	getClientKey,
	recordLoginFailure,
	recordLoginSuccess,
} from '@/lib/auth/rate-limit';

export const runtime = 'nodejs';

function timingSafeEqualStrings(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBytes = enc.encode(a);
	const bBytes = enc.encode(b);
	if (aBytes.length !== bBytes.length) return false;
	let diff = 0;
	for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
	return diff === 0;
}

function safeNext(value: string | null | undefined): string {
	if (!value) return '/';
	if (!value.startsWith('/')) return '/';
	if (value.startsWith('//')) return '/';
	return value;
}

async function readPassword(req: NextRequest): Promise<string> {
	const ct = req.headers.get('content-type') || '';
	if (ct.includes('application/json')) {
		const body = (await req.json().catch(() => null)) as { password?: unknown } | null;
		return typeof body?.password === 'string' ? body.password : '';
	}
	const form = await req.formData();
	const value = form.get('password');
	return typeof value === 'string' ? value : '';
}

export async function POST(req: NextRequest) {
	const cfg = getAuthConfig();

	if (cfg.mode !== 'STATIC_PASSWORD') {
		return NextResponse.json(
			{ ok: false, error: 'Password login is not enabled' },
			{ status: 400 },
		);
	}
	if (!cfg.secret || !cfg.staticPassword) {
		return NextResponse.json(
			{ ok: false, error: 'Authentication is not properly configured' },
			{ status: 500 },
		);
	}

	const clientKey = getClientKey(req);
	const limit = checkLoginRateLimit(clientKey);
	if (!limit.allowed) {
		return NextResponse.json(
			{ ok: false, error: 'Too many attempts. Please try again later.' },
			{ status: 429 },
		);
	}

	const password = await readPassword(req);
	if (!password || !timingSafeEqualStrings(password, cfg.staticPassword)) {
		recordLoginFailure(clientKey);
		const after = checkLoginRateLimit(clientKey);
		if (!after.allowed) {
			return NextResponse.json(
				{ ok: false, error: 'Too many attempts. Please try again later.' },
				{ status: 429 },
			);
		}
		return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 });
	}

	recordLoginSuccess(clientKey);

	const url = new URL(req.url);
	const next = safeNext(url.searchParams.get('next'));

	const { token } = await createSessionToken(
		cfg.secret,
		'STATIC_PASSWORD',
		'static-user',
		cfg.sessionTtlSeconds,
	);

	const res = NextResponse.json({ ok: true, redirect: next });
	res.cookies.set(SESSION_COOKIE, token, {
		...buildSessionCookieAttributes({
			ttlSeconds: cfg.sessionTtlSeconds,
			secure: isSecureRequest(req.url),
		}),
	});
	return res;
}
