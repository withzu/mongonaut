import { notFound, redirect } from 'next/navigation';
import { getAuthConfig } from '@/lib/auth/config';
import { countAccounts } from '@/lib/auth/accounts';
import { SetupCard } from '@/app/setup/setup-card';

export default async function SetupPage() {
	const cfg = getAuthConfig();

	if (cfg.mode !== 'ACCOUNT') {
		notFound();
	}

	if (!cfg.secret) {
		redirect('/login');
	}

	if ((await countAccounts()) > 0) {
		redirect('/login');
	}

	return <SetupCard />;
}
