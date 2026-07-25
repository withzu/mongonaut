import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, getPublicAuthInfo } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { findAccountById } from '@/lib/auth/accounts';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
	const cfg = getAuthConfig();
	const info = getPublicAuthInfo();

	const anonymous = NextResponse.json({ ...info, authenticated: false, user: null });

	if (cfg.mode === 'NONE' || !cfg.secret) return anonymous;

	const session = await readSessionToken(cfg.secret, req.cookies.get(SESSION_COOKIE)?.value);
	if (!session) return anonymous;

	// In account mode the token alone is not enough: the account may have been
	// disabled, deleted or signed out everywhere since the cookie was issued.
	if (session.mode === 'ACCOUNT') {
		const account = await findAccountById(session.sub);
		const stale = !account || account.disabled || account.tokenVersion !== (session.ver ?? -1);
		if (stale) return anonymous;
	}

	return NextResponse.json({
		...info,
		authenticated: true,
		mustChangePassword: !!session.recovery,
		user: {
			subject: session.sub,
			mode: session.mode,
			email: session.email ?? null,
			name: session.name ?? null,
		},
	});
}
