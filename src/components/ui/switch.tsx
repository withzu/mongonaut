'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			className={cn(
				'peer focus-fill data-[state=checked]:bg-success-fill data-[state=unchecked]:bg-track disabled:bg-disabled! inline-flex h-5 w-9 shrink-0 items-center rounded-sm p-0.5 transition-colors disabled:cursor-not-allowed',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className={cn(
					'bg-on-status pointer-events-none block size-4 rounded-[2px] transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[disabled]:opacity-60',
				)}
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
