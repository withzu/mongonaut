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
import {
	dummyVerify,
	findAccountByEmail,
	verifyPassword,
	verifyRecovery,
} from '@/lib/auth/accounts';

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

interface Credentials {
	email?: string;
	password: string;
}

async function readCredentials(req: NextRequest): Promise<Credentials> {
	const ct = req.headers.get('content-type') || '';
	if (ct.includes('application/json')) {
		const body = (await req.json().catch(() => null)) as {
			email?: unknown;
			password?: unknown;
		} | null;
		return {
			email: typeof body?.email === 'string' ? body.email : undefined,
			password: typeof body?.password === 'string' ? body.password : '',
		};
	}
	const form = await req.formData();
	const email = form.get('email');
	const password = form.get('password');
	return {
		email: typeof email === 'string' ? email : undefined,
		password: typeof password === 'string' ? password : '',
	};
}

function failureResponse(clientKey: string, message: string) {
	recordLoginFailure(clientKey);
	const after = checkLoginRateLimit(clientKey);
	if (!after.allowed) {
		return NextResponse.json(
			{ ok: false, error: 'Too many attempts. Please try again later.' },
			{ status: 429 },
		);
	}
	return NextResponse.json({ ok: false, error: message }, { status: 401 });
}

function successResponse(req: NextRequest, token: string, next: string, ttlSeconds: number) {
	const res = NextResponse.json({ ok: true, redirect: next });
	res.cookies.set(SESSION_COOKIE, token, {
		...buildSessionCookieAttributes({ ttlSeconds, secure: isSecureRequest(req.url) }),
	});
	return res;
}

export async function POST(req: NextRequest) {
	const cfg = getAuthConfig();

	if (cfg.mode !== 'STATIC_PASSWORD' && cfg.mode !== 'ACCOUNT') {
		return NextResponse.json(
			{ ok: false, error: 'Password login is not enabled' },
			{ status: 400 },
		);
	}
	if (!cfg.secret) {
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

	const creds = await readCredentials(req);
	const next = safeNext(new URL(req.url).searchParams.get('next'));

	if (cfg.mode === 'STATIC_PASSWORD') {
		if (!cfg.staticPassword) {
			return NextResponse.json(
				{ ok: false, error: 'Authentication is not properly configured' },
				{ status: 500 },
			);
		}
		if (!creds.password || !timingSafeEqualStrings(creds.password, cfg.staticPassword)) {
			return failureResponse(clientKey, 'Invalid password');
		}
		recordLoginSuccess(clientKey);
		const { token } = await createSessionToken(
			cfg.secret,
			'STATIC_PASSWORD',
			'static-user',
			cfg.sessionTtlSeconds,
		);
		return successResponse(req, token, next, cfg.sessionTtlSeconds);
	}

	const account = creds.email ? await findAccountByEmail(creds.email) : null;
	let valid = false;
	let recovery = false;
	if (account && !account.disabled) {
		valid = await verifyPassword(account.passwordHash, creds.password);
		if (!valid) recovery = await verifyRecovery(account, creds.password);
	} else {
		await dummyVerify(creds.password);
	}

	if (!account || account.disabled || (!valid && !recovery)) {
		return failureResponse(clientKey, 'Invalid email or password');
	}

	recordLoginSuccess(clientKey);
	const { token } = await createSessionToken(
		cfg.secret,
		'ACCOUNT',
		account._id.toString(),
		cfg.sessionTtlSeconds,
		{ email: account.email, name: account.name, ver: account.tokenVersion, recovery },
	);
	return successResponse(req, token, next, cfg.sessionTtlSeconds);
}
