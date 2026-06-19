'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { CodeIcon, PlayIcon, PlusIcon, TablePropertiesIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePreferredTheme } from '@/lib/utils';

type QueryMode = 'find' | 'aggregate';
type FindInput = 'builder' | 'json';

type Operator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in' | 'exists';

interface BuilderRow {
	field: string;
	operator: Operator;
	value: string;
}

interface QueryPanelProps {
	defaultMode?: QueryMode;
	defaultFilter?: string;
	defaultSort?: string;
	defaultPipeline?: string;
}

const OPERATORS: { value: Operator; label: string }[] = [
	{ value: 'eq', label: '=' },
	{ value: 'ne', label: '≠' },
	{ value: 'gt', label: '>' },
	{ value: 'gte', label: '≥' },
	{ value: 'lt', label: '<' },
	{ value: 'lte', label: '≤' },
	{ value: 'contains', label: 'contains' },
	{ value: 'in', label: 'in' },
	{ value: 'exists', label: 'exists' },
];

const PIPELINE_PLACEHOLDER = `[
  { "$match": {} },
  { "$group": { "_id": "$status", "count": { "$sum": 1 } } }
]`;

/** Coerce a raw string into a number, boolean, null, or string. */
function coerce(raw: string): unknown {
	const trimmed = raw.trim();
	if (trimmed === '') return '';
	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (trimmed === 'null') return null;
	const num = Number(trimmed);
	if (!isNaN(num) && trimmed !== '') return num;
	return raw;
}

/** Compile a single builder row into a MongoDB filter clause. */
function rowToClause(row: BuilderRow): Record<string, unknown> | null {
	const field = row.field.trim();
	if (!field) return null;

	switch (row.operator) {
		case 'eq':
			return { [field]: coerce(row.value) };
		case 'ne':
			return { [field]: { $ne: coerce(row.value) } };
		case 'gt':
			return { [field]: { $gt: coerce(row.value) } };
		case 'gte':
			return { [field]: { $gte: coerce(row.value) } };
		case 'lt':
			return { [field]: { $lt: coerce(row.value) } };
		case 'lte':
			return { [field]: { $lte: coerce(row.value) } };
		case 'contains':
			return { [field]: { $regex: row.value, $options: 'i' } };
		case 'in':
			return {
				[field]: {
					$in: row.value
						.split(',')
						.map(v => v.trim())
						.filter(v => v.length > 0)
						.map(coerce),
				},
			};
		case 'exists':
			return { [field]: { $exists: row.value.trim().toLowerCase() !== 'false' } };
		default:
			return null;
	}
}

function buildFilter(rows: BuilderRow[]): Record<string, unknown> {
	const clauses = rows.map(rowToClause).filter((c): c is Record<string, unknown> => c !== null);
	if (clauses.length === 0) return {};
	if (clauses.length === 1) return clauses[0];
	return { $and: clauses };
}

export function QueryPanel({
	defaultMode = 'find',
	defaultFilter,
	defaultSort,
	defaultPipeline,
}: QueryPanelProps) {
	const router = useRouter();
	const theme = usePreferredTheme();
	const editorTheme = theme === 'dark' ? vscodeDark : 'light';

	// A raw filter from the URL can't be reliably reversed into builder rows, so
	// fall back to the JSON editor when one is present.
	const hasInitialFilter = !!defaultFilter && defaultFilter !== '{}';
	const [findInput, setFindInput] = useState<FindInput>(hasInitialFilter ? 'json' : 'builder');
	const [rows, setRows] = useState<BuilderRow[]>([{ field: '', operator: 'eq', value: '' }]);
	const [filterJson, setFilterJson] = useState(defaultFilter || '{\n  \n}');

	const initialSort = useMemo(() => {
		if (!defaultSort) return { field: '', direction: '1' };
		try {
			const parsed = JSON.parse(defaultSort) as Record<string, number>;
			const [field] = Object.keys(parsed);
			if (field) return { field, direction: String(parsed[field]) };
		} catch {
			// ignore malformed sort
		}
		return { field: '', direction: '1' };
	}, [defaultSort]);
	const [sortField, setSortField] = useState(initialSort.field);
	const [sortDirection, setSortDirection] = useState(initialSort.direction);

	const [pipelineJson, setPipelineJson] = useState(defaultPipeline || PIPELINE_PLACEHOLDER);
	const [pipelineError, setPipelineError] = useState<string | null>(null);

	const updateRow = (index: number, patch: Partial<BuilderRow>) => {
		setRows(prev => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	};
	const addRow = () => setRows(prev => [...prev, { field: '', operator: 'eq', value: '' }]);
	const removeRow = (index: number) =>
		setRows(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

	const pushQuery = (params: URLSearchParams) => {
		const qs = params.toString();
		router.push(qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
	};

	const runFind = () => {
		const params = new URLSearchParams();
		params.set('mode', 'find');

		if (findInput === 'builder') {
			const filter = buildFilter(rows);
			if (Object.keys(filter).length > 0) {
				params.set('filter', JSON.stringify(filter));
			}
		} else {
			const trimmed = filterJson.trim();
			if (trimmed && trimmed !== '{}') {
				params.set('filter', trimmed);
			}
		}

		if (sortField.trim()) {
			params.set('sort', JSON.stringify({ [sortField.trim()]: Number(sortDirection) }));
		}

		pushQuery(params);
	};

	const runAggregate = () => {
		try {
			const parsed = JSON.parse(pipelineJson);
			if (!Array.isArray(parsed)) {
				setPipelineError('Pipeline must be a JSON array');
				return;
			}
		} catch {
			setPipelineError('Invalid JSON');
			return;
		}
		setPipelineError(null);
		const params = new URLSearchParams();
		params.set('mode', 'aggregate');
		params.set('pipeline', pipelineJson.trim());
		pushQuery(params);
	};

	const clearQuery = () => {
		setRows([{ field: '', operator: 'eq', value: '' }]);
		setFilterJson('{\n  \n}');
		setSortField('');
		setSortDirection('1');
		router.push(window.location.pathname);
	};

	const toggleFindInput = () => {
		if (findInput === 'builder') {
			// Seed the JSON editor with the compiled builder filter.
			const filter = buildFilter(rows);
			setFilterJson(JSON.stringify(filter, null, 2));
			setFindInput('json');
		} else {
			setFindInput('builder');
		}
	};

	return (
		<div className="rounded-lg border bg-muted/20">
			<Tabs defaultValue={defaultMode} className="w-full">
				<div className="flex items-center justify-between gap-2 border-b px-3 py-2">
					<TabsList>
						<TabsTrigger value="find">Find</TabsTrigger>
						<TabsTrigger value="aggregate">Aggregate</TabsTrigger>
					</TabsList>
					<Button variant="ghost" size="sm" onClick={clearQuery} className="text-muted-foreground">
						<XIcon size={14} />
						Clear
					</Button>
				</div>

				<TabsContent value="find" className="space-y-3 p-3">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground">Filter</span>
						<Button variant="ghost" size="sm" onClick={toggleFindInput}>
							{findInput === 'builder' ? (
								<>
									<CodeIcon size={14} />
									JSON
								</>
							) : (
								<>
									<TablePropertiesIcon size={14} />
									Builder
								</>
							)}
						</Button>
					</div>

					{findInput === 'builder' ? (
						<div className="space-y-2">
							{rows.map((row, index) => (
								<div key={index} className="flex flex-wrap items-center gap-2 md:flex-nowrap">
									<Input
										placeholder="field (e.g. user.age)"
										value={row.field}
										onChange={e => updateRow(index, { field: e.target.value })}
										className="min-w-0 flex-1"
									/>
									<Select
										value={row.operator}
										onValueChange={value => updateRow(index, { operator: value as Operator })}
									>
										<SelectTrigger className="w-28 shrink-0">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{OPERATORS.map(op => (
												<SelectItem key={op.value} value={op.value}>
													{op.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Input
										placeholder={
											row.operator === 'in'
												? 'a, b, c'
												: row.operator === 'exists'
													? 'true / false'
													: 'value'
										}
										value={row.value}
										onChange={e => updateRow(index, { value: e.target.value })}
										onKeyDown={e => e.key === 'Enter' && runFind()}
										className="min-w-0 flex-1"
									/>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => removeRow(index)}
										disabled={rows.length === 1}
										className="shrink-0 text-muted-foreground"
									>
										<XIcon size={14} />
									</Button>
								</div>
							))}
							<Button variant="outline" size="sm" onClick={addRow}>
								<PlusIcon size={14} />
								Add condition
							</Button>
						</div>
					) : (
						<div className="overflow-hidden rounded-md border">
							<CodeMirror
								value={filterJson}
								height="140px"
								extensions={[json()]}
								onChange={setFilterJson}
								theme={editorTheme}
								basicSetup={{ lineNumbers: true, foldGutter: false }}
							/>
						</div>
					)}

					<div className="flex flex-wrap items-center gap-2">
						<span className="text-xs font-medium text-muted-foreground">Sort</span>
						<Input
							placeholder="field"
							value={sortField}
							onChange={e => setSortField(e.target.value)}
							className="h-9 w-48"
						/>
						<Select value={sortDirection} onValueChange={setSortDirection}>
							<SelectTrigger className="w-32">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="1">Ascending</SelectItem>
								<SelectItem value="-1">Descending</SelectItem>
							</SelectContent>
						</Select>
						<Button onClick={runFind} className="ml-auto">
							<PlayIcon size={14} />
							Run find
						</Button>
					</div>
				</TabsContent>

				<TabsContent value="aggregate" className="space-y-3 p-3">
					<span className="text-xs font-medium text-muted-foreground">Aggregation pipeline</span>
					<div className="overflow-hidden rounded-md border">
						<CodeMirror
							value={pipelineJson}
							height="200px"
							extensions={[json()]}
							onChange={value => {
								setPipelineJson(value);
								if (pipelineError) setPipelineError(null);
							}}
							theme={editorTheme}
							basicSetup={{ lineNumbers: true, foldGutter: true }}
						/>
					</div>
					<div className="flex items-center justify-between gap-2">
						<span className="text-xs text-destructive">{pipelineError}</span>
						<Button onClick={runAggregate}>
							<PlayIcon size={14} />
							Run aggregation
						</Button>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
