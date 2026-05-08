import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import { buildAuthorizationUrl } from '@/lib/auth/oidc';
import {
	isSecureRequest,
	OIDC_FLOW_COOKIE,
	randomToken,
	sha256Base64Url,
	signPayload,
} from '@/lib/auth/session';

export const runtime = 'nodejs';

interface OidcFlowState {
	state: string;
	nonce: string;
	codeVerifier: string;
	redirectUri: string;
	next: string;
	exp: number;
}

function safeNext(value: string | null | undefined): string {
	if (!value) return '/';
	if (!value.startsWith('/')) return '/';
	if (value.startsWith('//')) return '/';
	if (value.startsWith('/login')) return '/';
	return value;
}

function resolveRedirectUri(req: NextRequest, override: string | null): string {
	if (override) return override;
	const url = new URL('/api/auth/oidc/callback', req.url);
	return url.toString();
}

export async function GET(req: NextRequest) {
	const cfg = getAuthConfig();
	if (cfg.mode !== 'OIDC' || !cfg.oidc || !cfg.secret) {
		return NextResponse.redirect(new URL('/login', req.url));
	}

	const url = new URL(req.url);
	const next = safeNext(url.searchParams.get('next'));

	const state = randomToken(24);
	const nonce = randomToken(24);
	const codeVerifier = randomToken(48);
	const codeChallenge = await sha256Base64Url(codeVerifier);
	const redirectUri = resolveRedirectUri(req, cfg.oidc.redirectUrl);

	const authorizationUrl = await buildAuthorizationUrl(cfg.oidc, redirectUri, {
		state,
		nonce,
		codeChallenge,
	});

	const flow: OidcFlowState = {
		state,
		nonce,
		codeVerifier,
		redirectUri,
		next,
		exp: Math.floor(Date.now() / 1000) + 600,
	};
	const flowToken = await signPayload(cfg.secret, flow);

	const res = NextResponse.redirect(authorizationUrl);
	res.cookies.set(OIDC_FLOW_COOKIE, flowToken, {
		httpOnly: true,
		sameSite: 'lax',
		secure: isSecureRequest(req.url),
		path: '/',
		maxAge: 600,
	});
	return res;
}
