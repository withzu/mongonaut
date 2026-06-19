'use client';

import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { usePreferredTheme } from '@/lib/utils';

export function isValidJson(value: string): boolean {
	try {
		JSON.parse(value);
		return true;
	} catch {
		return false;
	}
}

export function JsonValidityBadge({ valid }: { valid: boolean }) {
	if (valid) {
		return (
			<Badge
				variant="outline"
				className="bg-green-500/10 text-green-500 flex items-center gap-1 px-3 py-1"
			>
				<CheckCircle2 size={14} />
				<span>Valid JSON</span>
			</Badge>
		);
	}

	return (
		<Badge
			variant="outline"
			className="bg-destructive/10 text-destructive flex items-center gap-1 px-3 py-1"
		>
			<AlertCircle size={14} />
			<span>Invalid JSON</span>
		</Badge>
	);
}

interface JsonCodeEditorProps {
	value: string;
	onChange: (value: string) => void;
	height?: string;
}

export function JsonCodeEditor({ value, onChange, height = '500px' }: JsonCodeEditorProps) {
	const theme = usePreferredTheme();

	return (
		<CodeMirror
			value={value}
			height={height}
			extensions={[json()]}
			onChange={onChange}
			theme={theme === 'dark' ? vscodeDark : vscodeLight}
			basicSetup={{
				lineNumbers: true,
				highlightActiveLine: true,
				bracketMatching: true,
				autocompletion: true,
				foldGutter: true,
				indentOnInput: true,
			}}
		/>
	);
}
