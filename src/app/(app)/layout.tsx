import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DatabaseFetcher, type ShellData } from '@/components/custom/database-fetcher';
import { RecoveryGate } from '@/components/custom/recovery-gate';
import {
	collectSidebarDatabaseInformation,
	getServerInfo,
	getViewerInfo,
	listDatabases,
} from '@/actions/databaseOperation';

interface AppLayoutProps {
	children: React.ReactNode;
}

export const dynamic = 'force-dynamic';

async function loadShellData(): Promise<ShellData> {
	try {
		const [databasesResult, dbListResult, serverInfoResult, viewer] = await Promise.all([
			collectSidebarDatabaseInformation(),
			listDatabases(),
			getServerInfo(),
			getViewerInfo(),
		]);

		if (!databasesResult.success) {
			return { databases: [], viewer, error: databasesResult.error };
		}

		return {
			databases: databasesResult.data,
			totalSize: dbListResult.success ? dbListResult.data.totalSize : undefined,
			serverInfo: serverInfoResult.success ? serverInfoResult.data : undefined,
			viewer,
		};
	} catch (error) {
		return {
			databases: [],
			error: error instanceof Error ? error.message : 'Unknown error',
		};
	}
}

export default async function AppLayout({ children }: Readonly<AppLayoutProps>) {
	const initial = await loadShellData();

	return (
		<SidebarProvider
			className="bg-sidebar"
			style={
				{
					'--sidebar-width': '350px',
				} as React.CSSProperties
			}
		>
			<a
				href="#main-content"
				className="bg-background text-foreground focus:ring-ring sr-only z-100 rounded-md border px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:ring-2"
			>
				Skip to content
			</a>
			<DatabaseFetcher initial={initial}>{children}</DatabaseFetcher>
			<RecoveryGate />
		</SidebarProvider>
	);
}
