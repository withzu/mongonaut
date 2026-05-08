import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig, getPublicAuthInfo } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
	const cfg = getAuthConfig();
	const info = getPublicAuthInfo();

	if (cfg.mode === 'NONE' || !cfg.secret) {
		return NextResponse.json({
			...info,
			authenticated: false,
			user: null,
		});
	}

	const session = await readSessionToken(cfg.secret, req.cookies.get(SESSION_COOKIE)?.value);
	if (!session) {
		return NextResponse.json({ ...info, authenticated: false, user: null });
	}

	return NextResponse.json({
		...info,
		authenticated: true,
		user: {
			subject: session.sub,
			mode: session.mode,
			email: session.email ?? null,
			name: session.name ?? null,
		},
	});
}
