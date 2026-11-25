'use client';

import { PencilIcon, TrashIcon } from 'lucide-react';
import { memo, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { JsonViewerProps } from 'json-edit-react';
import { Button } from '@/components/ui/button';
import { ClientJsonViewer } from '@/components/custom/client-json-editor';
import { DocumentEditorDialog } from '@/components/custom/document-editor-dialog';
import { ShortcutTooltip } from '@/components/custom/shortcut-tooltip';
import { useShortcut } from '@/hooks/use-shortcut';
import { preloadJsonEditor } from '@/components/custom/lazy-json-editor';
import { deleteDocument } from '@/actions/databaseOperation';
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

interface JsonDocument {
	[key: string]: unknown;
}

interface ReadonlyJsonViewerProps extends JsonViewerProps {
	className?: string;
	data: JsonDocument;
	collapse: number;
}

const MemoizedJsonViewer = memo<ReadonlyJsonViewerProps>(ClientJsonViewer);

export function DocumentView({
	data,
	documentIdJson,
	revision,
	database,
	collection,
	isReadonly,
}: {
	data: string;
	documentIdJson: string | null;
	revision: string;
	database: string;
	collection: string;
	isReadonly: boolean;
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const router = useRouter();
	const viewRef = useRef<HTMLDivElement>(null);

	const document = useMemo<JsonDocument>(() => JSON.parse(data), [data]);

	const isEditable = !isReadonly && documentIdJson !== null;

	const handleDelete = async () => {
		if (!documentIdJson || !isEditable) return;

		setIsDeleting(true);
		try {
			const result = await deleteDocument(database, collection, documentIdJson);

			if (result.success) {
				toast.success('Document deleted');
				router.refresh();
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			console.error('Error deleting document:', error);
			toast.error(error instanceof Error ? error.message : 'Error deleting document');
		} finally {
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const returnFocus = (event: Event) => {
		event.preventDefault();
		viewRef.current?.focus({ preventScroll: true });
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(data);
			toast.success('Document copied');
		} catch {
			toast.error('The browser did not allow copying. It needs a secure connection.');
		}
	};

	const isSelected = () => viewRef.current?.contains(window.document.activeElement) ?? false;

	useShortcut('copy-document', () => {
		if (!isSelected()) return false;
		void handleCopy();
	});
	useShortcut(
		'edit-document',
		() => {
			if (!isSelected()) return false;
			setShowEditor(true);
		},
		isEditable,
	);
	useShortcut(
		'delete-document',
		() => {
			if (!isSelected()) return false;
			setShowDeleteDialog(true);
		},
		isEditable,
	);

	return (
		<div
			data-document
			ref={viewRef}
			tabIndex={-1}
			className="focus:border-ring focus-row w-full scroll-my-2 overflow-hidden rounded-lg border focus-visible:outline-offset-[-1px] [content-visibility:auto] [contain-intrinsic-size:auto_320px]"
		>
			{isEditable && (
				<div className="flex items-center justify-end bg-chrome gap-1 border-b px-2 py-1">
					<ShortcutTooltip id="edit-document" label="Edit the selected document">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowEditor(true)}
							onPointerEnter={preloadJsonEditor}
							onFocus={preloadJsonEditor}
							className="text-muted-foreground hover:text-foreground"
						>
							<PencilIcon size={14} />
							Edit
						</Button>
					</ShortcutTooltip>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowDeleteDialog(true)}
						disabled={isDeleting}
						className="text-muted-foreground hover:bg-danger-soft hover:text-destructive active:bg-danger-soft"
					>
						<TrashIcon size={14} />
						Delete
					</Button>
				</div>
			)}

			<MemoizedJsonViewer
				className="h-full w-full overflow-auto"
				data={document}
				collapse={1}
			/>

			{isEditable && (
				<DocumentEditorDialog
					mode="edit"
					open={showEditor}
					onOpenChange={setShowEditor}
					database={database}
					collection={collection}
					initialValue={data}
					documentIdJson={documentIdJson}
					revision={revision}
					onCloseAutoFocus={returnFocus}
				/>
			)}

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent onCloseAutoFocus={returnFocus}>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this document? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction variant="destructive" onClick={handleDelete} disabled={isDeleting}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
