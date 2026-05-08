import { NextRequest, NextResponse } from 'next/server';
import { OIDC_FLOW_COOKIE, REDIRECT_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';

export const runtime = 'nodejs';

function clearAuthCookies(res: NextResponse) {
	res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
	res.cookies.set(OIDC_FLOW_COOKIE, '', { path: '/', maxAge: 0 });
	res.cookies.set(REDIRECT_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function POST(req: NextRequest) {
	const url = new URL(req.url);
	const target = new URL('/login', url);
	const res = NextResponse.redirect(target, { status: 303 });
	clearAuthCookies(res);
	return res;
}

export async function GET(req: NextRequest) {
	return POST(req);
}
