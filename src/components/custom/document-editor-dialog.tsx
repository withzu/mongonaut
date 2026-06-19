'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { addDocument, updateDocument } from '@/actions/databaseOperation';
import {
	isValidJson,
	JsonCodeEditor,
	JsonValidityBadge,
} from '@/components/custom/json-code-editor';
import type { MongoDocument } from '@/lib/types/mongo';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

type DocumentEditorMode = 'create' | 'edit';

interface DocumentEditorDialogProps {
	mode: DocumentEditorMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	database: string;
	collection: string;
	initialValue: string;
	documentId?: string;
}

const COPY: Record<DocumentEditorMode, { title: string; submit: string }> = {
	create: { title: 'Add a new document', submit: 'Add document' },
	edit: { title: 'Edit document', submit: 'Save changes' },
};

export function DocumentEditorDialog({
	mode,
	open,
	onOpenChange,
	database,
	collection,
	initialValue,
	documentId,
}: DocumentEditorDialogProps) {
	const router = useRouter();
	const [jsonInput, setJsonInput] = useState(initialValue);
	const [isSaving, setIsSaving] = useState(false);

	const [wasOpen, setWasOpen] = useState(open);
	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setJsonInput(initialValue);
	}

	const isValid = isValidJson(jsonInput);
	const isDirty = jsonInput !== initialValue;

	const handleSubmit = async () => {
		if (!isValid) {
			toast.error('Please provide valid JSON before saving');
			return;
		}

		setIsSaving(true);
		try {
			const parsed = JSON.parse(jsonInput);

			if (mode === 'create') {
				const result = await addDocument(database, collection, JSON.stringify(parsed));
				if (result.success) {
					toast.success('Document added');
					onOpenChange(false);
					router.refresh();
				} else {
					toast.error(`Error: ${result.error?.message || 'Unknown error'}`);
				}
				return;
			}

			if (!documentId) {
				toast.error('Cannot update a document without an id');
				return;
			}

			const result = await updateDocument(
				database,
				collection,
				documentId,
				parsed as MongoDocument,
			);
			if (result.success && result.updated) {
				toast.success('Document updated');
				onOpenChange(false);
				router.refresh();
			} else {
				toast.error(`Error: ${result.error?.message || 'No changes were saved'}`);
			}
		} catch (error) {
			console.error(error);
			toast.error('Invalid JSON format');
		} finally {
			setIsSaving(false);
		}
	};

	const copy = COPY[mode];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>{copy.title}</DialogTitle>
					<DialogDescription>
						{mode === 'create'
							? `Create a new document in the ${collection} collection using JSON format`
							: `Editing a document in the ${collection} collection`}
					</DialogDescription>
				</DialogHeader>

				<div className="h-[500px] border rounded-md overflow-hidden">
					<JsonCodeEditor value={jsonInput} onChange={setJsonInput} />
				</div>

				<DialogFooter className="w-full">
					<div className="flex justify-between items-center w-full">
						<JsonValidityBadge valid={isValid} />
						<div className="flex gap-2">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
							<Button
								onClick={handleSubmit}
								disabled={isSaving || !isValid || (mode === 'edit' && !isDirty)}
								className="min-w-[120px]"
							>
								{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{copy.submit}
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
