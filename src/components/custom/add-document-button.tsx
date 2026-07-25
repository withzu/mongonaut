'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentEditorDialog } from '@/components/custom/document-editor-dialog';

const EMPTY_DOCUMENT = '{\n  \n}';

export function AddDocumentButton({
	database,
	collection,
}: {
	database: string;
	collection: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)} className="flex items-center gap-2 self-start">
				<PlusIcon size={16} />
				<span>Add documents</span>
			</Button>

			<DocumentEditorDialog
				mode="create"
				open={open}
				onOpenChange={setOpen}
				database={database}
				collection={collection}
				initialValue={EMPTY_DOCUMENT}
			/>
		</>
	);
}
