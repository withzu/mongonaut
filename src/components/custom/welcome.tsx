'use client';

import Link from 'next/link';
import { KeyboardIcon, PlusIcon, SearchIcon, TableIcon, ZapIcon } from 'lucide-react';
import { CenteredContainer } from '@/components/custom/app-container';
import { useDatabaseFetcher } from '@/components/custom/database-fetcher';
import { LogoMark } from '@/components/custom/logo-mark';
import { ShortcutKeys } from '@/components/ui/kbd';
import { useRecentCollections } from '@/hooks/use-recent-collections';
import { runShortcut, type ShortcutId } from '@/lib/shortcuts';
import { cn, formatCount } from '@/lib/utils';

const ROW =
	'focus-row hover:bg-hover active:bg-pressed group/row flex min-h-(--mgn-height-control) w-full items-center gap-1.5 rounded-md px-2 text-left text-sm transition-colors [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground';

const MAX_RECENT = 5;

export function Welcome() {
	const { databases, canCreate } = useDatabaseFetcher();
	const recent = useRecentCollections(databases).slice(0, MAX_RECENT);

	const actions: { id: ShortcutId; label: string; icon: typeof ZapIcon; hidden?: boolean }[] = [
		{ id: 'quick-open', label: 'Go to a collection', icon: ZapIcon },
		{ id: 'search', label: 'Search the sidebar', icon: SearchIcon },
		{ id: 'create', label: 'Create new', icon: PlusIcon, hidden: !canCreate },
		{ id: 'help', label: 'Keyboard shortcuts', icon: KeyboardIcon },
	];

	return (
		<CenteredContainer>
			<div className="flex w-full max-w-xl flex-col items-center">
				<div className="bg-chrome mb-4 flex size-20 items-center justify-center rounded-lg border">
					<LogoMark className="h-12" priority />
				</div>
				<h1 className="text-xl font-semibold">Welcome to Mongonaut</h1>
				<p className="text-muted-foreground leading-paragraph mt-1 text-center text-sm">
					{databases.length === 0
						? 'No databases are visible for this account yet.'
						: 'Pick a collection to view and manage your MongoDB data.'}
				</p>

				<div
					className={cn(
						'mt-8 grid w-full gap-x-10 gap-y-5',
						recent.length > 0 ? 'md:grid-cols-2' : 'max-w-xs',
					)}
				>
					<section aria-labelledby="welcome-start">
						<h2 id="welcome-start" className="mb-1 px-2 text-sm font-semibold">
							Start
						</h2>
						{actions
							.filter(action => !action.hidden)
							.map(({ id, label, icon: Icon }) => (
								<button
									key={id}
									type="button"
									onClick={() => runShortcut(id)}
									className={cn(ROW, id === 'help' && 'pointer-coarse:hidden')}
								>
									<Icon aria-hidden="true" />
									<span className="mr-auto">{label}</span>
									<ShortcutKeys id={id} className="group-hover/row:text-selection-secondary" />
								</button>
							))}
					</section>

					{recent.length > 0 && (
						<section aria-labelledby="welcome-recent">
							<h2 id="welcome-recent" className="mb-1 px-2 text-sm font-semibold">
								Recent
							</h2>
							{recent.map(({ href, database, collection }) => (
								<Link key={href} href={href} className={ROW}>
									<TableIcon aria-hidden="true" />
									<span className="truncate">{collection.name}</span>
									<span className="text-muted-foreground group-hover/row:text-selection-secondary truncate text-xs">
										{database}
									</span>
									{collection.documentCount !== null && (
										<span className="text-muted-foreground group-hover/row:text-selection-secondary ml-auto pl-2 text-xs tabular-nums">
											{formatCount(collection.documentCount)}
										</span>
									)}
								</Link>
							))}
						</section>
					)}
				</div>
			</div>
		</CenteredContainer>
	);
}
