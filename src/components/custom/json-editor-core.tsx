'use client';

import CodeMirror, { type BasicSetupOptions } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { usePreferredTheme } from '@/hooks/use-preferred-theme';

export type { BasicSetupOptions };

export interface JsonEditorCoreProps {
	value: string;
	onChange: (value: string) => void;
	height: string;
	basicSetup: BasicSetupOptions;
	lightTheme?: 'vscode' | 'default';
}

export default function JsonEditorCore({
	value,
	onChange,
	height,
	basicSetup,
	lightTheme = 'vscode',
}: JsonEditorCoreProps) {
	const theme = usePreferredTheme();
	const resolvedTheme =
		theme === 'dark' ? vscodeDark : lightTheme === 'vscode' ? vscodeLight : 'light';

	return (
		<CodeMirror
			value={value}
			height={height}
			extensions={[json()]}
			onChange={onChange}
			theme={resolvedTheme}
			basicSetup={basicSetup}
		/>
	);
}
