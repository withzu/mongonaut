import { FC } from 'react';
import { BoxIcon, DatabaseIcon, FilterXIcon, HardDriveIcon, TableIcon } from 'lucide-react';
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
	getDatabaseCollectionContent,
	getDatabaseCollectionStats,
	isDatabaseCollectionExisting,
	searchInCollection,
} from '@/actions/databaseOperation';
import { envBool } from '@/lib/env';
import { DocumentView } from '@/components/custom/document-view';
import Searchbar from '@/components/custom/searchbar';
import { PaginationControls } from '@/components/custom/pagination-controls';
import { AddDocumentButton } from '@/components/custom/add-document-button';
import type { Document, WithId } from 'mongodb';
import { CollectionBulkActions } from '@/components/custom/collection-bulk-actions';

type Props = {
	params: Promise<{
		database: string;
		collection: string;
	}>;
	searchParams?: Promise<{
		[key: string]: string | undefined;
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

	let content;
	if (query?.key && query?.value) {
		content = await searchInCollection(
			database,
			collection,
			query.key,
			query.value,
			currentPage,
			pageSize,
		);
	} else {
		content = await getDatabaseCollectionContent(database, collection, currentPage, pageSize);
	}

	return (
		<AppContainer>
			<div className="hidden md:block">
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

						{!isReadonly && <CollectionBulkActions />}
					</div>
				)}

				<Searchbar defaultKey={query?.key} defaultValue={query?.value} />

				{!isReadonly && <AddDocumentButton />}

				{(content?.documents?.length || 0) > 0 ? (
					(content?.documents as WithId<Document>[]).map(doc => {
						const rawId = doc._id as unknown;
						const documentId =
							rawId && typeof rawId === 'object' && '$oid' in (rawId as Record<string, unknown>)
								? String((rawId as { $oid: unknown }).$oid)
								: String(rawId);

						return (
							<DocumentView key={documentId} data={JSON.stringify(doc)} isReadonly={isReadonly} />
						);
					})
				) : (
					<div className="flex flex-col items-center justify-center py-10 text-center border rounded-lg">
						<FilterXIcon className="w-12 h-12 mb-3 text-muted-foreground" />
						<h3 className="mb-1 font-medium">No results found</h3>
						<p className="text-sm text-muted-foreground">
							{query?.key && query?.value
								? `No documents found for ${query.key}: ${query.value}`
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
