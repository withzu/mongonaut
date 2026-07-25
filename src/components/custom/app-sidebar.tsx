'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
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
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import type { Database } from '@/lib/types/mongo';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { CreateItemDialog } from '@/components/custom/create-item-dialog';
import { SidebarFooterActions } from '@/components/custom/sidebar-footer-actions';
import { CollectionContextMenu } from '@/components/custom/collection-actions';
import { DatabaseContextMenu } from '@/components/custom/database-context-menu';
import { cn, formatBytes, formatCount } from '@/lib/utils';
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
	} catch {
		// Storage can be unavailable in private browsing modes.
	}
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
		<div className="flex items-center h-14 px-4 backdrop-blur-sm bg-background/80 border-b">
			<SidebarTrigger className="size-9" />

			<div className="ml-3 flex items-center gap-2 flex-grow">
				<Image
					src="/images/logo.svg"
					alt=""
					aria-hidden="true"
					className="dark:invert"
					width={24}
					height={24}
					priority
				/>
				<span className="font-bold">Mongonaut</span>
			</div>

			{globalReadonly && <ReadOnlyBadge />}
		</div>
	);
}

export function ReadOnlyBadge() {
	return (
		<span className="text-primary-foreground rounded-full text-xs bg-primary px-2.5 py-0.5">
			Read-only
		</span>
	);
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
						<DatabaseIcon size={12} className="text-muted-foreground my-auto" />
						{database}
					</BreadcrumbPage>
				</BreadcrumbItem>

				{collection && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage className="flex gap-2">
								<TableIcon size={12} className="text-muted-foreground my-auto" />
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
		<div className="grid gap-2 px-2 border-b pb-3 text-xs">
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

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 md:hidden">
				<div className="flex flex-col">
					<MobileHeader globalReadonly={globalReadonly} />

					<div className="flex items-center h-12 px-4 backdrop-blur-sm bg-background/80 border-b">
						<div className="w-full overflow-x-auto no-scrollbar">
							<MobileBreadcrumb />
						</div>
					</div>
				</div>
			</div>

			<Sidebar side="left" collapsible="offcanvas">
				<div className="flex h-11 shrink-0 items-center px-2">
					<Link href="/" className="flex items-center gap-2">
						<Image
							src="/images/logo.svg"
							alt=""
							aria-hidden="true"
							className="dark:invert"
							width={30}
							height={30}
							priority
						/>
						<span className="text-sm font-semibold tracking-tight">Mongonaut</span>
					</Link>
				</div>

				<SidebarHeader>
					<div className="relative mx-1.5">
						<Input
							id="sidebar-search"
							type="search"
							aria-label="Search databases and collections"
							placeholder="Search databases & collections..."
							className="bg-background dark:bg-background h-10 pl-8 md:h-8"
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<div className="absolute left-0 top-0 p-2.5">
							<SearchIcon size={14} className="text-muted-foreground" aria-hidden="true" />
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent className="gap-4 md:gap-2">
					<SidebarGroup>
						<SidebarGroupLabel className="flex justify-between items-center">
							Databases
							{canCreateDatabase && (
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									aria-label="Create database or collection"
									onClick={() => setCreateOpen(true)}
								>
									<PlusIcon size={14} />
								</Button>
							)}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-2 md:gap-1">
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
									<SidebarMenuItem className="border border-dashed px-2 py-4 rounded">
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

				<SidebarFooter className="p-4 md:p-2">
					{serverInfo && <ServerFacts serverInfo={serverInfo} totalSize={totalSize} />}

					<SidebarFooterActions readOnly={globalReadonly} isAccountAdmin={isAccountAdmin} />
				</SidebarFooter>
			</Sidebar>

			<CreateItemDialog open={isCreateOpen} onOpenChange={setCreateOpen} databases={databases} />
		</>
	);
}

export function CollapsibleDatabaseSidebarItem({
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
						<SidebarMenuButton className="font-medium">
							<ChevronRightIcon className="text-muted-foreground transition-transform" />
							<DatabaseIcon className="text-muted-foreground" />
							<span className="truncate">{database.name}</span>
							<span className="text-muted-foreground ml-auto text-[11px] tabular-nums">
								{formatBytes(database.totalSize)}
							</span>
						</SidebarMenuButton>
					</CollapsibleTrigger>
				</DatabaseContextMenu>

				<CollapsibleContent>
					<SidebarMenuSub>
						{filteredCollections.map(collection => {
							const href = `/${encodeURIComponent(database.name)}/${encodeURIComponent(collection.name)}`;
							const isActive = currentPath === `/${database.name}/${collection.name}`;
							return (
								<CollectionContextMenu
									key={collection.name}
									database={database.name}
									collection={collection.name}
									readOnly={!collection.canWrite}
								>
									{/* A real link so collections can be opened in a new tab. */}
									<SidebarMenuButton isActive={isActive} asChild>
										<Link href={href}>
											<TableIcon className={isActive ? '' : 'text-muted-foreground'} />
											<span className="truncate">{collection.name}</span>
											<span
												className={cn(
													'ml-auto flex shrink-0 items-center gap-1 text-[11px] tabular-nums',
													isActive ? 'text-sidebar-accent-foreground' : 'text-muted-foreground',
												)}
											>
												{collection.documentCount !== null && (
													<>
														<span>{formatCount(collection.documentCount)}</span>
														<span aria-hidden="true" className="opacity-60">
															/
														</span>
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
