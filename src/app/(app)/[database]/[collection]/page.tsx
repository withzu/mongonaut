import { FC } from 'react';
import { BoxIcon, DatabaseIcon, FilterXIcon, HardDriveIcon, TableIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Banner } from '@/components/ui/banner';
import { AppContainer } from '@/components/custom/app-container';
import {
	collectionExists,
	getCollectionStats,
	loadDocuments,
	type DocumentPage,
} from '@/actions/databaseOperation';
import { getResourcePermissions } from '@/lib/auth/server';
import { DocumentView } from '@/components/custom/document-view';
import { QueryPanel } from '@/components/custom/query-panel';
import { CollectionActionsMenu } from '@/components/custom/collection-actions';
import { PaginationControls } from '@/components/custom/pagination-controls';
import { DocumentShortcuts } from '@/components/custom/document-shortcuts';
import { AddDocumentButton } from '@/components/custom/add-document-button';
import { formatBytes, formatCount } from '@/lib/utils';

type Props = {
	params: Promise<{
		database: string;
		collection: string;
	}>;
	searchParams?: Promise<{
		[key: string]: string | undefined;
		mode?: string;
		filter?: string;
		sort?: string;
		pipeline?: string;
		page?: string;
		pageSize?: string;
	}>;
};

const CollectionDetailPage: FC<Props> = async ({ params, searchParams }) => {
	const { database, collection } = await params;
	const query = await searchParams;

	const { canRead, canWrite } = await getResourcePermissions(database, collection);
	if (!canRead) {
		notFound();
	}

	if (!(await collectionExists(database, collection))) {
		notFound();
	}

	const isReadonly = !canWrite;
	const statsResult = await getCollectionStats(database, collection);
	const stats = statsResult.success ? statsResult.data : null;

	const mode =
		query?.mode === 'aggregate' && query?.pipeline
			? 'aggregate'
			: query?.mode === 'find' || query?.filter || query?.sort
				? 'find'
				: 'browse';

	const result = await loadDocuments({
		database,
		collection,
		mode,
		filter: query?.filter,
		sort: query?.sort,
		pipeline: query?.pipeline,
		page: query?.page,
		pageSize: query?.pageSize,
	});

	const content: DocumentPage | null = result.success ? result.data : null;
	const queryError = result.success ? undefined : result.error;

	return (
		<AppContainer>
			<DocumentShortcuts />
			<div className="hidden min-h-(--mgn-height-control-slim) items-center justify-between gap-2 md:flex">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-1.5">
								<DatabaseIcon size={16} className="text-muted-foreground my-auto" />
								{database}
							</BreadcrumbPage>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-2">
								<TableIcon size={16} className="text-muted-foreground my-auto" />
								{collection}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<CollectionActionsMenu database={database} collection={collection} readOnly={isReadonly} />
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				{stats && (
					<div className="bg-chrome flex w-full flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2 text-sm">
						<div className="flex items-center gap-2">
							<DatabaseIcon size={16} className="text-muted-foreground" />
							<span className="text-muted-foreground">Documents:</span>
							<span className="font-semibold tabular-nums">{formatCount(stats.count)}</span>
						</div>

						<div className="flex items-center gap-2">
							<HardDriveIcon size={16} className="text-muted-foreground" />
							<span className="text-muted-foreground">Size:</span>
							<span className="font-semibold tabular-nums">{formatBytes(stats.size)}</span>
						</div>

						{stats.avgObjSize > 0 && (
							<div className="flex items-center gap-2">
								<BoxIcon size={16} className="text-muted-foreground" />
								<span className="text-muted-foreground">Avg. Size:</span>
								<span className="font-semibold tabular-nums">{formatBytes(stats.avgObjSize)}</span>
							</div>
						)}

						<div className="ml-auto md:hidden">
							<CollectionActionsMenu
								database={database}
								collection={collection}
								readOnly={isReadonly}
							/>
						</div>
					</div>
				)}

				<QueryPanel
					database={database}
					collection={collection}
					defaultMode={mode === 'aggregate' ? 'aggregate' : 'find'}
					defaultFilter={query?.filter}
					defaultSort={query?.sort}
					defaultPipeline={query?.pipeline}
				/>

				{!isReadonly && <AddDocumentButton database={database} collection={collection} />}

				{queryError ? (
					<Banner variant="error">
						<p className="font-semibold">Query failed</p>
						<p>{queryError}</p>
					</Banner>
				) : (content?.documents.length || 0) > 0 ? (
					content!.documents.map((entry, index) => (
						<DocumentView
							key={entry.idJson ?? `result-${index}`}
							data={entry.json}
							documentIdJson={entry.idJson}
							revision={entry.revision}
							database={database}
							collection={collection}
							isReadonly={isReadonly}
						/>
					))
				) : (
					<div className="flex flex-col items-center justify-center rounded-lg border py-10 text-center">
						<FilterXIcon className="text-muted-foreground mb-3 size-8" />
						<h3 className="mb-1 font-semibold">No results found</h3>
						<p className="text-sm text-muted-foreground">
							{mode === 'aggregate'
								? 'The aggregation pipeline returned no documents'
								: mode === 'find'
									? 'No documents match this query'
									: 'This collection contains no documents'}
						</p>
					</div>
				)}

				{content && (
					<PaginationControls
						currentPage={content.page}
						pageSize={content.pageSize}
						total={content.total}
						totalPages={content.totalPages}
						hasMore={content.hasMore}
						shownCount={content.documents.length}
						query={query}
					/>
				)}
			</div>
		</AppContainer>
	);
};

export default CollectionDetailPage;
