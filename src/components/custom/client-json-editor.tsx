'use client';

import { githubDarkTheme, githubLightTheme, JsonEditor, JsonEditorProps } from 'json-edit-react';
import {
	CheckIcon,
	ChevronDownIcon,
	ClipboardCopy,
	PenIcon,
	PlusSquareIcon,
	TrashIcon,
	XIcon,
} from 'lucide-react';
import { usePreferredTheme } from '@/hooks/use-preferred-theme';

export function ClientJsonEditor(props: JsonEditorProps) {
	const theme = usePreferredTheme();
	let jsonTheme = githubLightTheme;

	if (theme === 'dark') {
		jsonTheme = githubDarkTheme;
	}

	return (
		<JsonEditor
			theme={jsonTheme}
			enableClipboard={true}
			rootName={''}
			icons={{
				edit: <PenIcon size={14} />,
				delete: <TrashIcon size={14} className="text-red-600" />,
				add: <PlusSquareIcon size={14} />,
				cancel: <XIcon size={14} className="text-red-600" />,
				ok: <CheckIcon size={14} className="text-green-400" />,
				chevron: <ChevronDownIcon size={14} />,
				copy: <ClipboardCopy size={14} />,
			}}
			showArrayIndices={true}
			maxWidth="100%"
			{...props}
		/>
	);
}
