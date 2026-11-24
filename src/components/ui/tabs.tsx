'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col', className)} {...props} />
	);
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn('inline-flex h-(--mgn-height-header) w-fit items-stretch', className)}
			{...props}
		/>
	);
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(
				"focus-row after:bg-brand relative inline-flex items-center justify-center gap-1.5 px-3 text-sm whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:hidden after:h-[3px] after:rounded-[2px] hover:bg-hover disabled:pointer-events-none disabled:text-disabled-foreground data-[state=active]:hover:bg-transparent data-[state=active]:after:block [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn('focus-row flex-1', className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
