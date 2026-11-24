'use client';

import * as React from 'react';

import { useIsMac } from '@/hooks/use-shortcut';
import { formatCombo, SHORTCUTS, type ShortcutId } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

function Kbd({ className, ...props }: React.ComponentProps<'kbd'>) {
	return (
		<kbd
			data-slot="kbd"
			className={cn(
				'border-control-border text-muted-foreground inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-md border px-1 font-sans text-xs whitespace-nowrap pointer-coarse:hidden',
				className,
			)}
			{...props}
		/>
	);
}

function ShortcutKeys({
	id,
	all = false,
	className,
}: {
	id: ShortcutId;
	all?: boolean;
	className?: string;
}) {
	const mac = useIsMac();
	const combos = all ? SHORTCUTS[id].keys : SHORTCUTS[id].keys.slice(0, 1);

	return (
		<span className="inline-flex shrink-0 gap-1">
			{combos.map(combo => (
				<Kbd key={combo} className={cn(mac === null && 'invisible', className)}>
					{formatCombo(combo, mac ?? false)}
				</Kbd>
			))}
		</span>
	);
}

export { Kbd, ShortcutKeys };
