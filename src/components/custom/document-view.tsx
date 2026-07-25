'use client';

import { PencilIcon, TrashIcon } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { JsonEditorProps as LibJsonEditorProps } from 'json-edit-react';
import { Button } from '@/components/ui/button';
import { ClientJsonEditor } from '@/components/custom/client-json-editor';
import { DocumentEditorDialog } from '@/components/custom/document-editor-dialog';
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

interface ReadonlyJsonEditorProps extends LibJsonEditorProps {
	className?: string;
	data: JsonDocument;
	collapse: number;
}

const MemoizedJsonEditor = memo<ReadonlyJsonEditorProps>(ClientJsonEditor);

export function DocumentView({
	data,
	documentIdJson,
	database,
	collection,
	isReadonly,
}: {
	data: string;
	documentIdJson: string | null;
	database: string;
	collection: string;
	isReadonly: boolean;
}) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const router = useRouter();

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

	return (
		<div className="border rounded-lg overflow-hidden w-full">
			{isEditable && (
				<div className="flex items-center justify-end gap-1 border-b bg-muted/30 px-2 py-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowEditor(true)}
						className="text-muted-foreground hover:text-primary cursor-pointer h-7 gap-1.5"
					>
						<PencilIcon size={14} />
						Edit
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowDeleteDialog(true)}
						disabled={isDeleting}
						className="text-muted-foreground hover:text-destructive cursor-pointer h-7 gap-1.5"
					>
						<TrashIcon size={14} />
						Delete
					</Button>
				</div>
			)}

			<MemoizedJsonEditor
				className="w-full h-full overflow-scroll bg-background! !dark:border-[#242424]"
				data={document}
				restrictAdd
				restrictDelete
				restrictEdit
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
				/>
			)}

			<AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Document</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this document? This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
