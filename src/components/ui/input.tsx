import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'focus-field file:text-foreground placeholder:text-muted-foreground border-control-border bg-control text-foreground flex h-(--mgn-height-control) w-full min-w-0 rounded-md border px-2 text-base file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm md:text-sm',
				'disabled:border-field-disabled-border disabled:bg-field-disabled disabled:text-disabled-foreground disabled:pointer-events-none',
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
