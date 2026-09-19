'use client';

import { useRef, useState } from 'react';
import { Loader2, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { addDocuments, updateDocument } from '@/actions/databaseOperation';
import {
	isValidJson,
	JsonCodeEditor,
	JsonValidityBadge,
} from '@/components/custom/json-code-editor';
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
	/** Extended JSON of the `_id` being edited. Required in edit mode. */
	documentIdJson?: string | null;
	/** Fingerprint of the document as it was loaded, used to detect a concurrent write. */
	revision?: string;
}

const COPY: Record<DocumentEditorMode, { title: string; submit: string }> = {
	create: { title: 'Add documents', submit: 'Insert' },
	edit: { title: 'Edit document', submit: 'Save changes' },
};

const MAX_IMPORT_BYTES = 8 * 1024 * 1024;

export function DocumentEditorDialog({
	mode,
	open,
	onOpenChange,
	database,
	collection,
	initialValue,
	documentIdJson,
	revision,
}: DocumentEditorDialogProps) {
	const router = useRouter();
	const [jsonInput, setJsonInput] = useState(initialValue);
	const [isSaving, setIsSaving] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	const [wasOpen, setWasOpen] = useState(open);
	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) setJsonInput(initialValue);
	}

	const isValid = isValidJson(jsonInput);
	const isDirty = jsonInput !== initialValue;

	const handleFile = async (file: File) => {
		if (file.size > MAX_IMPORT_BYTES) {
			toast.error('The file is larger than 8 MB. Please split it into smaller files.');
			return;
		}
		const text = await file.text();
		if (!isValidJson(text)) {
			toast.error('That file does not contain valid JSON');
			return;
		}
		setJsonInput(text);
		toast.success(`Loaded ${file.name}`);
	};

	const handleSubmit = async () => {
		if (!isValid) {
			toast.error('Please provide valid JSON before saving');
			return;
		}

		setIsSaving(true);
		try {
			if (mode === 'create') {
				const result = await addDocuments(database, collection, jsonInput);
				if (result.success) {
					toast.success(
						result.data.insertedCount === 1
							? 'Document added'
							: `${result.data.insertedCount} documents added`,
					);
					onOpenChange(false);
					router.refresh();
				} else {
					toast.error(result.error);
				}
				return;
			}

			if (!documentIdJson) {
				toast.error('Cannot update a document without an id');
				return;
			}

			const result = await updateDocument(
				database,
				collection,
				documentIdJson,
				jsonInput,
				revision,
			);
			if (result.success) {
				toast.success(result.data.modified ? 'Document updated' : 'No changes were needed');
				onOpenChange(false);
				router.refresh();
			} else {
				// A conflict keeps the dialog open so the edit is not lost.
				toast.error(result.error, { duration: 8000 });
			}
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : 'Could not save the document');
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
							? `Insert one document or a JSON array of documents into "${collection}".`
							: `Editing a document in "${collection}".`}
					</DialogDescription>
				</DialogHeader>

				<p className="text-muted-foreground text-xs">
					Values use MongoDB Extended JSON, so types are preserved:{' '}
					<code className="bg-muted rounded px-1 py-0.5 font-mono">{'{ "$oid": "…" }'}</code> for an
					ObjectId,{' '}
					<code className="bg-muted rounded px-1 py-0.5 font-mono">{'{ "$date": "…" }'}</code> for a
					date.
				</p>

				<div className="h-[500px] border rounded-md overflow-hidden">
					<JsonCodeEditor value={jsonInput} onChange={setJsonInput} />
				</div>

				<DialogFooter className="w-full">
					<div className="flex flex-wrap items-center justify-between gap-2 w-full">
						<div className="flex items-center gap-2">
							<JsonValidityBadge valid={isValid} />
							{mode === 'create' && (
								<>
									<input
										ref={fileInput}
										type="file"
										accept="application/json,.json"
										className="hidden"
										onChange={event => {
											const file = event.target.files?.[0];
											event.target.value = '';
											if (file) void handleFile(file);
										}}
									/>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => fileInput.current?.click()}
									>
										<UploadIcon size={14} />
										Import file
									</Button>
								</>
							)}
						</div>
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
