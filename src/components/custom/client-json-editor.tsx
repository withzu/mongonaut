'use client';

import { JsonEditor, type JsonEditorProps, type Theme } from 'json-edit-react';
import {
	CheckIcon,
	ChevronDownIcon,
	ClipboardCopy,
	PenIcon,
	PlusSquareIcon,
	TrashIcon,
	XIcon,
} from 'lucide-react';

// Roles switch with the theme on their own, so one definition serves both.
const theme: Theme = {
	displayName: 'Mongonaut',
	styles: {
		container: {
			backgroundColor: 'var(--mgn-surface-content)',
			color: 'var(--mgn-code-text)',
			fontFamily: 'var(--mgn-font-code), ui-monospace, monospace',
			fontSize: '0.8125rem',
		},
		property: 'var(--mgn-code-property)',
		bracket: 'var(--mgn-code-text)',
		itemCount: { color: 'var(--mgn-text-secondary)', fontStyle: 'normal' },
		string: 'var(--mgn-code-string)',
		number: 'var(--mgn-code-number)',
		boolean: 'var(--mgn-code-keyword)',
		null: { color: 'var(--mgn-code-keyword)', fontVariant: 'normal', fontWeight: 'normal' },
		inputHighlight: { backgroundColor: 'var(--mgn-code-selection)' },
		iconCollection: 'var(--mgn-text-secondary)',
		iconEdit: 'var(--mgn-text-secondary)',
		iconDelete: 'var(--mgn-danger)',
		iconAdd: 'var(--mgn-text-secondary)',
		iconCopy: 'var(--mgn-text-secondary)',
		iconOk: 'var(--mgn-success)',
		iconCancel: 'var(--mgn-danger)',
	},
};

export function ClientJsonEditor(props: JsonEditorProps) {
	return (
		<JsonEditor
			theme={theme}
			enableClipboard={true}
			rootName={''}
			icons={{
				edit: <PenIcon size={14} />,
				delete: <TrashIcon size={14} />,
				add: <PlusSquareIcon size={14} />,
				cancel: <XIcon size={14} />,
				ok: <CheckIcon size={14} />,
				chevron: <ChevronDownIcon size={14} />,
				copy: <ClipboardCopy size={14} />,
			}}
			showArrayIndices={true}
			maxWidth="100%"
			{...props}
		/>
	);
}
