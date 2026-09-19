'use client';

import { Fragment, ReactNode, useId, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
	ChevronDownIcon,
	CopyIcon,
	DownloadIcon,
	EraserIcon,
	KeyRoundIcon,
	PencilIcon,
	SquareArrowOutUpRightIcon,
	Trash2Icon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	deleteAllDocuments,
	dropCollection,
	duplicateCollection,
	exportCollection,
	listIndexes,
	renameCollection,
	type DocumentQuery,
} from '@/actions/databaseOperation';
import { useDatabaseFetcher } from '@/components/custom/database-fetcher';
import { ConfirmNameDialog } from '@/components/custom/confirm-name-dialog';
import { IndexManagerDialog, type IndexRequest } from '@/components/custom/index-manager';

interface CollectionActionsOptions {
	database: string;
	collection: string;
	readOnly?: boolean;
	includeOpen?: boolean;
}

interface CollectionAction {
	key: string;
	label: string;
	icon: ReactNode;
	onSelect: () => void;
	destructive?: boolean;
	separatorBefore?: boolean;
}

type NameDialog = 'rename' | 'duplicate' | null;

function useCollectionActions({
	database,
	collection,
	readOnly,
	includeOpen = true,
}: CollectionActionsOptions): { actions: CollectionAction[]; dialogs: ReactNode } {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { reloadData } = useDatabaseFetcher();
	const nameInputId = useId();

	const [nameDialog, setNameDialog] = useState<NameDialog>(null);
	const [nameValue, setNameValue] = useState('');
	const [showDropDialog, setShowDropDialog] = useState(false);
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
	const [indexRequest, setIndexRequest] = useState<IndexRequest | null>(null);
	const [isBusy, setIsBusy] = useState(false);

	const requestIndexes = () => setIndexRequest(listIndexes(database, collection));

	const collectionPath = `/${database}/${collection}`;
	const isOnThisCollection = decodeURIComponent(pathname) === collectionPath;

	const refreshAfterChange = async (navigateTo?: string) => {
		await reloadData();
		if (navigateTo) {
			router.push(navigateTo);
		} else {
			router.refresh();
		}
	};

	const handleDownload = async () => {
		setIsBusy(true);
		try {
			// Only the collection actually on screen carries a query. The same menu
			// opens from the sidebar for other collections, where the current URL
			// parameters belong to a different collection entirely.
			const query: DocumentQuery = isOnThisCollection
				? {
						mode: searchParams.get('mode') as DocumentQuery['mode'],
						filter: searchParams.get('filter') ?? undefined,
						sort: searchParams.get('sort') ?? undefined,
						pipeline: searchParams.get('pipeline') ?? undefined,
					}
				: {};

			const result = await exportCollection(database, collection, query);
			if (!result.success) {
				toast.error(result.error);
				return;
			}
			const blob = new Blob([result.data.json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = result.data.filtered ? `${collection}-query.json` : `${collection}.json`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
			if (result.data.truncated) {
				toast.warning(
					`Exported the first ${result.data.limit} documents. Raise MONGONAUT_EXPORT_MAX_DOCUMENTS for more.`,
				);
			} else if (result.data.filtered) {
				toast.success(`${result.data.count} documents matching the current query downloaded`);
			} else {
				toast.success(`${result.data.count} documents downloaded`);
			}
		} catch (error) {
			console.error('Error downloading documents:', error);
			toast.error(error instanceof Error ? error.message : 'Error downloading documents');
		} finally {
			setIsBusy(false);
		}
	};

	const openNameDialog = (type: Exclude<NameDialog, null>) => {
		setNameValue(type === 'duplicate' ? `${collection}_copy` : collection);
		setNameDialog(type);
	};

	const handleNameSubmit = async () => {
		const newName = nameValue.trim();
		if (!newName || newName === collection) {
			setNameDialog(null);
			return;
		}
		setIsBusy(true);
		try {
			if (nameDialog === 'rename') {
				const result = await renameCollection(database, collection, newName);
				if (result.success) {
					toast.success(`Collection renamed to "${newName}"`);
					setNameDialog(null);
					await refreshAfterChange(isOnThisCollection ? `/${database}/${newName}` : undefined);
				} else {
					toast.error(result.error);
				}
			} else if (nameDialog === 'duplicate') {
				const result = await duplicateCollection(database, collection, newName);
				if (result.success) {
					toast.success(`Collection duplicated to "${newName}"`);
					setNameDialog(null);
					await refreshAfterChange();
				} else {
					toast.error(result.error);
				}
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setIsBusy(false);
		}
	};

	const handleDrop = async () => {
		setIsBusy(true);
		try {
			const result = await dropCollection(database, collection);
			if (result.success) {
				toast.success(`Collection "${collection}" dropped`);
				await refreshAfterChange(isOnThisCollection ? '/' : undefined);
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setIsBusy(false);
			setShowDropDialog(false);
		}
	};

	const handleDeleteAll = async () => {
		setIsBusy(true);
		try {
			const result = await deleteAllDocuments(database, collection);
			if (result.success) {
				toast.success(
					result.data.deletedCount > 0
						? `${result.data.deletedCount} documents deleted`
						: 'No documents to delete',
				);
				await refreshAfterChange();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error('Error deleting documents:', error);
			toast.error(error instanceof Error ? error.message : 'Error deleting documents');
		} finally {
			setIsBusy(false);
			setShowDeleteAllDialog(false);
		}
	};

	const actions: CollectionAction[] = [];

	if (includeOpen) {
		actions.push({
			key: 'open',
			label: 'Open',
			icon: <SquareArrowOutUpRightIcon />,
			onSelect: () => router.push(collectionPath),
		});
	}
	const hasActiveQuery =
		isOnThisCollection &&
		(!!searchParams.get('filter') || !!searchParams.get('sort') || !!searchParams.get('pipeline'));

	actions.push(
		{
			key: 'download',
			label: hasActiveQuery ? 'Download query result' : 'Download as JSON',
			icon: <DownloadIcon />,
			onSelect: handleDownload,
		},
		{
			key: 'indexes',
			label: 'Indexes…',
			icon: <KeyRoundIcon />,
			onSelect: requestIndexes,
		},
	);

	if (!readOnly) {
		actions.push(
			{
				key: 'rename',
				label: 'Rename…',
				icon: <PencilIcon />,
				onSelect: () => openNameDialog('rename'),
				separatorBefore: true,
			},
			{
				key: 'duplicate',
				label: 'Duplicate…',
				icon: <CopyIcon />,
				onSelect: () => openNameDialog('duplicate'),
			},
			{
				key: 'delete-all',
				label: 'Delete all documents',
				icon: <EraserIcon />,
				onSelect: () => setShowDeleteAllDialog(true),
				destructive: true,
				separatorBefore: true,
			},
			{
				key: 'drop',
				label: 'Drop collection',
				icon: <Trash2Icon />,
				onSelect: () => setShowDropDialog(true),
				destructive: true,
			},
		);
	}

	const dialogs = (
		<>
			<Dialog open={nameDialog !== null} onOpenChange={open => !open && setNameDialog(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{nameDialog === 'rename' ? 'Rename collection' : 'Duplicate collection'}
						</DialogTitle>
						<DialogDescription>
							{nameDialog === 'rename'
								? `Rename "${collection}" in "${database}".`
								: `Create a copy of "${collection}" (documents and indexes) in "${database}".`}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<label htmlFor={nameInputId} className="text-sm font-medium">
							{nameDialog === 'rename' ? 'New name' : 'Target collection name'}
						</label>
						<Input
							id={nameInputId}
							value={nameValue}
							onChange={e => setNameValue(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') {
									e.preventDefault();
									void handleNameSubmit();
								}
							}}
							autoFocus
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setNameDialog(null)}>
							Cancel
						</Button>
						<Button onClick={handleNameSubmit} disabled={isBusy}>
							{nameDialog === 'rename' ? 'Rename' : 'Duplicate'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ConfirmNameDialog
				open={showDeleteAllDialog}
				onOpenChange={setShowDeleteAllDialog}
				title="Delete all documents"
				description={
					<>
						This permanently deletes every document in &quot;{collection}&quot;. The collection and
						its indexes stay in place. This cannot be undone.
					</>
				}
				expectedName={collection}
				confirmLabel="Delete all"
				busy={isBusy}
				onConfirm={handleDeleteAll}
			/>

			<ConfirmNameDialog
				open={showDropDialog}
				onOpenChange={setShowDropDialog}
				title="Drop collection"
				description={
					<>
						This permanently deletes the collection &quot;{collection}&quot; with all of its
						documents and indexes. This cannot be undone.
					</>
				}
				expectedName={collection}
				confirmLabel="Drop collection"
				busy={isBusy}
				onConfirm={handleDrop}
			/>

			<IndexManagerDialog
				request={indexRequest}
				database={database}
				collection={collection}
				readOnly={readOnly}
				onClose={() => setIndexRequest(null)}
				onReload={requestIndexes}
			/>
		</>
	);

	return { actions, dialogs };
}

export function CollectionContextMenu({
	database,
	collection,
	readOnly,
	children,
}: {
	database: string;
	collection: string;
	readOnly?: boolean;
	children: ReactNode;
}) {
	const { actions, dialogs } = useCollectionActions({ database, collection, readOnly });

	return (
		<>
			<ContextMenu modal={false}>
				<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					{actions.map(action => (
						<Fragment key={action.key}>
							{action.separatorBefore && <ContextMenuSeparator />}
							<ContextMenuItem
								variant={action.destructive ? 'destructive' : 'default'}
								onSelect={action.onSelect}
							>
								{action.icon}
								{action.label}
							</ContextMenuItem>
						</Fragment>
					))}
				</ContextMenuContent>
			</ContextMenu>
			{dialogs}
		</>
	);
}

export function CollectionActionsMenu({
	database,
	collection,
	readOnly,
}: {
	database: string;
	collection: string;
	readOnly?: boolean;
}) {
	const { actions, dialogs } = useCollectionActions({
		database,
		collection,
		readOnly,
		includeOpen: false,
	});

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm">
						Actions
						<ChevronDownIcon size={14} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					{actions.map(action => (
						<Fragment key={action.key}>
							{action.separatorBefore && <DropdownMenuSeparator />}
							<DropdownMenuItem
								variant={action.destructive ? 'destructive' : 'default'}
								onSelect={action.onSelect}
							>
								{action.icon}
								{action.label}
							</DropdownMenuItem>
						</Fragment>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
			{dialogs}
		</>
	);
}
