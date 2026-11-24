'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent text-sm transition-colors disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					'focus-fill bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-pressed disabled:bg-disabled disabled:text-disabled-foreground',
				destructive:
					'focus-fill bg-danger-fill text-destructive-foreground hover:bg-danger-fill-hover active:bg-danger-fill-pressed disabled:bg-disabled disabled:text-disabled-foreground',
				outline:
					'focus-field border-control-border bg-control-button hover:border-control-border-hover active:border-control-border-pressed active:bg-control-button-pressed disabled:border-transparent disabled:bg-disabled disabled:text-disabled-foreground',
				secondary:
					'focus-fill bg-secondary text-secondary-foreground hover:bg-pressed disabled:bg-disabled disabled:text-disabled-foreground',
				ghost:
					'focus-row rounded-sm hover:bg-hover active:bg-pressed data-[state=open]:bg-pressed disabled:text-disabled-foreground',
				link: 'focus-fill text-link underline-offset-2 hover:underline disabled:text-disabled-foreground',
			},
			size: {
				default: 'h-(--mgn-height-control) px-3',
				sm: 'h-(--mgn-height-control-slim) px-3 has-[>svg]:px-2',
				icon: 'size-(--mgn-height-toolbar)',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
