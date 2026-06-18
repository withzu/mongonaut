import { ReactNode } from 'react';
import type { Document } from 'mongodb';
import { ConnectionError } from '@/components/error/connection-error';
import { AppSidebar } from '@/components/custom/app-sidebar';
import { envBool } from '@/lib/env';
import { SidebarInset } from '@/components/ui/sidebar';
import type { Database } from '@/lib/types/mongo';

interface DatabaseContentProps {
	databases: Database[];
	totalSize?: number;
	serverInfo?: Document;
	children: ReactNode;
	error?: Error;
	loading?: boolean;
}

export function DatabaseContent({
	databases,
	totalSize,
	serverInfo,
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
				readOnly={envBool('MONGONAUT_READONLY', false)}
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
