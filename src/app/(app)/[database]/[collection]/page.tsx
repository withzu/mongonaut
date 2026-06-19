import { FC } from 'react';
import {
	BoxIcon,
	DatabaseIcon,
	FilterXIcon,
	HardDriveIcon,
	TableIcon,
	TriangleAlertIcon,
} from 'lucide-react';
import prettyBytes from 'next/dist/lib/pretty-bytes';
import { notFound } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AppContainer } from '@/components/custom/app-container';
import {
	aggregateInCollection,
	findInCollection,
	getDatabaseCollectionContent,
	getDatabaseCollectionStats,
	isDatabaseCollectionExisting,
} from '@/actions/databaseOperation';
import { envBool } from '@/lib/env';
import { DocumentView } from '@/components/custom/document-view';
import { QueryPanel } from '@/components/custom/query-panel';
import { CollectionActionsMenu } from '@/components/custom/collection-actions';
import { PaginationControls } from '@/components/custom/pagination-controls';
import { AddDocumentButton } from '@/components/custom/add-document-button';
import type { Document, WithId } from 'mongodb';

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

	const currentPage = query?.page ? parseInt(query.page) : 1;
	const pageSize = query?.pageSize ? parseInt(query.pageSize) : 20;

	if (!(await isDatabaseCollectionExisting(database, collection))) {
		notFound();
	}

	const isReadonly = envBool('MONGONAUT_READONLY', false);
	const stats = await getDatabaseCollectionStats(database, collection);

	const isAggregate = query?.mode === 'aggregate' && !!query?.pipeline;
	const isFind = query?.mode === 'find' || !!query?.filter || !!query?.sort;

	let content;
	let queryError: string | undefined;
	if (isAggregate) {
		const result = await aggregateInCollection(
			database,
			collection,
			query!.pipeline!,
			currentPage,
			pageSize,
		);
		content = result;
		if (!result.success) queryError = result.error?.message;
	} else if (isFind) {
		const result = await findInCollection(
			database,
			collection,
			query?.filter || '',
			query?.sort || '',
			currentPage,
			pageSize,
		);
		content = result;
		if (!result.success) queryError = result.error?.message;
	} else {
		content = await getDatabaseCollectionContent(database, collection, currentPage, pageSize);
	}

	return (
		<AppContainer>
			<div className="hidden md:flex items-center justify-between gap-2">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-2">
								<DatabaseIcon size={12} className="text-muted-foreground my-auto" />
								{database}
							</BreadcrumbPage>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-2">
								<TableIcon size={12} className="text-muted-foreground my-auto" />
								{collection}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<CollectionActionsMenu database={database} collection={collection} readOnly={isReadonly} />
			</div>

			<div className="w-full h-full flex flex-col gap-4">
				{stats && (
					<div className="w-full flex flex-wrap items-center gap-6 px-4 py-3 bg-muted/30 rounded-lg text-sm">
						<div className="flex items-center gap-2">
							<DatabaseIcon size={14} className="text-primary" />
							<span className="text-muted-foreground">Documents:</span>
							<span className="font-medium">{stats.count}</span>
						</div>

						<div className="flex items-center gap-2">
							<HardDriveIcon size={14} className="text-primary" />
							<span className="text-muted-foreground">Size:</span>
							<span className="font-medium">{prettyBytes(stats.size)}</span>
						</div>

						{stats.avgObjSize && (
							<div className="flex items-center gap-2">
								<BoxIcon size={14} className="text-primary" />
								<span className="text-muted-foreground">Avg. Size:</span>
								<span className="font-medium">{prettyBytes(stats.avgObjSize)}</span>
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
					defaultMode={isAggregate ? 'aggregate' : 'find'}
					defaultFilter={query?.filter}
					defaultSort={query?.sort}
					defaultPipeline={query?.pipeline}
				/>

				{!isReadonly && <AddDocumentButton />}

				{queryError ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-10 text-center">
						<TriangleAlertIcon className="mb-3 h-12 w-12 text-destructive" />
						<h3 className="mb-1 font-medium">Query failed</h3>
						<p className="max-w-xl text-sm text-muted-foreground">{queryError}</p>
					</div>
				) : (content?.documents?.length || 0) > 0 ? (
					(content?.documents as WithId<Document>[]).map((doc, index) => {
						const rawId = doc._id as unknown;
						const documentId =
							rawId && typeof rawId === 'object' && '$oid' in (rawId as Record<string, unknown>)
								? String((rawId as { $oid: unknown }).$oid)
								: rawId != null
									? String(rawId)
									: `result-${index}`;

						return (
							<DocumentView key={documentId} data={JSON.stringify(doc)} isReadonly={isReadonly} />
						);
					})
				) : (
					<div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg">
						<FilterXIcon className="w-12 h-12 mb-3 text-muted-foreground" />
						<h3 className="mb-1 font-medium">No results found</h3>
						<p className="text-sm text-muted-foreground">
							{isAggregate
								? 'The aggregation pipeline returned no documents'
								: isFind
									? 'No documents match this query'
									: 'This collection contains no documents'}
						</p>
					</div>
				)}

				<PaginationControls
					currentPage={currentPage}
					totalPages={content?.pagination.totalPages || 0}
					pageSize={content?.pagination.pageSize || 0}
					total={content?.pagination.total || 0}
					query={query}
				/>
			</div>
		</AppContainer>
	);
};

export default CollectionDetailPage;
