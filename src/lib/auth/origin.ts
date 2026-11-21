import type { NextRequest } from 'next/server';
import { getExternalURLInfo } from '@/lib/auth/config';

function firstValue(header: string | null): string | null {
	const value = header?.split(',')[0]?.trim();
	return value || null;
}

function allowedHosts(req: NextRequest): Set<string> {
	const hosts = new Set<string>();
	const external = getExternalURLInfo().url;
	if (external) hosts.add(new URL(external).host);
	const host =
		firstValue(req.headers.get('x-forwarded-host')) ?? firstValue(req.headers.get('host'));
	if (host) hosts.add(host);
	hosts.add(req.nextUrl.host);
	return hosts;
}

/**
 * Rejects cross site requests to the auth routes that create, change or clear
 * the session cookie. Route handlers do not get the origin check Next.js
 * applies to server actions, and SameSite=Lax does not stop a cross site form
 * from storing a cookie, which would allow login CSRF into an attacker's
 * account.
 *
 * Current browsers send Sec-Fetch-Site, and a page cannot set or override it.
 * Without it the Origin header is compared with the host the request was sent
 * to. Browsers send Origin on every cross site POST, so a request with neither
 * header comes from a non browser client (curl, scripts) that carries no
 * victim cookies, and is allowed.
 */
export function isSameOriginRequest(req: NextRequest): boolean {
	const fetchSite = req.headers.get('sec-fetch-site');
	if (fetchSite) return fetchSite === 'same-origin' || fetchSite === 'none';

	const origin = req.headers.get('origin');
	if (!origin) return true;
	if (origin === 'null') return false;
	try {
		return allowedHosts(req).has(new URL(origin).host);
	} catch {
		return false;
	}
}

export const CROSS_SITE_ERROR = 'Cross site request rejected';
