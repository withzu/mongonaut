'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentEditorDialog } from '@/components/custom/document-editor-dialog';
import { ShortcutTooltip } from '@/components/custom/shortcut-tooltip';
import { useShortcut } from '@/hooks/use-shortcut';
import { preloadJsonEditor } from '@/components/custom/lazy-json-editor';

const EMPTY_DOCUMENT = '{\n  \n}';

export function AddDocumentButton({
	database,
	collection,
}: {
	database: string;
	collection: string;
}) {
	const [open, setOpen] = useState(false);
	useShortcut('add-documents', () => setOpen(true));

	return (
		<>
			<ShortcutTooltip id="add-documents">
				<Button
					variant="outline"
					onClick={() => setOpen(true)}
					onPointerEnter={preloadJsonEditor}
					onFocus={preloadJsonEditor}
					className="self-start"
				>
					<PlusIcon size={16} />
					<span>Add documents</span>
				</Button>
			</ShortcutTooltip>

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
