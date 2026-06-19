'use client';

import { PencilIcon, TrashIcon } from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
	_id?: string | { $oid: string };
	[key: string]: unknown;
}

interface ReadonlyJsonEditorProps extends LibJsonEditorProps {
	className?: string;
	data: JsonDocument;
	collapse: number;
}

const MemoizedJsonEditor = memo<ReadonlyJsonEditorProps>(ClientJsonEditor);

export function DocumentView({ data, isReadonly }: { data: string; isReadonly: boolean }) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditor, setShowEditor] = useState(false);
	const router = useRouter();
	const params = useParams();

	const document = useMemo<JsonDocument>(() => JSON.parse(data), [data]);
	const prettyDocument = useMemo(() => JSON.stringify(document, null, 2), [document]);
	const documentId = useMemo(() => {
		if (document._id == null) return undefined;
		if (typeof document._id === 'object' && '$oid' in document._id) {
			return document._id.$oid;
		}
		return document._id as string;
	}, [document]);

	// Aggregation results may not carry a real _id (e.g. after $group/$project);
	// such documents can't be written back, so they are shown read-only.
	const isEditable = !isReadonly && documentId !== undefined;

	const handleDelete = async () => {
		if (!documentId || !isEditable) return;

		setIsDeleting(true);
		try {
			const result = await deleteDocument(
				params.database as string,
				params.collection as string,
				documentId,
			);

			if (result.success && result.deleted) {
				toast.success('Document deleted');
				router.refresh();
			} else {
				toast.error('Error deleting document');
			}
		} catch (error) {
			console.error('Error deleting document:', error);
			toast.error('Error deleting document');
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
					database={params.database as string}
					collection={params.collection as string}
					initialValue={prettyDocument}
					documentId={documentId}
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
