import { ReactNode } from 'react';
import type { Document } from 'mongodb';
import { ConnectionError } from '@/components/error/connection-error';
import { AppSidebar } from '@/components/custom/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';
import type { Database } from '@/lib/types/mongo';

interface DatabaseContentProps {
	databases: Database[];
	totalSize?: number;
	serverInfo?: Document;
	isAccountAdmin?: boolean;
	canCreateDatabase?: boolean;
	globalReadonly?: boolean;
	children: ReactNode;
	error?: Error;
	loading?: boolean;
}

export function DatabaseContent({
	databases,
	totalSize,
	serverInfo,
	isAccountAdmin = false,
	canCreateDatabase = false,
	globalReadonly = false,
	children,
	error,
	loading = false,
}: DatabaseContentProps) {
	if (error) {
		return <ConnectionError error={error} />;
	}

	return (
		<>
			<AppSidebar
				isAccountAdmin={isAccountAdmin}
				canCreateDatabase={canCreateDatabase}
				globalReadonly={globalReadonly}
				databases={databases}
				totalSize={totalSize}
				serverInfo={serverInfo}
				loading={loading}
			/>
			<SidebarInset>
				<div className="min-h-full w-full">{children}</div>
			</SidebarInset>
		</>
	);
}
