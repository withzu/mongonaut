import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuthConfig, getPublicAuthInfo } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { countAccounts } from '@/lib/auth/accounts';
import { LoginCard } from '@/app/login/login-card';

interface LoginPageProps {
	searchParams: Promise<{ next?: string; error?: string }>;
}

function safeNext(value: string | undefined): string {
	if (!value) return '/';
	if (!value.startsWith('/')) return '/';
	if (value.startsWith('//')) return '/';
	if (value.startsWith('/login')) return '/';
	return value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const cfg = getAuthConfig();
	const info = getPublicAuthInfo();
	const params = await searchParams;
	const next = safeNext(params.next);

	if (cfg.mode === 'NONE') {
		redirect(next);
	}

	// In ACCOUNT mode with no accounts yet, send the operator to the one-time setup.
	if (cfg.mode === 'ACCOUNT' && cfg.secret && (await countAccounts()) === 0) {
		redirect('/setup');
	}

	if (cfg.secret) {
		const cookieStore = await cookies();
		const existing = cookieStore.get(SESSION_COOKIE)?.value;
		const session = await readSessionToken(cfg.secret, existing);
		if (session) {
			redirect(next);
		}
	}

	return (
		<LoginCard
			mode={info.mode}
			misconfigured={info.misconfigured}
			next={next}
			error={params.error}
		/>
	);
}
