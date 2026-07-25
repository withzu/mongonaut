import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuthConfig, getPublicAuthInfo } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
import { countAccounts } from '@/lib/auth/accounts';
import { LoginCard } from '@/app/login/login-card';
import { safeInternalPath } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

interface LoginPageProps {
	searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
	const cfg = getAuthConfig();
	const info = getPublicAuthInfo();
	const params = await searchParams;
	const next = safeInternalPath(params.next);

	if (cfg.mode === 'NONE') {
		redirect(next);
	}

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
