import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import {
	buildSessionCookieAttributes,
	createSessionToken,
	isSecureRequest,
	readSessionToken,
	SESSION_COOKIE,
} from '@/lib/auth/session';
import {
	checkLoginRateLimit,
	getClientKey,
	recordLoginFailure,
	recordLoginSuccess,
} from '@/lib/auth/rate-limit';
import {
	findAccountById,
	setAccountPassword,
	verifyPassword,
	verifyRecovery,
} from '@/lib/auth/accounts';

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 8;

interface Body {
	currentPassword?: unknown;
	newPassword?: unknown;
}

export async function POST(req: NextRequest) {
	const cfg = getAuthConfig();
	if (cfg.mode !== 'ACCOUNT' || !cfg.secret) {
		return NextResponse.json({ ok: false, error: 'Account mode is not enabled' }, { status: 400 });
	}

	const session = await readSessionToken(cfg.secret, req.cookies.get(SESSION_COOKIE)?.value);
	if (!session || session.mode !== 'ACCOUNT') {
		return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
	}

	const account = await findAccountById(session.sub);
	if (!account || account.disabled || account.tokenVersion !== (session.ver ?? -1)) {
		return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 });
	}

	const clientKey = getClientKey(req);
	if (!checkLoginRateLimit(clientKey).allowed) {
		return NextResponse.json(
			{ ok: false, error: 'Too many attempts. Please try again later.' },
			{ status: 429 },
		);
	}

	const body = (await req.json().catch(() => null)) as Body | null;
	const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
	const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

	const currentValid =
		(await verifyPassword(account.passwordHash, currentPassword)) ||
		(await verifyRecovery(account, currentPassword));
	if (!currentValid) {
		recordLoginFailure(clientKey);
		return NextResponse.json(
			{ ok: false, error: 'Current password is incorrect' },
			{ status: 401 },
		);
	}
	recordLoginSuccess(clientKey);

	if (newPassword.length < MIN_PASSWORD_LENGTH) {
		return NextResponse.json(
			{ ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
			{ status: 400 },
		);
	}

	await setAccountPassword(account._id.toString(), newPassword);
	const newVersion = account.tokenVersion + 1;

	const { token } = await createSessionToken(
		cfg.secret,
		'ACCOUNT',
		account._id.toString(),
		cfg.sessionTtlSeconds,
		{ email: account.email, name: account.name, ver: newVersion },
	);

	const res = NextResponse.json({ ok: true });
	res.cookies.set(SESSION_COOKIE, token, {
		...buildSessionCookieAttributes({
			ttlSeconds: cfg.sessionTtlSeconds,
			secure: isSecureRequest(req.url),
		}),
	});
	return res;
}
