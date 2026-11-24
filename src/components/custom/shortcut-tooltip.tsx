'use client';

import type { ReactElement } from 'react';
import { ShortcutKeys } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SHORTCUTS, type ShortcutId } from '@/lib/shortcuts';

export function ShortcutTooltip({
	id,
	label,
	children,
}: {
	id: ShortcutId;
	label?: string;
	children: ReactElement;
}) {
	return (
		<Tooltip delayDuration={500}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent className="flex items-center gap-2 pointer-coarse:hidden">
				{label ?? SHORTCUTS[id].label}
				<ShortcutKeys id={id} className="text-inverse-foreground border-current/40" />
			</TooltipContent>
		</Tooltip>
	);
}
