'use client';

import { Fragment, ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
	ChevronDownIcon,
	CopyIcon,
	DownloadIcon,
	EraserIcon,
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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	deleteAllDocuments,
	dropCollection,
	duplicateCollection,
	getDatabaseCollectionAllDocumentsJson,
	renameCollection,
} from '@/actions/databaseOperation';
import { useDatabaseFetcher } from '@/components/custom/database-fetcher';

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
	const { reloadData } = useDatabaseFetcher();

	const [nameDialog, setNameDialog] = useState<NameDialog>(null);
	const [nameValue, setNameValue] = useState('');
	const [showDropDialog, setShowDropDialog] = useState(false);
	const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
	const [isBusy, setIsBusy] = useState(false);

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
			const result = await getDatabaseCollectionAllDocumentsJson(database, collection);
			if (!result.success) {
				throw result.error || new Error('Failed to fetch documents');
			}
			const blob = new Blob([result.json], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${collection}.json`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
			toast.success('Documents downloaded');
		} catch (error) {
			console.error('Error downloading documents:', error);
			toast.error('Error downloading documents');
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
					await refreshAfterChange(isOnThisCollection ? `/${database}/${newName}` : undefined);
				} else {
					toast.error(String(result.error) || 'Failed to rename collection');
				}
			} else if (nameDialog === 'duplicate') {
				const result = await duplicateCollection(database, collection, newName);
				if (result.success) {
					toast.success(`Collection duplicated to "${newName}"`);
					await refreshAfterChange();
				} else {
					toast.error(String(result.error) || 'Failed to duplicate collection');
				}
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setIsBusy(false);
			setNameDialog(null);
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
				toast.error(String(result.error) || 'Failed to drop collection');
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
					result.deletedCount > 0
						? `${result.deletedCount} documents deleted`
						: 'No documents to delete',
				);
				await refreshAfterChange();
			} else {
				throw result.error || new Error('Failed to delete documents');
			}
		} catch (error) {
			console.error('Error deleting documents:', error);
			toast.error('Error deleting documents');
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
	actions.push({
		key: 'download',
		label: 'Download as JSON',
		icon: <DownloadIcon />,
		onSelect: handleDownload,
	});

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
						<label htmlFor="collectionNewName" className="text-sm font-medium">
							{nameDialog === 'rename' ? 'New name' : 'Target collection name'}
						</label>
						<Input
							id="collectionNewName"
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

			<AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete all documents</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete every document in &quot;{collection}&quot;. This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteAll} disabled={isBusy}>
							Delete all
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={showDropDialog} onOpenChange={setShowDropDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Drop collection</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete the collection &quot;{collection}&quot; and all of its
							documents and indexes. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDrop} disabled={isBusy}>
							Drop collection
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
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
