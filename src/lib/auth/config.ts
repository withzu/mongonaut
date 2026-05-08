import { env, envInt } from '@/lib/env';

export type AuthMode = 'NONE' | 'STATIC_PASSWORD' | 'OIDC';

export interface OidcConfig {
	issuer: string;
	clientId: string;
	clientSecret: string;
	scopes: string;
	allowedEmails: string[] | null;
	redirectUrl: string | null;
}

export interface AuthConfig {
	mode: AuthMode;
	secret: string | null;
	sessionTtlSeconds: number;
	staticPassword: string | null;
	oidc: OidcConfig | null;
}

const VALID_MODES: AuthMode[] = ['NONE', 'STATIC_PASSWORD', 'OIDC'];

function readMode(): AuthMode {
	const raw = env('MONGONAUT_AUTH_MODE', 'NONE').trim().toUpperCase();
	if ((VALID_MODES as string[]).includes(raw)) {
		return raw as AuthMode;
	}
	console.warn(`[auth] unknown MONGONAUT_AUTH_MODE "${raw}", falling back to NONE`);
	return 'NONE';
}

function readOidc(): OidcConfig | null {
	const issuer = env('MONGONAUT_OIDC_ISSUER', '').trim().replace(/\/$/, '');
	const clientId = env('MONGONAUT_OIDC_CLIENT_ID', '').trim();
	const clientSecret = env('MONGONAUT_OIDC_CLIENT_SECRET', '').trim();
	if (!issuer || !clientId || !clientSecret) {
		return null;
	}
	const scopes = env('MONGONAUT_OIDC_SCOPES', 'openid profile email').trim();
	const allowedRaw = env('MONGONAUT_OIDC_ALLOWED_EMAILS', '').trim();
	const allowedEmails = allowedRaw
		? allowedRaw
				.split(',')
				.map(e => e.trim().toLowerCase())
				.filter(Boolean)
		: null;
	const redirectUrl = env('MONGONAUT_OIDC_REDIRECT_URL', '').trim() || null;
	return { issuer, clientId, clientSecret, scopes, allowedEmails, redirectUrl };
}

let cached: AuthConfig | null = null;

export function getAuthConfig(): AuthConfig {
	if (cached) return cached;
	const mode = readMode();
	const secret = env('MONGONAUT_AUTH_SECRET', '').trim() || null;
	const sessionTtlSeconds = envInt('MONGONAUT_SESSION_TTL', 60 * 60 * 24);
	const staticPassword = env('MONGONAUT_AUTH_PASSWORD', '').trim() || null;
	const oidc = mode === 'OIDC' ? readOidc() : null;

	if (mode !== 'NONE' && !secret) {
		console.error(
			'[auth] MONGONAUT_AUTH_SECRET must be set when MONGONAUT_AUTH_MODE is not NONE. Auth is disabled until configured.',
		);
	}
	if (mode === 'STATIC_PASSWORD' && !staticPassword) {
		console.error(
			'[auth] MONGONAUT_AUTH_PASSWORD must be set when MONGONAUT_AUTH_MODE=STATIC_PASSWORD.',
		);
	}
	if (mode === 'OIDC' && !oidc) {
		console.error(
			'[auth] MONGONAUT_OIDC_ISSUER, MONGONAUT_OIDC_CLIENT_ID and MONGONAUT_OIDC_CLIENT_SECRET must all be set when MONGONAUT_AUTH_MODE=OIDC.',
		);
	}

	cached = { mode, secret, sessionTtlSeconds, staticPassword, oidc };
	return cached;
}

export function isAuthEnabled(): boolean {
	const cfg = getAuthConfig();
	return cfg.mode !== 'NONE' && !!cfg.secret;
}

export interface PublicAuthInfo {
	mode: AuthMode;
	enabled: boolean;
	misconfigured: boolean;
}

export function getPublicAuthInfo(): PublicAuthInfo {
	const cfg = getAuthConfig();
	const enabled = isAuthEnabled();
	const misconfigured =
		cfg.mode !== 'NONE' &&
		(!cfg.secret ||
			(cfg.mode === 'STATIC_PASSWORD' && !cfg.staticPassword) ||
			(cfg.mode === 'OIDC' && !cfg.oidc));
	return { mode: cfg.mode, enabled, misconfigured };
}
