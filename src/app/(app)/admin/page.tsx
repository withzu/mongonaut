import { notFound } from 'next/navigation';
import { getAuthConfig } from '@/lib/auth/config';
import { getCurrentAccount } from '@/lib/auth/server';
import { listAccounts, toPublicAccount } from '@/lib/auth/accounts';
import { collectSidebarDatabaseInformation } from '@/actions/databaseOperation';
import { AppContainer } from '@/components/custom/app-container';
import { AccountManager, type Namespace } from '@/components/custom/account-manager';

export default async function AdminPage() {
	const cfg = getAuthConfig();
	const account = await getCurrentAccount();

	if (cfg.mode !== 'ACCOUNT' || !account?.isAdmin) {
		notFound();
	}

	const accounts = (await listAccounts()).map(toPublicAccount);

	const namespacesResult = await collectSidebarDatabaseInformation();
	const namespaces: Namespace[] =
		namespacesResult.success && namespacesResult.data
			? namespacesResult.data.map(db => ({
					database: db.name,
					collections: db.collections.map(col => col.name),
				}))
			: [];

	return (
		<AppContainer>
			<AccountManager
				initialAccounts={accounts}
				currentAccountId={account._id.toString()}
				authMode={cfg.mode}
				namespaces={namespaces}
			/>
		</AppContainer>
	);
}
