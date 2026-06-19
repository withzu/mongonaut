'use client';

import { createContext, ReactNode, useContext, useEffect, useState, useTransition } from 'react';
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

interface DatabaseFetcherProps {
	children: ReactNode;
}

type ActionResult<T> =
	| { success: true; data: T; error?: undefined }
	| { success: false; error: Error; data?: undefined };

interface DbListData {
	databases: unknown[];
	totalSize: number;
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

export function DatabaseFetcher({ children }: DatabaseFetcherProps) {
	const [databases, setDatabases] = useState<Database[]>([]);
	const [totalSize, setTotalSize] = useState<number | undefined>(undefined);
	const [serverInfo, setServerInfo] = useState<Document | undefined>(undefined);
	const [viewer, setViewer] = useState<ViewerInfo | undefined>(undefined);
	const [error, setError] = useState<Error | undefined>(undefined);
	const [initialLoading, setInitialLoading] = useState(true);
	const [isPending, startTransition] = useTransition();

	const fetchAllData = async () => {
		try {
			const [databasesResult, dbListResult, serverInfoResult, viewerResult] = await Promise.all([
				collectSidebarDatabaseInformation(),
				listDatabases() as Promise<ActionResult<DbListData>>,
				getServerInfo(),
				getViewerInfo(),
			]);

			setViewer(viewerResult);

			if (databasesResult.success && databasesResult.data) {
				setDatabases(databasesResult.data);
			} else {
				setDatabases([]);
			}

			if (dbListResult.success && dbListResult.data) {
				setTotalSize(dbListResult.data.totalSize);
			} else {
				setTotalSize(undefined);
			}

			if (serverInfoResult.success && serverInfoResult.data !== undefined) {
				setServerInfo(serverInfoResult.data);
			} else {
				setServerInfo(undefined);
			}
		} catch (e) {
			setError(e instanceof Error ? e : new Error('Unknown error'));
		}
	};

	// Initial data fetch
	useEffect(() => {
		const fetchData = async () => {
			await fetchAllData();
			setInitialLoading(false);
		};
		void fetchData();
	}, []);

	const reloadData = async () => {
		startTransition(() => {
			fetchAllData();
		});
	};

	const isLoading = initialLoading || isPending;

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
				loading={isLoading}
			>
				{children}
			</DatabaseContent>
		</DatabaseFetcherContext.Provider>
	);
}
