'use client';

import { createContext, ReactNode, useContext, useState, useTransition } from 'react';
import { Document } from 'mongodb';
import {
	collectSidebarDatabaseInformation,
	getServerInfo,
	getViewerInfo,
	listDatabases,
} from '@/actions/databaseOperation';
import { DatabaseContent } from '@/components/custom/database-content';
import { Database } from '@/lib/types/mongo';

interface ViewerInfo {
	isAccountAdmin: boolean;
	canCreateDatabase: boolean;
	globalReadonly: boolean;
}

export interface ShellData {
	databases: Database[];
	totalSize?: number;
	serverInfo?: Document;
	viewer?: ViewerInfo;
	error?: string;
}

interface DatabaseFetcherProps {
	initial: ShellData;
	children: ReactNode;
}

interface DatabaseFetcherContextType {
	reloadData: () => Promise<void>;
}

const DatabaseFetcherContext = createContext<DatabaseFetcherContextType | null>(null);

export function useDatabaseFetcher() {
	const context = useContext(DatabaseFetcherContext);
	if (!context) {
		throw new Error('useDatabaseFetcher must be used within a DatabaseFetcherProvider');
	}
	return context;
}

export function DatabaseFetcher({ initial, children }: DatabaseFetcherProps) {
	const [databases, setDatabases] = useState<Database[]>(initial.databases);
	const [totalSize, setTotalSize] = useState<number | undefined>(initial.totalSize);
	const [serverInfo, setServerInfo] = useState<Document | undefined>(initial.serverInfo);
	const [viewer, setViewer] = useState<ViewerInfo | undefined>(initial.viewer);
	const [error, setError] = useState<string | undefined>(initial.error);
	const [isPending, startTransition] = useTransition();

	const fetchAllData = async () => {
		try {
			const [databasesResult, dbListResult, serverInfoResult, viewerResult] = await Promise.all([
				collectSidebarDatabaseInformation(),
				listDatabases(),
				getServerInfo(),
				getViewerInfo(),
			]);

			setViewer(viewerResult);

			if (!databasesResult.success) {
				setDatabases([]);
				setTotalSize(undefined);
				setServerInfo(undefined);
				setError(databasesResult.error);
				return;
			}

			setError(undefined);
			setDatabases(databasesResult.data);
			setTotalSize(dbListResult.success ? dbListResult.data.totalSize : undefined);
			setServerInfo(serverInfoResult.success ? serverInfoResult.data : undefined);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Unknown error');
		}
	};

	const reloadData = async () => {
		startTransition(() => {
			void fetchAllData();
		});
	};

	return (
		<DatabaseFetcherContext.Provider value={{ reloadData }}>
			<DatabaseContent
				databases={databases}
				totalSize={totalSize}
				serverInfo={serverInfo}
				isAccountAdmin={viewer?.isAccountAdmin ?? false}
				canCreateDatabase={viewer?.canCreateDatabase ?? false}
				globalReadonly={viewer?.globalReadonly ?? false}
				error={error}
				loading={isPending}
			>
				{children}
			</DatabaseContent>
		</DatabaseFetcherContext.Provider>
	);
}
