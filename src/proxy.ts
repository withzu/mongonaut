import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';

const PUBLIC_PREFIXES = ['/login', '/api/auth/'];
const PUBLIC_FILES = ['/favicon.ico', '/robots.txt'];

function isPublic(pathname: string): boolean {
	if (PUBLIC_FILES.includes(pathname)) return true;
	if (pathname.startsWith('/_next/')) return true;
	if (pathname.startsWith('/images/')) return true;
	for (const prefix of PUBLIC_PREFIXES) {
		if (pathname === prefix || pathname.startsWith(prefix)) return true;
	}
	return false;
}

export async function proxy(req: NextRequest) {
	const cfg = getAuthConfig();
	if (cfg.mode === 'NONE' || !cfg.secret) {
		return NextResponse.next();
	}

	const { pathname, search } = req.nextUrl;

	if (isPublic(pathname)) {
		return NextResponse.next();
	}

	const token = req.cookies.get(SESSION_COOKIE)?.value;
	const session = await readSessionToken(cfg.secret, token);
	if (session) {
		return NextResponse.next();
	}

	const loginUrl = req.nextUrl.clone();
	loginUrl.pathname = '/login';
	loginUrl.search = '';
	const next = pathname + (search || '');
	if (next && next !== '/' && !next.startsWith('/login')) {
		loginUrl.searchParams.set('next', next);
	}

	if (req.cookies.get(SESSION_COOKIE)) {
		const res = NextResponse.redirect(loginUrl);
		res.cookies.delete(SESSION_COOKIE);
		return res;
	}
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|images/|favicon.ico|robots.txt).*)'],
};
