'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, VariantProps } from 'class-variance-authority';
import { PanelLeftIcon } from 'lucide-react';

import { useShortcut } from '@/hooks/use-shortcut';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SIDEBAR_WIDTH = '16rem';
const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';

type SidebarContextProps = {
	state: 'expanded' | 'collapsed';
	open: boolean;
	setOpen: (open: boolean) => void;
	openMobile: boolean;
	setOpenMobile: (open: boolean) => void;
	isMobile: boolean;
	toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
	const context = React.useContext(SidebarContext);
	if (!context) {
		throw new Error('useSidebar must be used within a SidebarProvider.');
	}

	return context;
}

function SidebarProvider({
	defaultOpen = true,
	open: openProp,
	onOpenChange: setOpenProp,
	className,
	style,
	children,
	...props
}: React.ComponentProps<'div'> & {
	defaultOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	const isMobile = useIsMobile();
	const [openMobile, setOpenMobile] = React.useState(false);

	const [_open, _setOpen] = React.useState(defaultOpen);
	const open = openProp ?? _open;
	const setOpen = React.useCallback(
		(value: boolean | ((value: boolean) => boolean)) => {
			const openState = typeof value === 'function' ? value(open) : value;
			if (setOpenProp) {
				setOpenProp(openState);
			} else {
				_setOpen(openState);
			}
		},
		[setOpenProp, open],
	);

	const toggleSidebar = React.useCallback(() => {
		return isMobile ? setOpenMobile(open => !open) : setOpen(open => !open);
	}, [isMobile, setOpen, setOpenMobile]);

	useShortcut('toggle-sidebar', toggleSidebar);

	const state = open ? 'expanded' : 'collapsed';

	const contextValue = React.useMemo<SidebarContextProps>(
		() => ({
			state,
			open,
			setOpen,
			isMobile,
			openMobile,
			setOpenMobile,
			toggleSidebar,
		}),
		[state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
	);

	return (
		<SidebarContext.Provider value={contextValue}>
			<TooltipProvider delayDuration={0}>
				<div
					data-slot="sidebar-wrapper"
					style={
						{
							'--sidebar-width': SIDEBAR_WIDTH,
							'--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
							...style,
						} as React.CSSProperties
					}
					className={cn(
						'group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full',
						className,
					)}
					{...props}
				>
					{children}
				</div>
			</TooltipProvider>
		</SidebarContext.Provider>
	);
}

function Sidebar({
	side = 'left',
	variant = 'sidebar',
	collapsible = 'offcanvas',
	className,
	children,
	...props
}: React.ComponentProps<'div'> & {
	side?: 'left' | 'right';
	variant?: 'sidebar' | 'floating' | 'inset';
	collapsible?: 'offcanvas' | 'icon' | 'none';
}) {
	const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

	if (collapsible === 'none') {
		return (
			<div
				data-slot="sidebar"
				className={cn(
					'bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		);
	}

	if (isMobile) {
		return (
			<Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
				<SheetContent
					data-sidebar="sidebar"
					data-slot="sidebar"
					data-mobile="true"
					className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
					style={
						{
							'--sidebar-width': SIDEBAR_WIDTH_MOBILE,
						} as React.CSSProperties
					}
					side={side}
				>
					<SheetHeader className="sr-only">
						<SheetTitle>Sidebar</SheetTitle>
						<SheetDescription>Displays the mobile sidebar.</SheetDescription>
					</SheetHeader>
					<div className="flex h-full w-full flex-col">{children}</div>
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<div
			className="group peer text-sidebar-foreground hidden md:block"
			data-state={state}
			data-collapsible={state === 'collapsed' ? collapsible : ''}
			data-variant={variant}
			data-side={side}
			data-slot="sidebar"
		>
			<div
				data-slot="sidebar-gap"
				className={cn(
					'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
					'group-data-[collapsible=offcanvas]:w-0',
					'group-data-[side=right]:rotate-180',
					variant === 'floating' || variant === 'inset'
						? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
						: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
				)}
			/>
			<div
				data-slot="sidebar-container"
				className={cn(
					'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
					side === 'left'
						? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
						: 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
					variant === 'floating' || variant === 'inset'
						? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
						: 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)',
					className,
				)}
				{...props}
			>
				<div
					data-sidebar="sidebar"
					data-slot="sidebar-inner"
					className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
				>
					{children}
				</div>
			</div>
		</div>
	);
}

function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
	const { toggleSidebar } = useSidebar();

	return (
		<Button
			data-sidebar="trigger"
			data-slot="sidebar-trigger"
			variant="ghost"
			size="icon"
			className={cn('size-(--mgn-height-toolbar)', className)}
			onClick={event => {
				onClick?.(event);
				toggleSidebar();
			}}
			{...props}
		>
			<PanelLeftIcon />
			<span className="sr-only">Toggle Sidebar</span>
		</Button>
	);
}

function SidebarInset({ className, ...props }: React.ComponentProps<'main'>) {
	return (
		<main
			data-slot="sidebar-inset"
			className={cn(
				'bg-background relative flex w-full flex-1 flex-col',
				'md:border-region md:border-l',
				'md:peer-data-[collapsible=offcanvas]:border-l-0',
				'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
				className,
			)}
			{...props}
		/>
	);
}

function SidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-header"
			data-sidebar="header"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function SidebarFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-footer"
			data-sidebar="footer"
			className={cn('flex flex-col gap-2 p-2', className)}
			{...props}
		/>
	);
}

function SidebarContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-content"
			data-sidebar="content"
			className={cn(
				'flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden',
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group"
			data-sidebar="group"
			className={cn('relative flex w-full min-w-0 flex-col p-2', className)}
			{...props}
		/>
	);
}

function SidebarGroupLabel({
	className,
	asChild = false,
	...props
}: React.ComponentProps<'div'> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'div';

	return (
		<Comp
			data-slot="sidebar-group-label"
			data-sidebar="group-label"
			className={cn(
				'focus-row text-sidebar-foreground flex h-8 shrink-0 items-center rounded-md px-2 text-sm font-semibold transition-[margin,opacity] duration-200 ease-linear [&>svg]:size-4 [&>svg]:shrink-0',
				'group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0',
				className,
			)}
			{...props}
		/>
	);
}

function SidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="sidebar-group-content"
			data-sidebar="group-content"
			className={cn('w-full text-sm', className)}
			{...props}
		/>
	);
}

function SidebarMenu({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu"
			data-sidebar="menu"
			className={cn('flex w-full min-w-0 flex-col', className)}
			{...props}
		/>
	);
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="sidebar-menu-item"
			data-sidebar="menu-item"
			className={cn('group/menu-item relative', className)}
			{...props}
		/>
	);
}

const sidebarMenuButtonVariants = cva(
	'peer/menu-button focus-row flex w-full items-center gap-1.5 overflow-hidden rounded-md px-2 text-left text-sm transition-[width,height,padding] hover:bg-hover active:bg-pressed disabled:pointer-events-none disabled:text-disabled-foreground group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:text-disabled-foreground data-[active=true]:bg-selection/50 group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
	{
		variants: {
			variant: {
				default: '',
				outline: 'border border-control-border bg-control-button hover:border-control-border-hover',
			},
			size: {
				default: 'h-(--mgn-height-row)',
				sm: 'h-(--mgn-height-row) text-xs',
				lg: 'h-12 text-sm group-data-[collapsible=icon]:p-0!',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

function SidebarMenuButton({
	asChild = false,
	isActive = false,
	variant = 'default',
	size = 'default',
	tooltip,
	className,
	...props
}: React.ComponentProps<'button'> & {
	asChild?: boolean;
	isActive?: boolean;
	tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
	const Comp = asChild ? Slot : 'button';
	const { isMobile, state } = useSidebar();

	const button = (
		<Comp
			data-slot="sidebar-menu-button"
			data-sidebar="menu-button"
			data-size={size}
			data-active={isActive}
			className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
			{...props}
		/>
	);

	if (!tooltip) {
		return button;
	}

	if (typeof tooltip === 'string') {
		tooltip = {
			children: tooltip,
		};
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>{button}</TooltipTrigger>
			<TooltipContent
				side="right"
				align="center"
				hidden={state !== 'collapsed' || isMobile}
				{...tooltip}
			/>
		</Tooltip>
	);
}

function SidebarMenuSkeleton({
	className,
	showIcon = false,
	...props
}: React.ComponentProps<'div'> & {
	showIcon?: boolean;
}) {
	const id = React.useId();
	let hash = 0;
	for (let i = 0; i < id.length; i++) {
		hash = (hash * 31 + id.charCodeAt(i)) | 0;
	}
	const width = `${(Math.abs(hash) % 40) + 50}%`;

	return (
		<div
			data-slot="sidebar-menu-skeleton"
			data-sidebar="menu-skeleton"
			className={cn('flex h-(--mgn-height-row) items-center gap-1.5 rounded-md px-2', className)}
			{...props}
		>
			{showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
			<Skeleton
				className="h-4 max-w-(--skeleton-width) flex-1"
				data-sidebar="menu-skeleton-text"
				style={
					{
						'--skeleton-width': width,
					} as React.CSSProperties
				}
			/>
		</div>
	);
}

function SidebarMenuSub({ className, ...props }: React.ComponentProps<'ul'>) {
	return (
		<ul
			data-slot="sidebar-menu-sub"
			data-sidebar="menu-sub"
			className={cn('flex min-w-0 flex-col', 'group-data-[collapsible=icon]:hidden', className)}
			{...props}
		/>
	);
}

export {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSkeleton,
	SidebarMenuSub,
	SidebarProvider,
	SidebarTrigger,
	useSidebar,
};
