import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import {
	buildSessionCookieAttributes,
	createSessionToken,
	isSecureRequest,
	SESSION_COOKIE,
} from '@/lib/auth/session';
import { countAccounts, createAccount } from '@/lib/auth/accounts';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface SetupBody {
	email?: unknown;
	password?: unknown;
	name?: unknown;
}

export async function POST(req: NextRequest) {
	const cfg = getAuthConfig();

	if (cfg.mode !== 'ACCOUNT' || !cfg.secret) {
		return NextResponse.json({ ok: false, error: 'Account mode is not enabled' }, { status: 400 });
	}

	if ((await countAccounts()) > 0) {
		return NextResponse.json(
			{ ok: false, error: 'Setup has already been completed' },
			{ status: 403 },
		);
	}

	const body = (await req.json().catch(() => null)) as SetupBody | null;
	const email = typeof body?.email === 'string' ? body.email.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';
	const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim() : undefined;

	if (!EMAIL_PATTERN.test(email)) {
		return NextResponse.json(
			{ ok: false, error: 'Please provide a valid email address' },
			{ status: 400 },
		);
	}
	if (password.length < MIN_PASSWORD_LENGTH) {
		return NextResponse.json(
			{ ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
			{ status: 400 },
		);
	}

	let account;
	try {
		account = await createAccount({ email, password, name, isAdmin: true });
	} catch (error) {
		console.error('[setup] failed to create initial admin:', error);
		return NextResponse.json(
			{ ok: false, error: 'Could not create the administrator account' },
			{ status: 409 },
		);
	}

	const { token } = await createSessionToken(
		cfg.secret,
		'ACCOUNT',
		account._id.toString(),
		cfg.sessionTtlSeconds,
		{
			email: account.email,
			name: account.name,
			ver: account.tokenVersion,
		},
	);

	const res = NextResponse.json({ ok: true, redirect: '/' });
	res.cookies.set(SESSION_COOKIE, token, {
		...buildSessionCookieAttributes({
			ttlSeconds: cfg.sessionTtlSeconds,
			secure: isSecureRequest(req.url),
		}),
	});
	return res;
}
