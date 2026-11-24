'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
	InfoIcon,
	KeyboardIcon,
	PanelLeftIcon,
	PlusIcon,
	RotateCwIcon,
	SearchIcon,
	SettingsIcon,
	SunMoonIcon,
	TableIcon,
} from 'lucide-react';
import { Kbd, ShortcutKeys } from '@/components/ui/kbd';
import { listCollections, useRecentCollections } from '@/hooks/use-recent-collections';
import { useIsMac } from '@/hooks/use-shortcut';
import { formatCombo, runShortcut, type ShortcutId } from '@/lib/shortcuts';
import type { Database } from '@/lib/types/mongo';
import { cn, formatCount } from '@/lib/utils';

interface PaletteItem {
	key: string;
	group: 'Recent' | 'Collections' | 'Actions';
	label: string;
	context?: string;
	metric?: string;
	icon: ReactNode;
	shortcut?: ShortcutId;
	href?: string;
}

interface CommandPaletteProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	databases: Database[];
	canCreate: boolean;
	isAccountAdmin: boolean;
}

const MAX_COLLECTIONS = 50;

function tokenize(query: string): string[] {
	return query
		.toLowerCase()
		.split(/[\s/]+/)
		.filter(Boolean);
}

function score(tokens: string[], name: string, haystack: string): number {
	if (!tokens.every(token => haystack.includes(token))) return -1;
	const last = tokens[tokens.length - 1];
	if (name === last) return 3;
	if (name.startsWith(last)) return 2;
	return name.includes(last) ? 1 : 0;
}

export function CommandPalette({ open, onOpenChange, ...props }: CommandPaletteProps) {
	return (
		<DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="bg-scrim fixed inset-0 z-50" />
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className="bg-popover text-popover-foreground border-popup-border fixed top-[12vh] left-1/2 z-50 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden rounded-lg border shadow-lg outline-hidden"
				>
					<DialogPrimitive.Title className="sr-only">
						Go to a collection or action
					</DialogPrimitive.Title>
					<PaletteBody close={() => onOpenChange(false)} {...props} />
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}

function PaletteBody({
	close,
	databases,
	canCreate,
	isAccountAdmin,
}: Omit<CommandPaletteProps, 'open' | 'onOpenChange'> & { close: () => void }) {
	const router = useRouter();
	const mac = useIsMac();
	const listId = useId();
	const listRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState(0);
	const recent = useRecentCollections(databases);

	const tokens = tokenize(query);

	const actions: PaletteItem[] = [
		...(canCreate
			? [
					{
						key: 'create',
						label: 'Create a database or collection',
						icon: <PlusIcon />,
						shortcut: 'create' as const,
					},
				]
			: []),
		{ key: 'refresh', label: 'Reload the data', icon: <RotateCwIcon />, shortcut: 'refresh' },
		{
			key: 'theme',
			label: 'Switch between light and dark',
			icon: <SunMoonIcon />,
			shortcut: 'toggle-theme',
		},
		{
			key: 'sidebar',
			label: 'Show or hide the sidebar',
			icon: <PanelLeftIcon />,
			shortcut: 'toggle-sidebar',
		},
		{ key: 'help', label: 'Keyboard shortcuts', icon: <KeyboardIcon />, shortcut: 'help' },
		...(isAccountAdmin
			? [
					{
						key: 'admin',
						label: 'Accounts and settings',
						icon: <SettingsIcon />,
						href: '/admin',
					},
				]
			: []),
		{ key: 'about', label: 'About Mongonaut', icon: <InfoIcon />, href: '/about' },
	].map(action => ({ ...action, group: 'Actions' }) as PaletteItem);

	const toItem =
		(group: PaletteItem['group']) =>
		(entry: (typeof recent)[number]): PaletteItem => ({
			key: `${group}:${entry.href}`,
			group,
			label: entry.collection.name,
			context: entry.database,
			metric:
				entry.collection.documentCount === null
					? undefined
					: formatCount(entry.collection.documentCount),
			icon: <TableIcon />,
			href: entry.href,
		});

	const items: PaletteItem[] =
		tokens.length === 0
			? [
					...recent.map(toItem('Recent')),
					...listCollections(databases)
						.filter(entry => !recent.some(candidate => candidate.href === entry.href))
						.slice(0, MAX_COLLECTIONS)
						.map(toItem('Collections')),
					...actions,
				]
			: [
					...listCollections(databases)
						.map(entry => ({
							entry,
							rank: score(
								tokens,
								entry.collection.name.toLowerCase(),
								`${entry.database}/${entry.collection.name}`.toLowerCase(),
							),
						}))
						.filter(({ rank }) => rank >= 0)
						.sort((a, b) => b.rank - a.rank)
						.slice(0, MAX_COLLECTIONS)
						.map(({ entry }) => toItem('Collections')(entry)),
					...actions.filter(action =>
						tokens.every(token => action.label.toLowerCase().includes(token)),
					),
				];

	const active = Math.min(activeIndex, items.length - 1);

	useEffect(() => {
		listRef.current
			?.querySelector('[aria-selected="true"]')
			?.scrollIntoView({ block: active === 0 ? 'end' : 'nearest' });
	}, [active]);

	const choose = (item: PaletteItem | undefined, newTab: boolean) => {
		if (!item) return;
		close();
		if (item.href) {
			if (newTab) window.open(item.href, '_blank', 'noopener');
			else router.push(item.href);
		} else if (item.shortcut) {
			runShortcut(item.shortcut);
		}
	};

	const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.nativeEvent.isComposing) return;
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault();
			if (items.length === 0) return;
			const step = event.key === 'ArrowDown' ? 1 : -1;
			setActiveIndex((active + step + items.length) % items.length);
		} else if (event.key === 'Enter') {
			event.preventDefault();
			choose(items[active], mac ? event.metaKey : event.ctrlKey);
		}
	};

	return (
		<>
			<div className="flex shrink-0 items-center gap-2 border-b px-3.5">
				<SearchIcon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
				<input
					autoFocus
					role="combobox"
					aria-expanded="true"
					aria-controls={listId}
					aria-activedescendant={items.length > 0 ? `${listId}-${active}` : undefined}
					aria-label="Go to a collection or action"
					autoComplete="off"
					spellCheck={false}
					placeholder="Go to a collection or action..."
					value={query}
					onChange={event => {
						setQuery(event.target.value);
						setActiveIndex(0);
					}}
					onKeyDown={onKeyDown}
					className="placeholder:text-muted-foreground h-11 min-w-0 flex-1 bg-transparent text-base outline-hidden md:text-sm"
				/>
			</div>
			<div
				ref={listRef}
				id={listId}
				// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- options hold icons and metrics
				role="listbox"
				aria-label="Results"
				className="min-h-0 flex-1 overflow-y-auto p-1.5"
			>
				{items.length === 0 && (
					<p className="text-muted-foreground px-2 py-6 text-center text-sm">No matches</p>
				)}
				{items.map((item, index) => {
					const isActive = index === active;
					const secondary = isActive ? 'text-selection-secondary' : 'text-muted-foreground';
					return (
						<div key={item.key} role="presentation">
							{item.group !== items[index - 1]?.group && (
								<div
									role="presentation"
									className={cn(
										'text-muted-foreground px-2 pb-1 text-xs',
										index === 0 ? 'pt-0.5' : 'mt-2 border-t pt-2.5',
									)}
								>
									{item.group}
								</div>
							)}
							<button
								type="button"
								tabIndex={-1}
								id={`${listId}-${index}`}
								// oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- focus stays in the field
								role="option"
								aria-selected={isActive}
								onPointerMove={() => setActiveIndex(index)}
								onClick={event => choose(item, mac ? event.metaKey : event.ctrlKey)}
								className={cn(
									'flex w-full min-h-(--mgn-height-row) cursor-default text-left items-center gap-1.5 rounded-md px-2 text-sm select-none md:min-h-7',
									isActive && 'bg-selection',
								)}
							>
								<span className={cn('[&>svg]:size-4', secondary)} aria-hidden="true">
									{item.icon}
								</span>
								<span className="truncate">{item.label}</span>
								{item.context && (
									<span className={cn('truncate text-xs', secondary)}>{item.context}</span>
								)}
								<span className={cn('ml-auto shrink-0 pl-2 text-xs tabular-nums', secondary)}>
									{item.shortcut ? (
										<ShortcutKeys id={item.shortcut} className="text-inherit" />
									) : (
										item.metric
									)}
								</span>
							</button>
						</div>
					);
				})}
			</div>

			<div className="bg-chrome text-muted-foreground hidden shrink-0 items-center gap-4 border-t px-3.5 py-2 text-xs md:flex">
				<span className="flex items-center gap-1.5">
					<Kbd>↑</Kbd>
					<Kbd>↓</Kbd>
					move
				</span>
				<span className="flex items-center gap-1.5">
					<Kbd>{formatCombo('enter', mac ?? false)}</Kbd>
					open
				</span>
				<span className="flex items-center gap-1.5">
					<Kbd>{formatCombo('mod+enter', mac ?? false)}</Kbd>
					open in a new tab
				</span>
				<span className="ml-auto flex items-center gap-1.5">
					<Kbd>Esc</Kbd>
					close
				</span>
			</div>
		</>
	);
}
