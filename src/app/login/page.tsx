import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getAuthConfig, getPublicAuthInfo } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE } from '@/lib/auth/session';
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
