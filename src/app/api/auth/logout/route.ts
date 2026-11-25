import { NextRequest, NextResponse } from 'next/server';
import { OIDC_FLOW_COOKIE, REDIRECT_COOKIE, SESSION_COOKIE } from '@/lib/auth/session';
import { getPublicBaseURL } from '@/lib/auth/config';
import { CROSS_SITE_ERROR, isSameOriginRequest } from '@/lib/auth/origin';

export const runtime = 'nodejs';

function clearAuthCookies(res: NextResponse) {
	res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
	res.cookies.set(OIDC_FLOW_COOKIE, '', { path: '/', maxAge: 0 });
	res.cookies.set(REDIRECT_COOKIE, '', { path: '/', maxAge: 0 });
}

// POST only, so a third party page cannot sign users out via GET.
export async function POST(req: NextRequest) {
	if (!isSameOriginRequest(req)) {
		return new NextResponse(CROSS_SITE_ERROR, { status: 403 });
	}
	const url = new URL(getPublicBaseURL(req.url));
	const target = new URL('/login', url);
	const res = NextResponse.redirect(target, { status: 303 });
	clearAuthCookies(res);
	return res;
}
