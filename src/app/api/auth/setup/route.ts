import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import {
	buildSessionCookieAttributes,
	createSessionToken,
	isSecureRequest,
	SESSION_COOKIE,
} from '@/lib/auth/session';
import {
	claimInitialSetup,
	countAccounts,
	createAccount,
	releaseInitialSetup,
} from '@/lib/auth/accounts';
import {
	checkLoginRateLimit,
	getClientKey,
	recordLoginFailure,
	retryAfterHeaders,
} from '@/lib/auth/rate-limit';
import { validatePassword } from '@/lib/auth/policy';
import { audit } from '@/lib/mongo/audit';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

	// Setup is unauthenticated by nature, so it gets the same abuse protection as
	// the login endpoint.
	const clientKey = getClientKey(req);
	const limit = checkLoginRateLimit(clientKey);
	if (!limit.allowed) {
		return NextResponse.json(
			{ ok: false, error: 'Too many attempts. Please try again later.' },
			{ status: 429, headers: retryAfterHeaders(limit) },
		);
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
		recordLoginFailure(clientKey);
		return NextResponse.json(
			{ ok: false, error: 'Please provide a valid email address' },
			{ status: 400 },
		);
	}
	const passwordError = validatePassword(password);
	if (passwordError) {
		recordLoginFailure(clientKey);
		return NextResponse.json({ ok: false, error: passwordError }, { status: 400 });
	}

	// Atomic claim so two simultaneous requests cannot both create an admin.
	let claimed: boolean;
	try {
		claimed = await claimInitialSetup();
	} catch (error) {
		console.error('[setup] could not claim the initial setup:', error);
		return NextResponse.json({ ok: false, error: 'Could not reach the database' }, { status: 500 });
	}
	if (!claimed) {
		return NextResponse.json(
			{ ok: false, error: 'Setup has already been completed' },
			{ status: 403 },
		);
	}

	let account;
	try {
		account = await createAccount({ email, password, name, isAdmin: true });
	} catch (error) {
		console.error('[setup] failed to create initial admin:', error);
		// Free the claim so the operator can try again.
		await releaseInitialSetup().catch(() => {});
		return NextResponse.json(
			{ ok: false, error: 'Could not create the administrator account' },
			{ status: 409 },
		);
	}

	audit({
		action: 'setup.createAdmin',
		actor: `account:${account.email}`,
		outcome: 'success',
	});

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
