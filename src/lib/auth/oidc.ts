import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';
import { OidcConfig } from '@/lib/auth/config';

interface DiscoveryDocument {
	authorization_endpoint: string;
	token_endpoint: string;
	jwks_uri: string;
	issuer: string;
	end_session_endpoint?: string;
}

const discoveryCache = new Map<string, { doc: DiscoveryDocument; fetchedAt: number }>();
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
const DISCOVERY_TTL_MS = 5 * 60 * 1000;

export async function getDiscovery(issuer: string): Promise<DiscoveryDocument> {
	const cached = discoveryCache.get(issuer);
	if (cached && Date.now() - cached.fetchedAt < DISCOVERY_TTL_MS) {
		return cached.doc;
	}
	const url = `${issuer}/.well-known/openid-configuration`;
	const res = await fetch(url, { cache: 'no-store' });
	if (!res.ok) {
		throw new Error(`OIDC discovery failed (${res.status}) at ${url}`);
	}
	const doc = (await res.json()) as DiscoveryDocument;
	if (!doc.authorization_endpoint || !doc.token_endpoint || !doc.jwks_uri) {
		throw new Error('OIDC discovery document is missing required fields');
	}
	discoveryCache.set(issuer, { doc, fetchedAt: Date.now() });
	return doc;
}

function getJwks(jwksUri: string) {
	let set = jwksCache.get(jwksUri);
	if (!set) {
		set = createRemoteJWKSet(new URL(jwksUri));
		jwksCache.set(jwksUri, set);
	}
	return set;
}

export interface AuthorizationRequest {
	url: string;
	state: string;
	nonce: string;
	codeVerifier: string;
}

export async function buildAuthorizationUrl(
	cfg: OidcConfig,
	redirectUri: string,
	pkce: { state: string; nonce: string; codeChallenge: string },
): Promise<string> {
	const disc = await getDiscovery(cfg.issuer);
	const url = new URL(disc.authorization_endpoint);
	url.searchParams.set('response_type', 'code');
	url.searchParams.set('client_id', cfg.clientId);
	url.searchParams.set('redirect_uri', redirectUri);
	url.searchParams.set('scope', cfg.scopes);
	url.searchParams.set('state', pkce.state);
	url.searchParams.set('nonce', pkce.nonce);
	url.searchParams.set('code_challenge', pkce.codeChallenge);
	url.searchParams.set('code_challenge_method', 'S256');
	return url.toString();
}

export interface TokenResponse {
	access_token?: string;
	id_token: string;
	token_type: string;
	expires_in?: number;
	refresh_token?: string;
}

export async function exchangeCodeForTokens(
	cfg: OidcConfig,
	code: string,
	redirectUri: string,
	codeVerifier: string,
): Promise<TokenResponse> {
	const disc = await getDiscovery(cfg.issuer);
	const body = new URLSearchParams();
	body.set('grant_type', 'authorization_code');
	body.set('code', code);
	body.set('redirect_uri', redirectUri);
	body.set('client_id', cfg.clientId);
	body.set('code_verifier', codeVerifier);

	const basicAuth = btoa(
		`${encodeURIComponent(cfg.clientId)}:${encodeURIComponent(cfg.clientSecret)}`,
	);

	const res = await fetch(disc.token_endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Accept': 'application/json',
			'Authorization': `Basic ${basicAuth}`,
		},
		body: body.toString(),
		cache: 'no-store',
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Token exchange failed (${res.status}): ${text.slice(0, 500)}`);
	}
	const json = (await res.json()) as TokenResponse;
	if (!json.id_token) {
		throw new Error('Token response did not include an id_token');
	}
	return json;
}

export interface VerifiedIdToken extends JWTPayload {
	sub: string;
	email?: string;
	email_verified?: boolean;
	name?: string;
	preferred_username?: string;
	nonce?: string;
}

export async function verifyIdToken(
	cfg: OidcConfig,
	idToken: string,
	expectedNonce: string,
): Promise<VerifiedIdToken> {
	const disc = await getDiscovery(cfg.issuer);
	const jwks = getJwks(disc.jwks_uri);
	const { payload } = await jwtVerify(idToken, jwks, {
		issuer: disc.issuer,
		audience: cfg.clientId,
	});
	if (!payload.sub) {
		throw new Error('id_token is missing sub claim');
	}
	if (payload.nonce !== expectedNonce) {
		throw new Error('id_token nonce mismatch');
	}
	return payload as VerifiedIdToken;
}

export function isEmailAllowed(cfg: OidcConfig, email: string | undefined): boolean {
	if (!cfg.allowedEmails || cfg.allowedEmails.length === 0) return true;
	if (!email) return false;
	return cfg.allowedEmails.includes(email.toLowerCase());
}
