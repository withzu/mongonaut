import type { AuthMode } from '@/lib/auth/config';

export interface AuthMeResponse {
	mode: AuthMode;
	enabled: boolean;
	authenticated: boolean;
	mustChangePassword?: boolean;
	user: { subject: string; mode: AuthMode; email: string | null; name: string | null } | null;
}

let pending: Promise<AuthMeResponse | null> | null = null;

export function fetchAuthMe(): Promise<AuthMeResponse | null> {
	pending ??= fetch('/api/auth/me', { cache: 'no-store' })
		.then(response => (response.ok ? (response.json() as Promise<AuthMeResponse>) : null))
		.catch(() => null);

	return pending;
}

export function invalidateAuthMe(): void {
	pending = null;
}
