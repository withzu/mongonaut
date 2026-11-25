'use client';

import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRightIcon, DatabaseIcon, PlusIcon, SearchIcon, TableIcon } from 'lucide-react';
import type { Document } from 'mongodb';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarTrigger,
	useSidebar,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShortcutKeys } from '@/components/ui/kbd';
import { Input } from '@/components/ui/input';
import type { Database } from '@/lib/types/mongo';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { LogoMark } from '@/components/custom/logo-mark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateItemDialog } from '@/components/custom/create-item-dialog';
import { ShortcutTooltip } from '@/components/custom/shortcut-tooltip';
import { SidebarFooterActions } from '@/components/custom/sidebar-footer-actions';
import { CollectionContextMenu } from '@/components/custom/collection-actions';
import { DatabaseContextMenu } from '@/components/custom/database-context-menu';
import { cn, formatBytes, formatCount } from '@/lib/utils';
import { useShortcut } from '@/hooks/use-shortcut';
import { collectionHref } from '@/hooks/use-recent-collections';
import { useIsHydrated } from '@/hooks/use-is-hydrated';

const OPEN_DATABASES_KEY = 'openedTables';

function readOpenDatabases(): string[] {
	try {
		const saved = localStorage.getItem(OPEN_DATABASES_KEY);
		if (!saved) return [];
		const parsed = JSON.parse(saved);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((entry): entry is string => typeof entry === 'string');
	} catch {
		localStorage.removeItem(OPEN_DATABASES_KEY);
		return [];
	}
}

function writeOpenDatabases(names: string[]): void {
	try {
		localStorage.setItem(OPEN_DATABASES_KEY, JSON.stringify(names));
	} catch {}
}

function handleTreeKeys(event: KeyboardEvent<HTMLElement>): void {
	if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
	if (!(event.target instanceof HTMLElement) || !event.currentTarget.contains(event.target)) return;

	const rows = [
		...event.currentTarget.querySelectorAll<HTMLElement>('[data-sidebar="menu-button"]'),
	];
	const index = rows.indexOf(event.target);
	if (index === -1) return;

	const row = rows[index];
	const expanded = row.getAttribute('aria-expanded');
	const focusParent = () =>
		rows
			.slice(0, index)
			.findLast(candidate => candidate.hasAttribute('aria-expanded'))
			?.focus();

	switch (event.key) {
		case 'ArrowDown':
			rows[index + 1]?.focus();
			break;
		case 'ArrowUp':
			if (index === 0) document.getElementById('sidebar-search')?.focus();
			else rows[index - 1].focus();
			break;
		case 'Home':
			rows[0].focus();
			break;
		case 'End':
			rows[rows.length - 1].focus();
			break;
		case 'ArrowRight':
			if (expanded === 'false') row.click();
			else if (expanded === 'true') rows[index + 1]?.focus();
			break;
		case 'ArrowLeft':
			if (expanded === 'true') row.click();
			else if (expanded === null) focusParent();
			break;
		default:
			return;
	}
	event.preventDefault();
}

interface AppSidebarProps {
	databases: Database[];
	totalSize?: number;
	serverInfo?: Document;
	isAccountAdmin?: boolean;
	canCreateDatabase?: boolean;
	globalReadonly?: boolean;
	loading?: boolean;
}

function MobileHeader({ globalReadonly }: { globalReadonly?: boolean }) {
	return (
		<div className="bg-sidebar flex h-14 items-center border-b px-4">
			<SidebarTrigger />

			<div className="ml-3 flex items-center gap-2 flex-grow">
				<LogoMark priority />
				<span className="font-semibold">Mongonaut</span>
			</div>

			{globalReadonly && <ReadOnlyBadge />}
		</div>
	);
}

function ReadOnlyBadge() {
	return <Badge>Read-only</Badge>;
}

function MobileBreadcrumb() {
	const pathname = usePathname();
	const pathSegments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
	const database = pathSegments[0];
	const collection = pathSegments[1];

	if (!database) return null;

	return (
		<Breadcrumb>
			<BreadcrumbList>
				<BreadcrumbItem>
					<BreadcrumbPage className="flex gap-2">
						<DatabaseIcon size={16} className="text-muted-foreground my-auto" />
						{database}
					</BreadcrumbPage>
				</BreadcrumbItem>

				{collection && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-2">
								<TableIcon size={16} className="text-muted-foreground my-auto" />
								{collection}
							</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

function ServerFacts({ serverInfo, totalSize }: { serverInfo: Document; totalSize?: number }) {
	const facts: { label: string; value: string }[] = [];

	if (typeof totalSize === 'number') {
		facts.push({ label: 'Used Space', value: formatBytes(totalSize) });
	}
	if (typeof serverInfo.version === 'string') {
		facts.push({ label: 'Mongo Version', value: serverInfo.version });
	}
	const distmod = (serverInfo.buildEnvironment as Document | undefined)?.distmod;
	if (typeof distmod === 'string' && distmod) {
		facts.push({ label: 'Environment', value: distmod });
	}
	if (typeof serverInfo.maxBsonObjectSize === 'number') {
		facts.push({ label: 'Max. Bson Size', value: formatBytes(serverInfo.maxBsonObjectSize) });
	}

	if (facts.length === 0) return null;

	return (
		<div className="grid gap-2 pb-1 text-xs">
			<dl className="flex justify-between gap-2">
				<div className="text-muted-foreground">
					{facts.map(fact => (
						<dt key={fact.label}>{fact.label}</dt>
					))}
				</div>
				<div className="truncate text-right">
					{facts.map(fact => (
						<dd key={fact.label}>{fact.value}</dd>
					))}
				</div>
			</dl>
		</div>
	);
}

export function AppSidebar({
	databases,
	totalSize,
	serverInfo,
	isAccountAdmin = false,
	canCreateDatabase = false,
	globalReadonly = false,
	loading = false,
}: AppSidebarProps) {
	const [search, setSearch] = useState('');
	const [isCreateOpen, setCreateOpen] = useState(false);
	const hydrated = useIsHydrated();
	const router = useRouter();
	const treeRef = useRef<HTMLUListElement>(null);
	const { setOpen, setOpenMobile, isMobile } = useSidebar();

	useShortcut('create', () => setCreateOpen(true), canCreateDatabase && !globalReadonly);
	useShortcut('search', () => {
		if (isMobile) setOpenMobile(true);
		else setOpen(true);
		setTimeout(() => {
			const field = document.getElementById('sidebar-search');
			if (field instanceof HTMLInputElement) {
				field.focus();
				field.select();
			}
		});
	});

	const [toggled, setToggled] = useState<Record<string, boolean>>({});
	const persistedOpen = useMemo(() => (hydrated ? readOpenDatabases() : []), [hydrated]);

	const isDatabaseOpen = (name: string) => toggled[name] ?? persistedOpen.includes(name);

	const toggleDatabase = (name: string) => {
		const next = { ...toggled, [name]: !isDatabaseOpen(name) };
		setToggled(next);
		writeOpenDatabases(
			databases
				.map(database => database.name)
				.filter(candidate => next[candidate] ?? persistedOpen.includes(candidate)),
		);
	};

	const searchTerm = search.trim().toLowerCase();
	const filteredDatabases = databases.filter(
		database =>
			database.name.toLowerCase().includes(searchTerm) ||
			database.collections.some(collection => collection.name.toLowerCase().includes(searchTerm)),
	);

	const handleSearchKeys = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.nativeEvent.isComposing) return;
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			treeRef.current?.querySelector<HTMLElement>('[data-sidebar="menu-button"]')?.focus();
		} else if (event.key === 'Enter' && searchTerm) {
			const matches = filteredDatabases.flatMap(database =>
				database.collections.map(collection => ({ database, collection })),
			);
			const match =
				matches.find(({ collection }) => collection.name.toLowerCase().includes(searchTerm)) ??
				matches[0];
			if (match) {
				event.currentTarget.blur();
				setOpenMobile(false);
				router.push(collectionHref(match.database.name, match.collection.name));
			}
		} else if (event.key === 'Escape' && !isMobile) {
			if (search) setSearch('');
			else event.currentTarget.blur();
		}
	};

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 md:hidden">
				<div className="flex flex-col">
					<MobileHeader globalReadonly={globalReadonly} />

					<div className="bg-sidebar flex h-12 items-center border-b px-4">
						<div className="w-full overflow-x-auto no-scrollbar">
							<MobileBreadcrumb />
						</div>
					</div>
				</div>
			</div>

			<Sidebar side="left" collapsible="offcanvas">
				<div className="flex h-(--mgn-height-header) shrink-0 items-center px-4">
					<Link href="/" className="focus-row flex items-center gap-1.5 rounded-md">
						<span className="flex w-4 justify-center">
							<LogoMark priority />
						</span>
						<span className="text-sm font-semibold">Mongonaut</span>
					</Link>
				</div>

				<SidebarHeader className="pt-0">
					<div className="relative">
						<Input
							id="sidebar-search"
							type="search"
							aria-label="Search databases and collections"
							placeholder="Search databases & collections..."
							className="peer pr-8 pl-7.5 [&::-webkit-search-cancel-button]:hidden"
							value={search}
							onChange={e => setSearch(e.target.value)}
							onKeyDown={handleSearchKeys}
							aria-keyshortcuts="/"
						/>
						<div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
							<SearchIcon size={16} className="text-muted-foreground" aria-hidden="true" />
						</div>
						<div className="pointer-events-none absolute inset-y-0 right-1 flex items-center peer-focus:hidden">
							<ShortcutKeys id="search" />
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupLabel className="flex justify-between items-center">
							Databases
							{canCreateDatabase && (
								<ShortcutTooltip id="create">
									<Button
										variant="ghost"
										size="icon"
										className="-mr-1.5"
										aria-label="Create database or collection"
										onClick={() => setCreateOpen(true)}
									>
										<PlusIcon size={16} />
									</Button>
								</ShortcutTooltip>
							)}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu ref={treeRef} onKeyDown={handleTreeKeys}>
								{loading && databases.length === 0 ? (
									<>
										<SidebarMenuSkeleton showIcon />
										<SidebarMenuSkeleton showIcon />
										<SidebarMenuSkeleton showIcon />
									</>
								) : filteredDatabases.length > 0 ? (
									filteredDatabases.map(database => (
										<CollapsibleDatabaseSidebarItem
											key={database.name}
											database={database}
											databases={databases}
											search={search}
											canCreateDatabase={canCreateDatabase}
											open={isDatabaseOpen(database.name) || searchTerm.length > 0}
											onOpenChangeAction={() => toggleDatabase(database.name)}
										/>
									))
								) : (
									<SidebarMenuItem className="rounded-lg border border-dashed p-3">
										<p className="text-muted-foreground text-xs">
											{databases.length === 0
												? 'No databases visible for this account'
												: 'No matches for this search'}
										</p>
									</SidebarMenuItem>
								)}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="border-t px-4 py-3">
					{serverInfo && <ServerFacts serverInfo={serverInfo} totalSize={totalSize} />}

					<SidebarFooterActions readOnly={globalReadonly} isAccountAdmin={isAccountAdmin} />
				</SidebarFooter>
			</Sidebar>

			<CreateItemDialog open={isCreateOpen} onOpenChange={setCreateOpen} databases={databases} />
		</>
	);
}

function CollapsibleDatabaseSidebarItem({
	database,
	databases,
	search,
	canCreateDatabase,
	open,
	onOpenChangeAction,
}: {
	database: Database;
	databases: Database[];
	search: string;
	canCreateDatabase?: boolean;
	open?: boolean;
	onOpenChangeAction?: (open: boolean) => void;
}) {
	const pathname = usePathname();

	const filteredCollections = useMemo(() => {
		const searchTerm = search.trim().toLowerCase();
		return database.collections.filter(
			collection =>
				collection.name.toLowerCase().includes(searchTerm) ||
				database.name.toLowerCase().includes(searchTerm),
		);
	}, [database.collections, database.name, search]);

	const currentPath = decodeURIComponent(pathname);

	return (
		<SidebarMenuItem>
			<Collapsible
				open={open}
				onOpenChange={onOpenChangeAction}
				className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
			>
				<DatabaseContextMenu
					database={database.name}
					databases={databases}
					readOnly={!database.canWrite}
					canDropDatabase={canCreateDatabase}
				>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton className="group/row">
							<ChevronRightIcon className="text-muted-foreground transition-transform" />
							<DatabaseIcon className="text-muted-foreground" />
							<span className="truncate">{database.name}</span>
							<span className="text-muted-foreground group-hover/row:text-selection-secondary ml-auto text-xs tabular-nums">
								{formatBytes(database.totalSize)}
							</span>
						</SidebarMenuButton>
					</CollapsibleTrigger>
				</DatabaseContextMenu>

				<CollapsibleContent>
					<SidebarMenuSub>
						{filteredCollections.map(collection => {
							const href = collectionHref(database.name, collection.name);
							const isActive = currentPath === `/${database.name}/${collection.name}`;
							return (
								<CollectionContextMenu
									key={collection.name}
									database={database.name}
									collection={collection.name}
									readOnly={!collection.canWrite}
								>
									{/* A real link so collections can be opened in a new tab. */}
									<SidebarMenuButton isActive={isActive} className="group/row pl-11.5" asChild>
										<Link href={href}>
											<TableIcon
												className={isActive ? 'text-selection-secondary' : 'text-muted-foreground'}
											/>
											<span className="truncate">{collection.name}</span>
											<span
												className={cn(
													'ml-auto flex shrink-0 items-center gap-1 text-xs tabular-nums',
													isActive
														? 'text-selection-secondary'
														: 'text-muted-foreground group-hover/row:text-selection-secondary',
												)}
											>
												{collection.documentCount !== null && (
													<>
														<span>{formatCount(collection.documentCount)}</span>
														<span aria-hidden="true">/</span>
													</>
												)}
												<span>{formatBytes(collection.totalSize)}</span>
											</span>
										</Link>
									</SidebarMenuButton>
								</CollectionContextMenu>
							);
						})}
					</SidebarMenuSub>
				</CollapsibleContent>
			</Collapsible>
		</SidebarMenuItem>
	);
}
