'use client';

import { Suspense, use, useId, useState } from 'react';
import { KeyRoundIcon, Loader2, PlusIcon, TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { createIndex, dropIndex, type ActionResult } from '@/actions/databaseOperation';
import type { IndexSummary } from '@/lib/types/mongo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmNameDialog } from '@/components/custom/confirm-name-dialog';
import { formatBytes } from '@/lib/utils';

export type IndexRequest = Promise<ActionResult<IndexSummary[]>>;

export function IndexManagerDialog({
	request,
	database,
	collection,
	readOnly,
	onClose,
	onReload,
}: {
	request: IndexRequest | null;
	database: string;
	collection: string;
	readOnly?: boolean;
	onClose: () => void;
	onReload: () => void;
}) {
	const [showCreate, setShowCreate] = useState(false);
	const [dropping, setDropping] = useState<IndexSummary | null>(null);
	const [busy, setBusy] = useState(false);

	const handleDrop = async () => {
		if (!dropping) return;
		setBusy(true);
		try {
			const result = await dropIndex(database, collection, dropping.name);
			if (result.success) {
				toast.success(`Index "${dropping.name}" dropped`);
				onReload();
			} else {
				toast.error(result.error);
			}
		} finally {
			setBusy(false);
			setDropping(null);
		}
	};

	return (
		<>
			<Dialog open={request !== null} onOpenChange={next => !next && onClose()}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Indexes</DialogTitle>
						<DialogDescription>
							Indexes of &quot;{collection}&quot; in &quot;{database}&quot;.
						</DialogDescription>
					</DialogHeader>

					<div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto">
						<Suspense
							fallback={
								<div className="text-muted-foreground flex items-center gap-2 py-6 text-sm">
									<Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
									Loading indexes…
								</div>
							}
						>
							{request && <IndexList request={request} readOnly={readOnly} onDrop={setDropping} />}
						</Suspense>
					</div>

					<DialogFooter>
						<Button variant="outline" onClick={onClose}>
							Close
						</Button>
						{!readOnly && (
							<Button onClick={() => setShowCreate(true)}>
								<PlusIcon size={14} />
								Create index
							</Button>
						)}
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<CreateIndexDialog
				open={showCreate}
				onOpenChange={setShowCreate}
				database={database}
				collection={collection}
				onCreated={onReload}
			/>

			<ConfirmNameDialog
				open={!!dropping}
				onOpenChange={next => !next && setDropping(null)}
				title="Drop index"
				description={
					<>
						Dropping &quot;{dropping?.name}&quot; can slow down every query that relies on it. This
						cannot be undone.
					</>
				}
				expectedName={dropping?.name ?? ''}
				confirmLabel="Drop index"
				busy={busy}
				onConfirm={handleDrop}
			/>
		</>
	);
}

function IndexList({
	request,
	readOnly,
	onDrop,
}: {
	request: IndexRequest;
	readOnly?: boolean;
	onDrop: (index: IndexSummary) => void;
}) {
	const result = use(request);

	if (!result.success) {
		return (
			<p role="alert" className="text-destructive text-sm">
				{result.error}
			</p>
		);
	}

	if (result.data.length === 0) {
		return (
			<p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-xs">
				This collection has no indexes.
			</p>
		);
	}

	return (
		<>
			{result.data.map(index => (
				<div
					key={index.name}
					className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
				>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<KeyRoundIcon
								size={14}
								className="text-muted-foreground shrink-0"
								aria-hidden="true"
							/>
							<span className="truncate font-medium">{index.name}</span>
							{index.unique && <Badge variant="outline">unique</Badge>}
							{index.sparse && <Badge variant="outline">sparse</Badge>}
							{index.ttlSeconds !== undefined && (
								<Badge variant="outline">ttl {index.ttlSeconds}s</Badge>
							)}
						</div>
						<div className="text-muted-foreground truncate font-mono text-xs">
							{JSON.stringify(index.keys)}
							{index.size !== undefined ? ` · ${formatBytes(index.size)}` : ''}
						</div>
					</div>
					{!readOnly && index.name !== '_id_' && (
						<Button
							variant="ghost"
							size="icon"
							aria-label={`Drop index ${index.name}`}
							onClick={() => onDrop(index)}
							className="text-muted-foreground hover:text-destructive shrink-0"
						>
							<TrashIcon size={16} />
						</Button>
					)}
				</div>
			))}
		</>
	);
}

function CreateIndexDialog({
	open,
	onOpenChange,
	database,
	collection,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	database: string;
	collection: string;
	onCreated: () => void;
}) {
	const keysId = useId();
	const nameId = useId();
	const ttlId = useId();

	const [keysJson, setKeysJson] = useState('{ "field": 1 }');
	const [name, setName] = useState('');
	const [unique, setUnique] = useState(false);
	const [sparse, setSparse] = useState(false);
	const [ttl, setTtl] = useState('');
	const [saving, setSaving] = useState(false);

	const [wasOpen, setWasOpen] = useState(open);
	if (open !== wasOpen) {
		setWasOpen(open);
		if (open) {
			setKeysJson('{ "field": 1 }');
			setName('');
			setUnique(false);
			setSparse(false);
			setTtl('');
		}
	}

	const handleSave = async () => {
		setSaving(true);
		try {
			const ttlSeconds = ttl.trim() ? Number(ttl.trim()) : undefined;
			if (ttlSeconds !== undefined && (!Number.isFinite(ttlSeconds) || ttlSeconds < 0)) {
				toast.error('TTL must be a positive number of seconds');
				return;
			}
			const result = await createIndex(database, collection, {
				keysJson,
				name,
				unique,
				sparse,
				ttlSeconds,
			});
			if (result.success) {
				toast.success(`Index "${result.data.name}" created`);
				onOpenChange(false);
				onCreated();
			} else {
				toast.error(result.error);
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Create index</DialogTitle>
					<DialogDescription>
						Define the index keys as JSON: 1 for ascending, -1 for descending, &quot;text&quot; for
						a text index.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<label htmlFor={keysId} className="text-sm font-medium">
							Keys
						</label>
						<Input
							id={keysId}
							value={keysJson}
							onChange={event => setKeysJson(event.target.value)}
							className="font-mono"
							autoFocus
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label htmlFor={nameId} className="text-sm font-medium">
							Name (optional)
						</label>
						<Input
							id={nameId}
							value={name}
							onChange={event => setName(event.target.value)}
							placeholder="Derived from the keys when empty"
						/>
					</div>

					<div className="flex items-center justify-between rounded-md border px-3 py-2">
						<div>
							<p className="text-sm font-medium">Unique</p>
							<p className="text-muted-foreground text-xs">Reject duplicate values.</p>
						</div>
						<Switch checked={unique} onCheckedChange={setUnique} aria-label="Unique index" />
					</div>

					<div className="flex items-center justify-between rounded-md border px-3 py-2">
						<div>
							<p className="text-sm font-medium">Sparse</p>
							<p className="text-muted-foreground text-xs">
								Only index documents that contain the field.
							</p>
						</div>
						<Switch checked={sparse} onCheckedChange={setSparse} aria-label="Sparse index" />
					</div>

					<div className="flex flex-col gap-2">
						<label htmlFor={ttlId} className="text-sm font-medium">
							TTL in seconds (optional)
						</label>
						<Input
							id={ttlId}
							value={ttl}
							onChange={event => setTtl(event.target.value)}
							inputMode="numeric"
							placeholder="Expire documents after this many seconds"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving}>
						{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
						Create index
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
