'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DocumentEditorDialog } from '@/components/custom/document-editor-dialog';

const EMPTY_DOCUMENT = '{\n  \n}';

export function AddDocumentButton() {
	const params = useParams();
	const [open, setOpen] = useState(false);
	const database = params.database as string;
	const collection = params.collection as string;

	return (
		<>
			<Button onClick={() => setOpen(true)} className="flex items-center gap-2">
				<PlusIcon size={16} />
				<span>Add document</span>
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
