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

// Route handlers lack the server action origin check, and SameSite=Lax does not stop login CSRF.
// Requests without Sec-Fetch-Site and Origin come from non browser clients and are allowed.
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
