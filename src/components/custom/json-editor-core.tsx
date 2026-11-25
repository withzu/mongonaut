'use client';

import CodeMirror, { EditorView, type BasicSetupOptions } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDarkInit, vscodeLightInit, vscodeLightStyle } from '@uiw/codemirror-theme-vscode';
import { usePreferredTheme } from '@/hooks/use-preferred-theme';

export interface JsonEditorCoreProps {
	value: string;
	onChange: (value: string) => void;
	height: string;
	basicSetup: BasicSetupOptions;
}

const SYNTAX_ROLES: Record<string, string> = {
	propertyName: 'var(--mgn-code-property)',
	string: 'var(--mgn-code-string)',
	number: 'var(--mgn-code-number)',
	bool: 'var(--mgn-code-keyword)',
	keyword: 'var(--mgn-code-keyword)',
	separator: 'var(--mgn-code-text)',
	punctuation: 'var(--mgn-code-text)',
	comment: 'var(--mgn-code-comment)',
	invalid: 'var(--mgn-danger)',
};

const syntax = vscodeLightStyle
	.flatMap(style => style.tag)
	.flatMap(tag => {
		const color = SYNTAX_ROLES[String(tag)];
		return color ? [{ tag, color }] : [];
	});

const settings = {
	background: 'var(--mgn-surface-content)',
	foreground: 'var(--mgn-code-text)',
	caret: 'var(--mgn-text)',
	selection: 'var(--mgn-code-selection)',
	selectionMatch: 'var(--mgn-code-match)',
	lineHighlight: 'var(--mgn-code-current-line)',
	gutterBackground: 'var(--mgn-surface-content)',
	gutterForeground: 'var(--mgn-code-gutter)',
	gutterActiveForeground: 'var(--mgn-text)',
	gutterBorder: 'var(--mgn-separator)',
	fontFamily: 'var(--mgn-font-code), ui-monospace, monospace',
	fontSize: '0.8125rem',
};

const metrics = EditorView.theme({
	'.cm-line': { lineHeight: '1.375rem' },
	'.cm-gutterElement': { lineHeight: '1.375rem' },
	'&.cm-focused': { outline: 'none' },
});

const lightTheme = vscodeLightInit({ settings, styles: syntax });
const darkTheme = vscodeDarkInit({ settings, styles: syntax });

export default function JsonEditorCore({
	value,
	onChange,
	height,
	basicSetup,
}: JsonEditorCoreProps) {
	const theme = usePreferredTheme();

	return (
		<CodeMirror
			value={value}
			height={height}
			extensions={[json(), metrics]}
			onChange={onChange}
			theme={theme === 'dark' ? darkTheme : lightTheme}
			basicSetup={basicSetup}
		/>
	);
}
