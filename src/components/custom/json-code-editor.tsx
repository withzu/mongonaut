'use client';

import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LazyJsonEditor } from '@/components/custom/lazy-json-editor';

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
				className="bg-green-500/10 text-green-800 dark:text-green-400 flex items-center gap-1 px-3 py-1"
			>
				<CheckCircle2 size={14} aria-hidden="true" />
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
	return (
		<LazyJsonEditor
			value={value}
			height={height}
			onChange={onChange}
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
