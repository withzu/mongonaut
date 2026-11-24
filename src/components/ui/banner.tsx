import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CircleAlertIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

const bannerVariants = cva(
	'text-foreground flex w-full items-start gap-2 rounded-lg border p-3 text-sm leading-paragraph [&>svg]:mt-px [&>svg]:size-4 [&>svg]:shrink-0',
	{
		variants: {
			variant: {
				info: 'border-control-border bg-chrome [&>svg]:text-muted-foreground',
				success: 'border-success-line bg-success-soft [&>svg]:text-success',
				warning: 'border-warning-line bg-warning-soft [&>svg]:text-warning',
				error: 'border-danger-line bg-danger-soft [&>svg]:text-danger-mark',
			},
		},
		defaultVariants: {
			variant: 'info',
		},
	},
);

const ICONS = {
	info: InfoIcon,
	success: CircleCheckIcon,
	warning: TriangleAlertIcon,
	error: CircleAlertIcon,
};

function Banner({
	className,
	variant,
	children,
	...props
}: React.ComponentProps<'div'> & VariantProps<typeof bannerVariants>) {
	const Icon = ICONS[variant ?? 'info'];

	return (
		<div
			data-slot="banner"
			role={variant === 'error' ? 'alert' : undefined}
			className={cn(bannerVariants({ variant }), className)}
			{...props}
		>
			<Icon aria-hidden="true" />
			<div className="min-w-0 flex-1 space-y-1 break-words">{children}</div>
		</div>
	);
}

export { Banner, bannerVariants };
