'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { CommandPalette } from '@/components/custom/command-palette';
import { useDatabaseFetcher } from '@/components/custom/database-fetcher';
import { ShortcutsDialog } from '@/components/custom/shortcuts-dialog';
import { usePreferredTheme } from '@/hooks/use-preferred-theme';
import { listCollections, rememberCollection } from '@/hooks/use-recent-collections';
import { useShortcut } from '@/hooks/use-shortcut';
import type { Database } from '@/lib/types/mongo';

type Overlay = 'palette' | 'help' | null;

export function AppShortcuts({
	databases,
	canCreate,
	canWrite,
	isAccountAdmin,
}: {
	databases: Database[];
	canCreate: boolean;
	canWrite: boolean;
	isAccountAdmin: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const { reloadData } = useDatabaseFetcher();
	const { setTheme } = useTheme();
	const theme = usePreferredTheme();
	const [overlay, setOverlay] = useState<Overlay>(null);

	useShortcut('quick-open', () => {
		if (overlay === 'palette') {
			setOverlay(null);
			return;
		}
		// Another dialog may hold unsaved input, so it stays in front.
		if (document.querySelector('[role$="dialog"][data-state="open"]')) return;
		setOverlay('palette');
	});
	useShortcut('help', () => setOverlay('help'));
	useShortcut('toggle-theme', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
	useShortcut('refresh', () => {
		void reloadData();
		router.refresh();
		toast.info('Reloading the data', { duration: 1200 });
	});

	useEffect(() => {
		const current = decodeURIComponent(pathname);
		const entry = listCollections(databases).find(
			candidate => decodeURIComponent(candidate.href) === current,
		);
		if (entry) rememberCollection(entry.href);
	}, [pathname, databases]);

	return (
		<>
			<CommandPalette
				open={overlay === 'palette'}
				onOpenChange={open => setOverlay(open ? 'palette' : null)}
				databases={databases}
				canCreate={canCreate}
				isAccountAdmin={isAccountAdmin}
			/>
			<ShortcutsDialog
				open={overlay === 'help'}
				onOpenChange={open => setOverlay(open ? 'help' : null)}
				canWrite={canWrite}
				canCreate={canCreate}
			/>
		</>
	);
}
