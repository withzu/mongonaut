import { NextRequest, NextResponse } from 'next/server';
import { getAuthConfig } from '@/lib/auth/config';
import { exchangeCodeForTokens, isEmailAllowed, verifyIdToken } from '@/lib/auth/oidc';
import {
	buildSessionCookieAttributes,
	createSessionToken,
	isSecureRequest,
	OIDC_FLOW_COOKIE,
	SESSION_COOKIE,
	verifyPayload,
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

function loginErrorRedirect(req: NextRequest, code: string): NextResponse {
	const url = new URL('/login', req.url);
	url.searchParams.set('error', code);
	const res = NextResponse.redirect(url);
	res.cookies.set(OIDC_FLOW_COOKIE, '', { path: '/', maxAge: 0 });
	return res;
}

export async function GET(req: NextRequest) {
	const cfg = getAuthConfig();
	if (cfg.mode !== 'OIDC' || !cfg.oidc || !cfg.secret) {
		return loginErrorRedirect(req, 'oidc_disabled');
	}

	const url = new URL(req.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const providerError = url.searchParams.get('error');

	if (providerError) {
		console.error('[auth] OIDC provider returned error:', providerError);
		return loginErrorRedirect(req, 'provider_error');
	}
	if (!code || !state) {
		return loginErrorRedirect(req, 'invalid_callback');
	}

	const flowToken = req.cookies.get(OIDC_FLOW_COOKIE)?.value;
	const flow = await verifyPayload<OidcFlowState>(cfg.secret, flowToken || '');
	if (!flow) {
		return loginErrorRedirect(req, 'state_missing');
	}
	if (flow.exp * 1000 < Date.now()) {
		return loginErrorRedirect(req, 'state_expired');
	}
	if (flow.state !== state) {
		return loginErrorRedirect(req, 'state_mismatch');
	}

	let tokens;
	try {
		tokens = await exchangeCodeForTokens(cfg.oidc, code, flow.redirectUri, flow.codeVerifier);
	} catch (err) {
		console.error('[auth] OIDC token exchange failed:', err);
		return loginErrorRedirect(req, 'token_exchange_failed');
	}

	let claims;
	try {
		claims = await verifyIdToken(cfg.oidc, tokens.id_token, flow.nonce);
	} catch (err) {
		console.error('[auth] OIDC id_token verification failed:', err);
		return loginErrorRedirect(req, 'token_verification_failed');
	}

	if (!isEmailAllowed(cfg.oidc, claims.email)) {
		return loginErrorRedirect(req, 'email_not_allowed');
	}

	const subject = claims.sub;
	const { token } = await createSessionToken(cfg.secret, 'OIDC', subject, cfg.sessionTtlSeconds, {
		email: claims.email,
		name: claims.name || claims.preferred_username,
	});

	const next =
		flow.next && flow.next.startsWith('/') && !flow.next.startsWith('//') ? flow.next : '/';
	const target = new URL(next, req.url);

	const res = NextResponse.redirect(target);
	res.cookies.set(SESSION_COOKIE, token, {
		...buildSessionCookieAttributes({
			ttlSeconds: cfg.sessionTtlSeconds,
			secure: isSecureRequest(req.url),
		}),
	});
	res.cookies.set(OIDC_FLOW_COOKIE, '', { path: '/', maxAge: 0 });
	return res;
}
