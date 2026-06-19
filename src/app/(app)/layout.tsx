import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DatabaseFetcher } from '@/components/custom/database-fetcher';
import { RecoveryGate } from '@/components/custom/recovery-gate';

interface AppLayoutProps {
	children: React.ReactNode;
}

export default async function AppLayout({ children }: Readonly<AppLayoutProps>) {
	return (
		<SidebarProvider
			className="bg-sidebar"
			style={
				{
					'--sidebar-width': '350px',
				} as React.CSSProperties
			}
		>
			<DatabaseFetcher>{children}</DatabaseFetcher>
			<RecoveryGate />
		</SidebarProvider>
	);
}
