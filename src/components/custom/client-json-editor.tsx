'use client';

import { JsonViewer, type JsonViewerProps, type Theme } from 'json-edit-react';

// Glyphs follow lucide (ChevronDown, ClipboardCopy). Since json-edit-react v2 the
// theme owns its icons and renders the outer <svg> itself, so only the inner
// markup lives here.
const strokeIcon = {
	viewBox: '0 0 24 24',
	svgProps: {
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 2,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
} as const;

const theme: Theme = {
	displayName: 'Mongonaut',
	icons: {
		collection: { ...strokeIcon, content: <path d="m6 9 6 6 6-6" /> },
		copy: {
			...strokeIcon,
			content: (
				<>
					<rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
					<path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
					<path d="M16 4h2a2 2 0 0 1 2 2v4" />
					<path d="M21 14H11" />
					<path d="m15 10-4 4 4 4" />
				</>
			),
		},
	},
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
		inputHighlight: 'var(--mgn-code-selection)',
		iconCollection: 'var(--mgn-text-secondary)',
		iconCopy: 'var(--mgn-text-secondary)',
	},
};

export function ClientJsonViewer(props: JsonViewerProps) {
	return (
		<JsonViewer
			theme={theme}
			showClipboardButton={true}
			showCollectionCount={true}
			rootName={''}
			showArrayIndexes={true}
			maxWidth="100%"
			{...props}
		/>
	);
}
