'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
	'focus-fill inline-flex h-5 items-center justify-center rounded-md border border-transparent px-1.5 text-xs w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none overflow-hidden',
	{
		variants: {
			variant: {
				default: 'bg-brand-soft text-brand-soft-foreground',
				secondary: 'bg-pressed text-foreground',
				destructive: 'border-danger-line bg-danger-soft text-destructive',
				success: 'border-success-line bg-success-soft text-success',
				outline: 'border-control-border text-foreground',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span';

	return (
		<Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
