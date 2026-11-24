'use client';

import { useId } from 'react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { ShortcutKeys } from '@/components/ui/kbd';
import { Switch } from '@/components/ui/switch';
import { useSingleKeys } from '@/hooks/use-shortcut';
import { setSingleKeysEnabled, SHORTCUTS, type ShortcutId } from '@/lib/shortcuts';

const GROUPS = [
	['General', 'Sidebar'],
	['Collection', 'Document', 'Editor'],
] as const;

const GROUP_TITLES: Record<string, string> = {
	Document: 'Selected document',
	Editor: 'Document editor',
};

export function ShortcutsDialog({
	open,
	onOpenChange,
	canWrite,
	canCreate,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canWrite: boolean;
	canCreate: boolean;
}) {
	const switchId = useId();
	const singleKeys = useSingleKeys();

	const isAvailable = (id: ShortcutId) =>
		id === 'create' ? canCreate : canWrite || !SHORTCUTS[id].write;
	const ids = (Object.keys(SHORTCUTS) as ShortcutId[]).filter(isAvailable);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Keyboard shortcuts</DialogTitle>
					<DialogDescription>
						Single keys do nothing while you type in a field or editor.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-x-10 gap-y-5 md:grid-cols-2">
					{GROUPS.map(column => (
						<div key={column[0]} className="flex flex-col gap-5">
							{column.map(group => {
								const entries = ids.filter(id => SHORTCUTS[id].group === group);
								if (entries.length === 0) return null;
								return (
									<section key={group}>
										<h3 className="mb-1 text-sm font-semibold">{GROUP_TITLES[group] ?? group}</h3>
										<ul>
											{entries.map(id => (
												<li
													key={id}
													className="flex min-h-7 items-center justify-between gap-4 text-sm"
												>
													{SHORTCUTS[id].label}
													<ShortcutKeys id={id} all />
												</li>
											))}
										</ul>
									</section>
								);
							})}
						</div>
					))}
				</div>

				<div className="flex items-center justify-between gap-4 border-t pt-4">
					<label htmlFor={switchId} className="text-sm">
						Single key shortcuts
						<span className="text-muted-foreground block text-xs">
							Turn this off if keys trigger by accident. Combinations keep working.
						</span>
					</label>
					<Switch id={switchId} checked={singleKeys} onCheckedChange={setSingleKeysEnabled} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
