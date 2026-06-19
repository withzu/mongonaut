'use client';

import { SaveIcon, TrashIcon } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { JsonEditorProps as LibJsonEditorProps, UpdateFunction } from 'json-edit-react';
import { Button } from '@/components/ui/button';
import { ClientJsonEditor } from '@/components/custom/client-json-editor';
import { deleteDocument, updateDocument } from '@/actions/databaseOperation';
import type { MongoDocument } from '@/lib/types/mongo';
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

type UpdateEvent = Parameters<UpdateFunction>[0];

interface UpdateResult {
	success: boolean;
	updated?: boolean;
	deleted?: boolean;
	error?: Error;
}

interface JsonEditorProps extends Omit<LibJsonEditorProps, 'onUpdate'> {
	className?: string;
	data: JsonDocument;
	restrictAdd: boolean;
	restrictDelete: boolean;
	restrictEdit: boolean;
	collapse: number;
	onUpdate: UpdateFunction;
}

const MemoizedJsonEditor = memo<JsonEditorProps>(ClientJsonEditor);

export function DocumentView({ data, isReadonly }: { data: string; isReadonly: boolean }) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const router = useRouter();
	const params = useParams();

	const originalDocument = useMemo<JsonDocument>(() => JSON.parse(data), [data]);
	const [currentDocument, setCurrentDocument] = useState<JsonDocument>(originalDocument);
	const documentId = useMemo(() => {
		if (originalDocument._id == null) return undefined;
		if (typeof originalDocument._id === 'object' && '$oid' in originalDocument._id) {
			return originalDocument._id.$oid;
		}
		return originalDocument._id as string;
	}, [originalDocument]);

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

	const hasChanges = useMemo(() => {
		const currentJson = JSON.stringify(currentDocument, null, 2);
		const originalJson = JSON.stringify(originalDocument, null, 2);
		return currentJson !== originalJson;
	}, [currentDocument, originalDocument]);

	useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasChanges) {
				event.preventDefault();
				return '';
			}
		};

		if (hasChanges) {
			window.addEventListener('beforeunload', handleBeforeUnload);
		}

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [hasChanges]);

	const handleDocumentUpdate = useCallback((updateEvent: UpdateEvent) => {
		if (!updateEvent.path) {
			const newDocument = updateEvent as unknown as JsonDocument;
			if ('_id' in newDocument) {
				setCurrentDocument(newDocument);
			}
			return;
		}

		setCurrentDocument(prevDoc => {
			const newDoc = { ...prevDoc };
			if (updateEvent.path?.length === 1) {
				const key = String(updateEvent.path[0]);
				newDoc[key] = updateEvent.newValue;
			}
			return newDoc;
		});
	}, []);

	const handleSave = async () => {
		if (!documentId || !isEditable) return;

		setIsSaving(true);
		try {
			const documentToSave: MongoDocument = {
				...currentDocument,
				_id: documentId,
			};

			const result = (await updateDocument(
				params.database as string,
				params.collection as string,
				documentId,
				documentToSave,
			)) as UpdateResult;

			if (result.success && result.updated) {
				toast.success('Document updated');
				router.refresh();
			} else {
				toast.error('Error updating document');
				console.error('Update error:', result.error);
			}
		} catch (error) {
			console.error('Error updating document:', error);
			toast.error('Error updating document');
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="border rounded-lg relative overflow-hidden w-full">
			{isEditable && (
				<div className="absolute top-2 right-2 z-10 flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleSave}
						disabled={isSaving || !hasChanges}
						className="text-muted-foreground hover:text-primary cursor-pointer"
					>
						<SaveIcon size={16} />
						<span className="sr-only">Save changes</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setShowDeleteDialog(true)}
						disabled={isDeleting}
						className="text-muted-foreground hover:text-destructive cursor-pointer"
					>
						<TrashIcon size={16} />
						<span className="sr-only">Delete document</span>
					</Button>
				</div>
			)}

			<MemoizedJsonEditor
				className="w-full h-full overflow-scroll bg-background! !dark:border-[#242424]"
				data={currentDocument}
				restrictAdd={!isEditable}
				restrictDelete={!isEditable}
				restrictEdit={!isEditable}
				collapse={1}
				onUpdate={handleDocumentUpdate}
			/>

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
