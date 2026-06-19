'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import prettyBytes from 'next/dist/lib/pretty-bytes';
import { usePathname, useRouter } from 'next/navigation';
import {
	ChevronRightIcon,
	DatabaseIcon,
	MenuIcon,
	PlusIcon,
	SearchIcon,
	TableIcon,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface AppSidebarProps {
	databases: Database[];
	totalSize?: number;
	serverInfo?: Document;
	readOnly?: boolean;
	loading?: boolean;
}

function MobileHeader({ readOnly }: { readOnly?: boolean }) {
	return (
		<div className="flex items-center h-14 px-4 backdrop-blur-sm bg-background/80 border-b">
			<SidebarTrigger>
				<button className="rounded-lg p-2 hover:bg-accent/50 active:bg-accent/70 transition-colors">
					<MenuIcon className="h-5 w-5 text-muted-foreground" />
				</button>
			</SidebarTrigger>

			<div className="ml-3 flex items-center gap-2 flex-grow">
				<Image
					src="/images/logo.svg"
					alt="Mongonaut"
					className="dark:invert"
					width={24}
					height={24}
					priority
				/>
				<span className="font-bold">Mongonaut</span>
			</div>

			{readOnly && (
				<span className="text-primary-foreground rounded-full text-xs bg-primary px-2.5 py-0.5">
					Read-only
				</span>
			)}
		</div>
	);
}

function MobileBreadcrumb() {
	const pathname = usePathname();
	const pathSegments = pathname.split('/').filter(Boolean);
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

export function AppSidebar({
	databases,
	totalSize,
	serverInfo,
	readOnly,
	loading = false,
}: AppSidebarProps) {
	const [search, setSearch] = useState('');
	const [openedTables, setOpenedTables] = useState<string[]>(() => {
		const saved = typeof window !== 'undefined' ? localStorage.getItem('openedTables') : null;
		return saved ? JSON.parse(saved) : [];
	});
	const [isCreateOpen, setCreateOpen] = useState(false);

	useEffect(() => {
		localStorage.setItem('openedTables', JSON.stringify(openedTables));
	}, [openedTables]);

	const toggleTable = (name: string) => {
		setOpenedTables(prev => (prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]));
	};

	const isTableOpen = (name: string) => openedTables.includes(name);

	const filteredDatabases = databases.filter(database => {
		const searchTerm = search.trim().toLowerCase();
		return (
			database.name.toLowerCase().includes(searchTerm) ||
			database.collections.some(collection => collection.name.toLowerCase().includes(searchTerm))
		);
	});

	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 md:hidden">
				<div className="flex flex-col">
					<MobileHeader readOnly={readOnly} />

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
							alt="Mongonaut"
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
							placeholder="Search databases & collections..."
							className="bg-background dark:bg-background h-10 pl-8 md:h-8"
							value={search}
							onChange={e => setSearch(e.target.value)}
						/>
						<div className="absolute left-0 top-0 p-2.5">
							<SearchIcon size={14} className="text-muted-foreground" />
						</div>
					</div>
				</SidebarHeader>

				<SidebarContent className="gap-4 md:gap-2">
					<SidebarGroup>
						<SidebarGroupLabel className="flex justify-between items-center">
							Databases
							{!readOnly && (
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => setCreateOpen(true)}
								>
									<PlusIcon size={14} />
								</Button>
							)}
						</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu className="gap-2 md:gap-1">
								{loading ? (
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
											readOnly={readOnly}
											open={isTableOpen(database.name) || search.trim().length > 0}
											onOpenChangeAction={() => toggleTable(database.name)}
										/>
									))
								) : (
									<SidebarMenuItem className="border border-dashed px-2 py-4 rounded">
										<p className="text-muted-foreground text-xs">No databases found</p>
									</SidebarMenuItem>
								)}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>

				<SidebarFooter className="p-4 md:p-2">
					{serverInfo && (
						<div className="grid gap-2 px-2 border-b pb-3 text-xs">
							<div className="flex justify-between gap-2">
								<div className="text-muted-foreground">
									{totalSize && <p>Used Space</p>}
									<p>Mongo Version</p>
									<p>Environment</p>
									<p>Max. Bson Size</p>
								</div>
								<div className="truncate">
									{totalSize && <p>{prettyBytes(totalSize)}</p>}
									<p>{serverInfo['version']}</p>
									<p>{serverInfo['buildEnvironment']['distmod']}</p>
									<p>{prettyBytes(serverInfo['maxBsonObjectSize'])}</p>
								</div>
							</div>
						</div>
					)}

					<SidebarFooterActions readOnly={readOnly} />
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
	readOnly,
	open,
	onOpenChangeAction,
}: {
	database: Database;
	databases: Database[];
	search: string;
	readOnly?: boolean;
	open?: boolean;
	onOpenChangeAction?: (open: boolean) => void;
}) {
	const router = useRouter();
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
				<DatabaseContextMenu database={database.name} databases={databases} readOnly={readOnly}>
					<CollapsibleTrigger asChild>
						<SidebarMenuButton className="font-medium">
							<ChevronRightIcon className="text-muted-foreground transition-transform" />
							<DatabaseIcon className="text-muted-foreground" />
							<span className="truncate">{database.name}</span>
							<span className="text-muted-foreground/60 ml-auto text-[11px] tabular-nums">
								{prettyBytes(database.totalSize)}
							</span>
						</SidebarMenuButton>
					</CollapsibleTrigger>
				</DatabaseContextMenu>

				<CollapsibleContent>
					<SidebarMenuSub>
						{filteredCollections.map(collection => {
							const isActive = currentPath === `/${database.name}/${collection.name}`;
							return (
								<CollectionContextMenu
									key={collection.name}
									database={database.name}
									collection={collection.name}
									readOnly={readOnly}
								>
									<SidebarMenuButton
										isActive={isActive}
										onClick={() => router.push(`/${database.name}/${collection.name}`)}
										className="cursor-pointer"
									>
										<TableIcon className={isActive ? '' : 'text-muted-foreground'} />
										<span className="truncate">{collection.name}</span>
										<div
											className={cn(
												'ml-auto flex shrink-0 items-center gap-1 text-[11px] tabular-nums',
												isActive ? 'text-sidebar-accent-foreground/75' : 'text-muted-foreground/60',
											)}
										>
											<span>{collection.documentCount}</span>
											<span className="opacity-40">/</span>
											<span>{prettyBytes(collection.totalSize)}</span>
										</div>
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
