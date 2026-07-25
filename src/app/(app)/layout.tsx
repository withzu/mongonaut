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
			<a
				href="#main-content"
				className="bg-background text-foreground focus:ring-ring sr-only z-100 rounded-md border px-3 py-2 text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:ring-2"
			>
				Skip to content
			</a>
			<DatabaseFetcher>{children}</DatabaseFetcher>
			<RecoveryGate />
		</SidebarProvider>
	);
}
